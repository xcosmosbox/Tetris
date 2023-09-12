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
/** Constants */
export const Viewport = {
    CANVAS_WIDTH: 200,
    CANVAS_HEIGHT: 400,
    PREVIEW_WIDTH: 160,
    PREVIEW_HEIGHT: 80,
};
export const Constants = {
    TICK_RATE_MS: 500,
    GRID_WIDTH: 10,
    GRID_HEIGHT: 20,
    CUBE_NUMBERS: 4,
};
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
};
// Constant for the block's starting coordinates
export const initialPosition = {
    POSITION_0: {
        x: Block.WIDTH * (Math.floor(Viewport.CANVAS_WIDTH / Block.WIDTH / 2) - 2),
        y: 0,
    },
    POSITION_1: {
        x: Block.WIDTH * (Math.floor(Viewport.CANVAS_WIDTH / Block.WIDTH / 2) - 1),
        y: 0,
    },
    POSITION_2: {
        x: Block.WIDTH * Math.floor(Viewport.CANVAS_WIDTH / Block.WIDTH / 2),
        y: 0,
    },
    POSITION_3: {
        x: Block.WIDTH * (Math.floor(Viewport.CANVAS_WIDTH / Block.WIDTH / 2) + 1),
        y: 0,
    },
    POSITION_4: {
        x: Block.WIDTH * (Math.floor(Viewport.CANVAS_WIDTH / Block.WIDTH / 2) - 2),
        y: Block.HEIGHT,
    },
    POSITION_5: {
        x: Block.WIDTH * (Math.floor(Viewport.CANVAS_WIDTH / Block.WIDTH / 2) - 1),
        y: Block.HEIGHT,
    },
    POSITION_6: {
        x: Block.WIDTH * Math.floor(Viewport.CANVAS_WIDTH / Block.WIDTH / 2),
        y: Block.HEIGHT,
    },
    POSITION_7: {
        x: Block.WIDTH * (Math.floor(Viewport.CANVAS_WIDTH / Block.WIDTH / 2) + 1),
        y: Block.HEIGHT,
    },
};
/** State processing */
const initialState = {
    gameEnd: false,
    needToCreateCube: true,
    scoreAndDropRate: {
        gameLevel: 1,
        gameScore: 0,
        gameHighScore: 0,
        dropRate: 1,
    },
    oldGameCubes: new Array(Constants.GRID_HEIGHT)
        .fill(null)
        .map(() => new Array(Constants.GRID_WIDTH).fill(null)),
    shapeSeed: 0,
    colorSeed: 0,
};
/** Rendering (side effects) */
/**
 * Displays a SVG element on the canvas. Brings to foreground.
 * @param elem SVG element to display
 */
const show = (elem) => {
    elem.setAttribute("visibility", "visible");
    elem.parentNode.appendChild(elem);
};
/**
 * Hides a SVG element on the canvas.
 * @param elem SVG element to hide
 */
const hide = (elem) => elem.setAttribute("visibility", "hidden");
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
const createSvgElement = (namespace, name, props = {}) => {
    const elem = document.createElementNS(namespace, name);
    Object.entries(props).forEach(([k, v]) => elem.setAttribute(k, v));
    return elem;
};
/**
 * This is the function called on page load. Your main game loop
 * should be called here.
 */
export function main() {
    // Canvas elements
    const svg = document.querySelector("#svgCanvas");
    const preview = document.querySelector("#svgPreview");
    const gameover = document.querySelector("#gameOver");
    const gameRestart = document.querySelector("#gameRestart");
    const container = document.querySelector("#main");
    const replayButton = document.querySelector("#instantReplay");
    svg.setAttribute("height", `${Viewport.CANVAS_HEIGHT}`);
    svg.setAttribute("width", `${Viewport.CANVAS_WIDTH}`);
    preview.setAttribute("height", `${Viewport.PREVIEW_HEIGHT}`);
    preview.setAttribute("width", `${Viewport.PREVIEW_WIDTH}`);
    // Text fields
    const levelText = document.querySelector("#levelText");
    const scoreText = document.querySelector("#scoreText");
    const highScoreText = document.querySelector("#highScoreText");
    /** User input */
    const key$ = fromEvent(document, "keypress");
    // Observable on two different click events
    const mouseClick$ = fromEvent(document, "click").pipe(map(() => {
        return {
            type: "mouseClick",
        };
    }));
    const instantReplay$ = fromEvent(replayButton, "click").pipe(map(() => {
        return {
            type: "instantReplay",
        };
    }));
    const fromKey = (keyCode, userKeypress) => key$.pipe(filter(({ code }) => code === keyCode), map(() => userKeypress));
    // Observable of keyboard keys
    const left$ = fromKey("KeyA", { axis: "x", amount: -Block.WIDTH });
    const right$ = fromKey("KeyD", { axis: "x", amount: Block.WIDTH });
    const down$ = fromKey("KeyS", { axis: "y", amount: Block.HEIGHT });
    const rotate$ = fromKey("KeyW", { axis: "z", amount: 0 });
    // Observable of radom number generator
    const shpaeSeed$ = createRngStreamFromSource(interval(199))(3).pipe(map((val) => {
        return {
            shapeSeed: val,
        };
    }));
    const colorSeed$ = createRngStreamFromSource(interval(31))(7).pipe(map((val) => {
        return {
            colorSeed: val,
        };
    }));
    /** Observables */
    /** Determines the rate of time steps */
    const tick$ = interval(Constants.TICK_RATE_MS);
    /**
     * render new child to svg
     *
     * @param block one game block
     */
    const renderChildToSvg = (block) => {
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
    const renderChildToPreview = (block) => {
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
    const render = (s) => {
        var _a, _b, _c;
        // shown game level, score and highScore
        if (s.scoreAndDropRate) {
            levelText.textContent = ((_a = s.scoreAndDropRate.gameLevel) === null || _a === void 0 ? void 0 : _a.toString()) || "0";
            scoreText.textContent = ((_b = s.scoreAndDropRate.gameScore) === null || _b === void 0 ? void 0 : _b.toString()) || "0";
            highScoreText.textContent =
                ((_c = s.scoreAndDropRate.gameHighScore) === null || _c === void 0 ? void 0 : _c.toString()) || "0";
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
    const source$ = merge(tick$, left$, right$, down$, rotate$, mouseClick$, instantReplay$, shpaeSeed$, colorSeed$)
        .pipe(scan((s, action) => {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
        // round runs normally
        if (typeof action === "number") {
            return tick(s);
        }
        else if (action && "shapeSeed" in action && action.shapeSeed) {
            // Modify shapeSeed
            return Object.assign(Object.assign({}, s), { shapeSeed: action.shapeSeed });
        }
        else if (action && "colorSeed" in action && action.colorSeed) {
            // Modify colorSeed
            return Object.assign(Object.assign({}, s), { colorSeed: action.colorSeed });
        }
        else if (action && "type" in action && action.type === "mouseClick") {
            // Click event fires
            // restart the game
            if (s.gameEnd) {
                return Object.assign(Object.assign({}, initialState), { scoreAndDropRate: Object.assign(Object.assign({}, initialState.scoreAndDropRate), { gameHighScore: ((_a = s.scoreAndDropRate) === null || _a === void 0 ? void 0 : _a.gameScore) >
                            ((_b = initialState.scoreAndDropRate) === null || _b === void 0 ? void 0 : _b.gameHighScore) &&
                            ((_c = s.scoreAndDropRate) === null || _c === void 0 ? void 0 : _c.gameScore) >
                                ((_d = s.scoreAndDropRate) === null || _d === void 0 ? void 0 : _d.gameHighScore)
                            ? (_e = s.scoreAndDropRate) === null || _e === void 0 ? void 0 : _e.gameScore
                            : (_f = s.scoreAndDropRate) === null || _f === void 0 ? void 0 : _f.gameHighScore }) });
            }
            return s;
        }
        else if (action &&
            "type" in action &&
            action.type === "instantReplay") {
            // Restart the game immediately
            return Object.assign(Object.assign({}, initialState), { scoreAndDropRate: Object.assign(Object.assign({}, initialState.scoreAndDropRate), { gameHighScore: ((_g = s.scoreAndDropRate) === null || _g === void 0 ? void 0 : _g.gameScore) >
                        ((_h = initialState.scoreAndDropRate) === null || _h === void 0 ? void 0 : _h.gameHighScore) &&
                        ((_j = s.scoreAndDropRate) === null || _j === void 0 ? void 0 : _j.gameScore) >
                            ((_k = s.scoreAndDropRate) === null || _k === void 0 ? void 0 : _k.gameHighScore)
                        ? (_l = s.scoreAndDropRate) === null || _l === void 0 ? void 0 : _l.gameScore
                        : (_m = s.scoreAndDropRate) === null || _m === void 0 ? void 0 : _m.gameHighScore }) });
        }
        else {
            // Pass in the direction that needs to be modified
            return tick(s, action);
        }
    }, initialState))
        .subscribe((s) => {
        // render game
        render(s);
        if (s.gameEnd) {
            show(gameover);
            show(gameRestart);
        }
        else {
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
