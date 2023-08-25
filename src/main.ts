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

/** Constants */

const Viewport = {
  CANVAS_WIDTH: 200,
  CANVAS_HEIGHT: 400,
  PREVIEW_WIDTH: 160,
  PREVIEW_HEIGHT: 80,
} as const;

const Constants = {
  TICK_RATE_MS: 500,
  GRID_WIDTH: 10,
  GRID_HEIGHT: 20,
} as const;

const Block = {
  WIDTH: Viewport.CANVAS_WIDTH / Constants.GRID_WIDTH,
  HEIGHT: Viewport.CANVAS_HEIGHT / Constants.GRID_HEIGHT,
};

/** User input */

type Key = "KeyS" | "KeyA" | "KeyD";

type Event = "keydown" | "keyup" | "keypress";

/** Utility functions */
// util function to simulate factory method to create the attribute for new block
const createNewShapeFactory = ():GameCube =>{
  const colors = ["red", "green", "blue", "yellow"];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];
  const newBlock:GameCube = {
    color: randomColor,
    shape: 0, // TODO: Change to SHAPE type, when i finished the basic feature
    position: { //init position
      x: Block.WIDTH * (Math.floor(Viewport.CANVAS_WIDTH / Block.WIDTH / 2) - 1),
      y: 0
    }
  };

  return newBlock;
}

// util function to check line removed and update related data
const checkLineRemoved = (s: State):ScoreAndDropRate =>{
  // TODO: update the score and call gameScoreChangeSubject.next(THE_LEAST_SCORE), gameScoreChange$ will subscribe the change
  return {...s.scoreAndDropRate} as ScoreAndDropRate;
}

/** State processing */

type Position = Readonly<{
  x:number,
  y:number
}>;

type GameCube = Readonly<{
  color:string;
  shape:number; // TODO: Change to SHAPE type, when i finished the basic feature
  position:Position;
}>;

type ScoreAndDropRate = Readonly<{
  gameLevel?:(number | null);
  gameScore?: (number|null);
  gameHighScore?: (number | null);
  dropRate?: (number | null);
}>

type State = Readonly<{
  gameEnd: boolean;
  currentGameCube?: (GameCube | null);
  oldGameCubes?: (GameCube | null)[]; // to record old blocks
  needToCreateCube?: (boolean | null);
  scoreAndDropRate?: (ScoreAndDropRate | null);
}>;

const initialState: State = {
  gameEnd: false,
  scoreAndDropRate: {
    gameLevel: 1,
    gameScore: 0,
    gameHighScore: 0,
    dropRate: Block.HEIGHT
  } as ScoreAndDropRate
  
} as const;

/**
 * Updates the state by proceeding with one time step.
 *
 * @param s Current state
 * @returns Updated state
 */
const tick = (s: State):State => {

  // check currentGameCube whether is exist
  if (!s.currentGameCube) {
    // does not exist
    // update currentGameCube and needToCreateCube
    return {
      ...s,
      currentGameCube: createNewShapeFactory(),
      needToCreateCube: true
    } as State;
  } else{
    const updateScoreAndDropRate = checkLineRemoved(s);
    return {
      ...s,
      needToCreateCube: false,
      scoreAndDropRate: checkLineRemoved(s)
    } as State;
  }

  return s;
};

const gameScoreChangeSubject = new BehaviorSubject<number>(initialState.scoreAndDropRate?.gameScore as number);
const gameScoreChange$ = gameScoreChangeSubject.asObservable();

const gameLevelChangeSubject = new BehaviorSubject<number>(initialState.scoreAndDropRate?.gameLevel as number);
const gameLevelChange$ = gameLevelChangeSubject.asObservable();

const gameHighScoreChangeSubject = new BehaviorSubject<number>(initialState.scoreAndDropRate?.gameHighScore as number);
const gameHighScoreChange$ = gameHighScoreChangeSubject.asObservable();

const dropRateChangeSubject = new BehaviorSubject<number>(initialState.scoreAndDropRate?.dropRate as number);
const dropRateChange$ = dropRateChangeSubject.asObservable();



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

  const fromKey = (keyCode: Key) =>
    key$.pipe(filter(({ code }) => code === keyCode));

  const left$ = fromKey("KeyA");
  const right$ = fromKey("KeyD");
  const down$ = fromKey("KeyS");

  /** Observables */

  /** Determines the rate of time steps */
  const tick$ = interval(Constants.TICK_RATE_MS);

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

    if (s.currentGameCube && s.needToCreateCube) {
      const cube = createSvgElement(svg.namespaceURI, "rect", {
        height: `${Block.HEIGHT}`,
        width: `${Block.WIDTH}`,
        x: `${s.currentGameCube.position.x}`,
        y: `${s.currentGameCube.position.y}`,
        style: "fill: "+`${s.currentGameCube.color}`,
      });
      svg.appendChild(cube);
    }



  };

  const source$ = merge(tick$)
    .pipe(
        scan((s: State) => tick(s), initialState)
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




