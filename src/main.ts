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

import { fromEvent, interval, merge } from "rxjs";
import { map, filter, scan } from "rxjs/operators";
import { tick } from "./state";
import { createRngStreamFromSource } from "./utils";
import { ActionType, ClickType, GameCube, Keypress, Position, RandomColorGenerator, RandomShapeGenerator, ScoreAndDropRate, State } from "./types";

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

// Shapes
export const SHAPES = {
  SQUARE_BLOCK: 0,
  RAISED_BLOCK: 1,
  LIGHTNING_BLOCK: 2,
  LINE_BLOCK: 3,
  BEDROCK: 4,
  STAR: 5,
  BOMB: 6,
} as const;

// Constant for the block's starting coordinates
export const initialPosition = {
  POSITION_0: {
    x: Block.WIDTH * (Math.floor(Viewport.CANVAS_WIDTH / Block.WIDTH / 2) - 2),
    y: 0,
  } as Position,
  POSITION_1: {
    x: Block.WIDTH * (Math.floor(Viewport.CANVAS_WIDTH / Block.WIDTH / 2) - 1),
    y: 0,
  } as Position,
  POSITION_2: {
    x: Block.WIDTH * Math.floor(Viewport.CANVAS_WIDTH / Block.WIDTH / 2),
    y: 0,
  } as Position,
  POSITION_3: {
    x: Block.WIDTH * (Math.floor(Viewport.CANVAS_WIDTH / Block.WIDTH / 2) + 1),
    y: 0,
  } as Position,
  POSITION_4: {
    x: Block.WIDTH * (Math.floor(Viewport.CANVAS_WIDTH / Block.WIDTH / 2) - 2),
    y: Block.HEIGHT,
  } as Position,
  POSITION_5: {
    x: Block.WIDTH * (Math.floor(Viewport.CANVAS_WIDTH / Block.WIDTH / 2) - 1),
    y: Block.HEIGHT,
  } as Position,
  POSITION_6: {
    x: Block.WIDTH * Math.floor(Viewport.CANVAS_WIDTH / Block.WIDTH / 2),
    y: Block.HEIGHT,
  } as Position,
  POSITION_7: {
    x: Block.WIDTH * (Math.floor(Viewport.CANVAS_WIDTH / Block.WIDTH / 2) + 1),
    y: Block.HEIGHT,
  } as Position,
};

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
    dropRate: 1,
  } as ScoreAndDropRate,
  oldGameCubes: new Array(Constants.GRID_HEIGHT)
    .fill(null)
    .map(() => new Array(Constants.GRID_WIDTH).fill(null)),
  shapeSeed: 0,
  colorSeed: 0,
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
  const gameRestart = document.querySelector(
    "#gameRestart"
  ) as SVGGraphicsElement & HTMLElement;
  const container = document.querySelector("#main") as HTMLElement;
  const replayButton = document.querySelector("#instantReplay") as HTMLElement;

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

  // Observable on two different click events
  const mouseClick$ = fromEvent<MouseEvent>(document, "click").pipe(
    map(() => {
      return {
        type: "mouseClick",
      } as ClickType;
    })
  );
  const instantReplay$ = fromEvent<MouseEvent>(replayButton, "click").pipe(
    map(() => {
      return {
        type: "instantReplay",
      } as ClickType;
    })
  );

  const fromKey = (keyCode: Key, userKeypress: Keypress) =>
    key$.pipe(
      filter(({ code }) => code === keyCode),
      map(() => userKeypress)
    );

  // Observable of keyboard keys
  const left$ = fromKey("KeyA", { axis: "x", amount: -Block.WIDTH });
  const right$ = fromKey("KeyD", { axis: "x", amount: Block.WIDTH });
  const down$ = fromKey("KeyS", { axis: "y", amount: Block.HEIGHT });
  const rotate$ = fromKey("KeyW", { axis: "z", amount: 0 });

  // Observable of radom number generator
  const shpaeSeed$ = createRngStreamFromSource(interval(199))(3).pipe(
    map((val) => {
      return {
        shapeSeed: val,
      } as RandomShapeGenerator;
    })
  );
  const colorSeed$ = createRngStreamFromSource(interval(31))(7).pipe(
    map((val) => {
      return {
        colorSeed: val,
      } as RandomColorGenerator;
    })
  );

  /** Observables */

  /** Determines the rate of time steps */
  const tick$ = interval(Constants.TICK_RATE_MS);

  /**
   * render new child to svg
   *
   * @param block one game block
   */
  const renderChildToSvg = (block: GameCube | null) => {
    if (block) {
      const cube = createSvgElement(svg.namespaceURI, "rect", {
        height: `${Block.HEIGHT}`,
        width: `${Block.WIDTH}`,
        x: `${block.position.x}`,
        y: `${block.position.y}`,
        style: "fill: " + `${block.color}`,
        class: "gameBlock",
      });
      svg.appendChild(cube);
    }
  };

  /**
   * render new child to preview
   * @param block one game cube
   */
  const renderChildToPreview = (block: GameCube | null) => {
    if (block) {
      // Add a block to the preview canvas
      const cubePreview = createSvgElement(preview.namespaceURI, "rect", {
        height: `${Block.HEIGHT}`,
        width: `${Block.WIDTH}`,
        x: `${block.position.x - Block.WIDTH}`,
        y: `${block.position.y + Block.HEIGHT}`,
        style: "fill: " + `${block.color}`,
        class: "preGameBlock",
      });
      preview.appendChild(cubePreview);
    }
  };

  /**
   * Renders the current state to the canvas.
   *
   * In MVC terms, this updates the View using the Model.
   *
   * @param s Current state
   */
  const render = (s: State) => {
    // shown game level, score and highScore
    if (s.scoreAndDropRate) {
      levelText.textContent = s.scoreAndDropRate.gameLevel?.toString() || "0";
      scoreText.textContent = s.scoreAndDropRate.gameScore?.toString() || "0";
      highScoreText.textContent =
        s.scoreAndDropRate.gameHighScore?.toString() || "0";
    }

    // refresh the svg view
    const blocks = svg.querySelectorAll(".gameBlock");
    blocks.forEach((block) => svg.removeChild(block));

    // refresh the preview
    const preBlocks = preview.querySelectorAll(".preGameBlock");
    preBlocks.forEach((block) => preview.removeChild(block));

    // render preview blocks
    if (s.nextBlock) {
      s.nextBlock.cubes.forEach((cube) => renderChildToPreview(cube));
    }

    // render current block
    if (s.currentGameCube) {
      s.currentGameCube.cubes.forEach((cube) => renderChildToSvg(cube));
    }

    // render old blocks
    if (s.oldGameCubes) {
      s.oldGameCubes.map((row) => row.map(renderChildToSvg));
    }
  };

  // merge all obserable stream
  const source$ = merge(
    tick$,
    left$,
    right$,
    down$,
    rotate$,
    mouseClick$,
    instantReplay$,
    shpaeSeed$,
    colorSeed$
  )
    .pipe(
      scan<ActionType, State>((s: State, action: ActionType) => {
        // round runs normally
        if (typeof action === "number") {
          return tick(s);
        } else if (action && "shapeSeed" in action && action.shapeSeed) {
          // Modify shapeSeed
          return { ...s, shapeSeed: action.shapeSeed } as State;
        } else if (action && "colorSeed" in action && action.colorSeed) {
          // Modify colorSeed
          return { ...s, colorSeed: action.colorSeed } as State;
        } else if (action && "type" in action && action.type === "mouseClick") {
          // Click event fires
          // restart the game
          if (s.gameEnd) {
            return {
              ...initialState,
              scoreAndDropRate: {
                ...initialState.scoreAndDropRate,
                gameHighScore:
                  (s.scoreAndDropRate?.gameScore as number) >
                    (initialState.scoreAndDropRate?.gameHighScore as number) &&
                  (s.scoreAndDropRate?.gameScore as number) >
                    (s.scoreAndDropRate?.gameHighScore as number)
                    ? s.scoreAndDropRate?.gameScore
                    : s.scoreAndDropRate?.gameHighScore,
              },
            } as State;
          }
          return s;
        } else if (
          action &&
          "type" in action &&
          action.type === "instantReplay"
        ) {
          // Restart the game immediately
          return {
            ...initialState,
            scoreAndDropRate: {
              ...initialState.scoreAndDropRate,
              gameHighScore:
                (s.scoreAndDropRate?.gameScore as number) >
                  (initialState.scoreAndDropRate?.gameHighScore as number) &&
                (s.scoreAndDropRate?.gameScore as number) >
                  (s.scoreAndDropRate?.gameHighScore as number)
                  ? s.scoreAndDropRate?.gameScore
                  : s.scoreAndDropRate?.gameHighScore,
            },
          } as State;
        } else {
          // Pass in the direction that needs to be modified
          return tick(s, action);
        }
      }, initialState)
    )
    .subscribe((s: State) => {
      // render game
      render(s);

      if (s.gameEnd) {
        show(gameover);
        show(gameRestart);
      } else {
        hide(gameover);
        hide(gameRestart);
      }
    });
}

// The following simply runs your main function on window load.  Make sure to leave it in place.
if (typeof window !== "undefined") {
  window.onload = () => {
    main();
  };
}
