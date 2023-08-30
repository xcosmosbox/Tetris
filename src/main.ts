/**
 * Inside this file you will use the classes and functions from rx.js
 * to add visuals to the svg element in index.html, animate them, and make them interactive.
 *
 * Study and complete the tasks in observable exercises first to get ideas.
 *
 * Course Notes showing Asteroids in FRP: https://tgdwyer.github.io/asteroids/
 *
 * You will be marked on your functional programming style
 * as well as the functionality that you implement.
 *
 * Document your code!
 */

import "./style.css";

import { BehaviorSubject, fromEvent, interval, merge } from "rxjs";
import { map, filter, scan, takeWhile } from "rxjs/operators";
import { tick } from "./state";


// /**
//  * ONLY FOR TEST
//  */
// const print = (message:any) =>{
//   console.log(message);
// }
// /**
//  * ONLY FOR TEST
//  */


/** Constants */
export const Viewport = {
  CANVAS_WIDTH: 200,
  CANVAS_HEIGHT: 400,
  PREVIEW_WIDTH: 160,
  PREVIEW_HEIGHT: 80,
} as const;

export const Constants = {
  TICK_RATE_MS: 500,
  GRID_WIDTH: 10,
  GRID_HEIGHT: 20,
  CUBE_NUMBERS: 4,
} as const;

export const Block = {
  WIDTH: Viewport.CANVAS_WIDTH / Constants.GRID_WIDTH,
  HEIGHT: Viewport.CANVAS_HEIGHT / Constants.GRID_HEIGHT,
};

export const SHAPES = {
  SQUARE_BLOCK: 0,
  RAISED_BLOCK: 1,
  LIGHTNING_BLOCK: 2,
  LINE_BLOCK: 3
} as const;

/** User input */

type Key = "KeyS" | "KeyA" | "KeyD" | "KeyW";

type Event = "keydown" | "keyup" | "keypress";


/** State processing */

const initialState: State = {
  gameEnd: false,
  needToCreateCube: true,
  scoreAndDropRate: {
    gameLevel: 1,
    gameScore: 0,
    gameHighScore: 0,
    dropRate: 1
  } as ScoreAndDropRate,
  oldGameCubes : new Array(Constants.GRID_HEIGHT).fill(null).map(()=>new Array(Constants.GRID_WIDTH).fill(null))
  
} as const;


/** Rendering (side effects) */

/**
 * Displays a SVG element on the canvas. Brings to foreground.
 * @param elem SVG element to display
 */
const show = (elem: SVGGraphicsElement) => {
  elem.setAttribute("visibility", "visible");
  elem.parentNode!.appendChild(elem);
};

/**
 * Hides a SVG element on the canvas.
 * @param elem SVG element to hide
 */
const hide = (elem: SVGGraphicsElement) =>
  elem.setAttribute("visibility", "hidden");

/**
 * Creates an SVG element with the given properties.
 *
 * See https://developer.mozilla.org/en-US/docs/Web/SVG/Element for valid
 * element names and properties.
 *
 * @param namespace Namespace of the SVG element
 * @param name SVGElement name
 * @param props Properties to set on the SVG element
 * @returns SVG element
 */
const createSvgElement = (
  namespace: string | null,
  name: string,
  props: Record<string, string> = {}
) => {
  const elem = document.createElementNS(namespace, name) as SVGElement;
  Object.entries(props).forEach(([k, v]) => elem.setAttribute(k, v));
  return elem;
};

/**
 * This is the function called on page load. Your main game loop
 * should be called here.
 */
export function main() {
  // Canvas elements
  const svg = document.querySelector("#svgCanvas") as SVGGraphicsElement &
    HTMLElement;
  const preview = document.querySelector("#svgPreview") as SVGGraphicsElement &
    HTMLElement;
  const gameover = document.querySelector("#gameOver") as SVGGraphicsElement &
    HTMLElement;
  const container = document.querySelector("#main") as HTMLElement;

  svg.setAttribute("height", `${Viewport.CANVAS_HEIGHT}`);
  svg.setAttribute("width", `${Viewport.CANVAS_WIDTH}`);
  preview.setAttribute("height", `${Viewport.PREVIEW_HEIGHT}`);
  preview.setAttribute("width", `${Viewport.PREVIEW_WIDTH}`);

  // Text fields
  const levelText = document.querySelector("#levelText") as HTMLElement;
  const scoreText = document.querySelector("#scoreText") as HTMLElement;
  const highScoreText = document.querySelector("#highScoreText") as HTMLElement;

  /** User input */

  const key$ = fromEvent<KeyboardEvent>(document, "keypress");

  

  const fromKey = (keyCode: Key, userKeypress: Keypress) =>
    key$.pipe(
      filter(({ code }) => code === keyCode),
      map(() => userKeypress)
    );

  const left$ = fromKey("KeyA", {axis:'x', amount: -Block.WIDTH});
  const right$ = fromKey("KeyD", {axis:'x', amount: Block.WIDTH});
  const down$ = fromKey("KeyS", {axis: 'y', amount: Block.HEIGHT});
  const rotate$ = fromKey("KeyW", { axis: 'z', amount: 0});

  /** Observables */

  /** Determines the rate of time steps */
  const tick$ = interval(Constants.TICK_RATE_MS);

  /**
   * render new child to svg
   * 
   * @param block one game block
   */
  const renderChildToSvg = (block: GameCube | null) => {
    if(block){
      const cube = createSvgElement(svg.namespaceURI, "rect", {
        height: `${Block.HEIGHT}`,
        width: `${Block.WIDTH}`,
        x: `${block.position.x}`,
        y: `${block.position.y}`,
        style: "fill: "+`${block.color}`,
        class: "gameBlock"
      });
      svg.appendChild(cube);
    }
  }

  const renderChildToPreview = (block: GameCube | null) => {
    if(block){
      // Add a block to the preview canvas
      const cubePreview = createSvgElement(preview.namespaceURI, "rect", {
        height: `${Block.HEIGHT}`,
        width: `${Block.WIDTH}`,
        x: `${block.position.x}`,
        y: `${block.position.y}`,
        style: "fill: "+`${block.color}`,
        class: "preGameBlock"
      });
      preview.appendChild(cubePreview);
    }
  }

  /**
   * Renders the current state to the canvas.
   *
   * In MVC terms, this updates the View using the Model.
   *
   * @param s Current state
   */
  const render = (s: State) => {
    // // Add a block to the preview canvas
    // const cubePreview = createSvgElement(preview.namespaceURI, "rect", {
    //   height: `${Block.HEIGHT}`,
    //   width: `${Block.WIDTH}`,
    //   x: `${Block.WIDTH * 2}`,
    //   y: `${Block.HEIGHT}`,
    //   style: "fill: green",
    // });
    // preview.appendChild(cubePreview);

    // refresh the svg view
    const blocks = svg.querySelectorAll('.gameBlock');
    blocks.forEach(block => svg.removeChild(block));

    // refresh the preview
    const preBlocks = preview.querySelectorAll('.preGameBlock');
    preBlocks.forEach(block => preview.removeChild(block));

    // render preview blocks
    if(s.nextBlock){
      s.nextBlock.cubes.forEach(cube => renderChildToPreview(cube));
    }

    // render current block
    if(s.currentGameCube){
      s.currentGameCube.cubes.forEach(cube => renderChildToSvg(cube));
      // renderChildToSvg(s.currentGameCube);
    }

    // render other blocks
    if(s.oldGameCubes){
      s.oldGameCubes.map(row => row.map(renderChildToSvg));
    }


    // // left top (0,0)
    // const cube = createSvgElement(svg.namespaceURI, "rect", {
    //   height: `${Block.HEIGHT}`,
    //   width: `${Block.WIDTH}`,
    //   x: `0`,
    //   y: `0`,
    //   style: "fill: "+`red`,
    // });
    // svg.appendChild(cube);

    // // right top (${Viewport.CANVAS_WIDTH-Block.WIDTH} , 0)
    // const cube2 = createSvgElement(svg.namespaceURI, "rect", {
    //   height: `${Block.HEIGHT}`,
    //   width: `${Block.WIDTH}`,
    //   x: `${Viewport.CANVAS_WIDTH-Block.WIDTH}`,
    //   y: `0`,
    //   style: "fill: "+`red`,
    // });
    // svg.appendChild(cube2);

    // // left bottom (0, {Viewport.CANVAS_HEIGHT - Block.HEIGHT})
    // const cube3 = createSvgElement(svg.namespaceURI, "rect", {
    //   height: `${Block.HEIGHT}`,
    //   width: `${Block.WIDTH}`,
    //   x: `0`,
    //   y: `${Viewport.CANVAS_HEIGHT - Block.HEIGHT}`,
    //   style: "fill: "+`red`,
    // });
    // svg.appendChild(cube3);

    // // left bottom (${Viewport.CANVAS_WIDTH - Block.WIDTH}, {Viewport.CANVAS_HEIGHT - Block.HEIGHT})
    // const cube4 = createSvgElement(svg.namespaceURI, "rect", {
    //   height: `${Block.HEIGHT}`,
    //   width: `${Block.WIDTH}`,
    //   x: `${Viewport.CANVAS_WIDTH - Block.WIDTH}`,
    //   y: `${Viewport.CANVAS_HEIGHT - Block.HEIGHT}`,
    //   style: "fill: "+`red`,
    // });
    // svg.appendChild(cube4);


  };


  const source$ = merge(tick$, left$, right$, down$, rotate$)
    .pipe(
        scan<ActionType, State>((s: State, action:ActionType) => {
          if(typeof action === 'number'){
            return tick(s);
          } else {
            return tick(s, action);
          }
        }, initialState)
      )
    .subscribe((s: State) => {
      render(s);
      
      if (s.gameEnd) {
        show(gameover);
      } else {
        hide(gameover);
      }
    });


}

// The following simply runs your main function on window load.  Make sure to leave it in place.
if (typeof window !== "undefined") {
  window.onload = () => {
    main();
  };
}




