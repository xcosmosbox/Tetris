import { Block, Constants, SHAPES, Viewport, initialPosition } from "./main";
import { leftFailed, leftSuccess, rightFailed, rightSuccess, downFailed, downSuccess, updateOldGameCubesUtil, createNewShapeFactory, needLineRemove, lineRemoved, getPoints, randomColor, isWithinBoundary, hasCollision, } from "./utils";
/**
 * An abstract class used to implement common functions
 * SimplyBlock implements the function of checking whether it can continue to move
 * It also completes the functions for position update and OldGameCubes update
 */
class SimplyBlock {
    constructor() {
        Object.defineProperty(this, "cubes", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Array(Constants.CUBE_NUMBERS).fill(null)
        });
        Object.defineProperty(this, "rotationLevel", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        // The moveHelper function receives multiple parameters to determine whether a collision occurs
        Object.defineProperty(this, "moveHelper", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: (block, s, amount, boundarySymbol, collisionSymbol, collisionRule, failed, success) => {
                // Check is within boundary
                if (isWithinBoundary(block.cubes, boundarySymbol, amount)) {
                    // Is there a collision
                    if (block.cubes.some((cube) => collisionRule(s, cube, collisionSymbol))) {
                        return failed(block, s);
                    }
                    else {
                        return success(block, s, amount);
                    }
                }
                else {
                    // If it is not in the boundary, it will be forced to return to the boundary
                    return s;
                }
            }
        });
        // Checks if it is possible to continue moving down
        Object.defineProperty(this, "checkContinueMove", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: (s) => {
                if (isWithinBoundary(this.cubes, "y", Block.HEIGHT)) {
                    if (this.checkContinueDown(s, this.cubes)) {
                        return false;
                    }
                    else {
                        return true;
                    }
                }
                else {
                    return false;
                }
            }
        });
        // update position
        Object.defineProperty(this, "updatePositions", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: (s) => {
                return this.moveDown(s, Block.HEIGHT);
            }
        });
        // update oldGameCubes
        Object.defineProperty(this, "updateOldGameCubes", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: (s) => {
                // Update using recursion
                const newOldGameCubes = this.updateOldGameCubesRec(0, s.oldGameCubes);
                return Object.assign(Object.assign({}, s), { oldGameCubes: newOldGameCubes });
            }
        });
        // util function to update the old game cubes by recursive method (FRP)
        Object.defineProperty(this, "updateOldGameCubesRec", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: (index, oldGameCubes) => {
                // recursive end condition
                if (index >= this.cubes.length) {
                    return oldGameCubes;
                }
                // Find the specified square based on rotationID
                const oneCube = this.cubes.find((cube) => cube.rotationID === index);
                // Save this block to state
                if (oneCube) {
                    const oldGameCubesUpdated = updateOldGameCubesUtil(oldGameCubes, Math.floor(oneCube.position.y / Block.HEIGHT), Math.floor(oneCube.position.x / Block.WIDTH), oneCube);
                    // go to next recursive
                    return this.updateOldGameCubesRec(index + 1, oldGameCubesUpdated);
                }
                return this.updateOldGameCubesRec(index + 1, oldGameCubes);
            }
        });
    }
}
// Implementation class of SimplyBlock
// SquareBlock implements all required functions
export class SquareBlock extends SimplyBlock {
    // Initialize four small cubes
    constructor(seed) {
        super();
        // The detection logic of the block moving to the left
        Object.defineProperty(this, "moveLeft", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: (s, amount) => {
                // Check is within boundary
                if (isWithinBoundary(this.cubes, "x", amount)) {
                    // Is there a collision
                    if (this.cubes.some((cube) => (cube.rotationID === 0 || cube.rotationID === 2) &&
                        hasCollision(s, cube, "l"))) {
                        return leftFailed(this, s);
                    }
                    else {
                        return leftSuccess(this, s, amount);
                    }
                }
                else {
                    return s;
                }
            }
        });
        // The detection logic of the block moving to the right
        Object.defineProperty(this, "moveRight", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: (s, amount) => {
                // Check is within boundary
                if (isWithinBoundary(this.cubes, "x", amount)) {
                    // Is there a collision
                    if (this.cubes.some((cube) => (cube.rotationID === 1 || cube.rotationID === 3) &&
                        hasCollision(s, cube, "r"))) {
                        return rightFailed(this, s);
                    }
                    else {
                        return rightSuccess(this, s, amount);
                    }
                }
                else {
                    return s;
                }
            }
        });
        // The detection logic of the block moving to the down
        Object.defineProperty(this, "moveDown", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: (s, amount) => {
                // Check is within boundary
                if (isWithinBoundary(this.cubes, "y", amount)) {
                    // Is there a collision
                    if (this.checkContinueDown(s, this.cubes)) {
                        return downFailed(this, s);
                    }
                    else {
                        return downSuccess(this, s, amount);
                    }
                }
                else {
                    return s;
                }
            }
        });
        Object.defineProperty(this, "rotate", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: (s) => {
                // Square block does not have rotation change
                return s;
            }
        });
        // When moving down
        // only need to pay attention to whether the blocks
        // with rotationID equal to 2 and 3 have no collision
        Object.defineProperty(this, "checkContinueDown", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: (s, cubes) => {
                return cubes.some((cube) => (cube.rotationID === 2 || cube.rotationID === 3) &&
                    hasCollision(s, cube, "d"));
            }
        });
        const newBlock = {
            color: randomColor(seed),
            shape: SHAPES.SQUARE_BLOCK,
            position: initialPosition.POSITION_1,
            rotationID: 0,
        };
        this.cubes = [
            newBlock,
            Object.assign(Object.assign({}, newBlock), { position: initialPosition.POSITION_2, rotationID: 1 }),
            Object.assign(Object.assign({}, newBlock), { position: initialPosition.POSITION_5, rotationID: 2 }),
            Object.assign(Object.assign({}, newBlock), { position: initialPosition.POSITION_6, rotationID: 3 }),
        ];
    }
}
// Implementation class of SimplyBlock
// RaisedBlock implements all required functions
export class RaisedBlock extends SimplyBlock {
    // Initialize four small cubes
    constructor(seed) {
        super();
        Object.defineProperty(this, "rotationLevel", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        // The detection logic of the block moving to the right
        Object.defineProperty(this, "moveRight", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: (s, amount) => {
                // Create collision rules
                const collisionRuleGenerator = (level) => {
                    return function collisionRule(state, cube, collisionSymbol) {
                        return (((level === 0 && (cube.rotationID === 3 || cube.rotationID === 0)) ||
                            (level === 2 && (cube.rotationID === 1 || cube.rotationID === 0)) ||
                            (level === 3 &&
                                (cube.rotationID === 0 ||
                                    cube.rotationID === 1 ||
                                    cube.rotationID === 3)) ||
                            (level === 1 &&
                                (cube.rotationID === 1 ||
                                    cube.rotationID === 2 ||
                                    cube.rotationID === 3))) &&
                            hasCollision(state, cube, collisionSymbol));
                    };
                };
                // Return collision check results
                return this.moveHelper(this, s, amount, "x", "r", collisionRuleGenerator(this.rotationLevel), rightFailed, rightSuccess);
            }
        });
        // The detection logic of the block moving to the down
        Object.defineProperty(this, "moveDown", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: (s, amount) => {
                // Check is within boundary
                if (isWithinBoundary(this.cubes, "y", amount)) {
                    // Is there a collision
                    if (this.checkContinueDown(s, this.cubes)) {
                        return downFailed(this, s);
                    }
                    else {
                        return downSuccess(this, s, amount);
                    }
                }
                else {
                    // If it is not in the boundary, it will be forced to return to the boundary
                    return s;
                }
            }
        });
        // Implemented rotation function
        Object.defineProperty(this, "rotate", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: (s) => {
                // Record the position before rotation
                const positionMap = this.cubes.reduce((acc, cube) => (Object.assign(Object.assign({}, acc), { [cube.rotationID]: cube.position })), {});
                // Depending on the rotationLevel, different rotation strategies
                // are implemented for blocks with different rotationIDs.
                // The reference coordinate of the rotation is the block with rotationID equal to 2
                if (this.rotationLevel === 0) {
                    const oneCube = this.cubes.find((cube) => cube.rotationID === 2);
                    if (oneCube && !hasCollision(s, oneCube, "d")) {
                        // rotate success
                        const newCubes = this.cubes.map((cube) => {
                            if (cube.rotationID === 0) {
                                return Object.assign(Object.assign({}, cube), { position: positionMap[1] });
                            }
                            else if (cube.rotationID === 1) {
                                return Object.assign(Object.assign({}, cube), { position: Object.assign(Object.assign({}, positionMap[2]), { y: positionMap[2].y + Block.HEIGHT }) });
                            }
                            else if (cube.rotationID === 2) {
                                return cube;
                            }
                            else {
                                return Object.assign(Object.assign({}, cube), { position: positionMap[0] });
                            }
                        });
                        this.cubes = newCubes;
                        this.rotationLevel = 1;
                    }
                    else {
                        // rotate failed
                        return s;
                    }
                }
                else if (this.rotationLevel === 1) {
                    const oneCube = this.cubes.find((cube) => cube.rotationID === 2);
                    if (oneCube &&
                        oneCube.position.x !== Viewport.CANVAS_WIDTH - Block.WIDTH &&
                        !hasCollision(s, oneCube, "r")) {
                        // rotate success
                        const newCubes = this.cubes.map((cube) => {
                            if (cube.rotationID === 0) {
                                return Object.assign(Object.assign({}, cube), { position: positionMap[1] });
                            }
                            else if (cube.rotationID === 1) {
                                return Object.assign(Object.assign({}, cube), { position: Object.assign(Object.assign({}, positionMap[2]), { x: positionMap[2].x + Block.WIDTH }) });
                            }
                            else if (cube.rotationID === 2) {
                                return cube;
                            }
                            else {
                                return Object.assign(Object.assign({}, cube), { position: positionMap[0] });
                            }
                        });
                        this.cubes = newCubes;
                        this.rotationLevel = 2;
                    }
                    else {
                        // rotate failed
                        return s;
                    }
                }
                else if (this.rotationLevel === 2) {
                    const oneCube = this.cubes.find((cube) => cube.rotationID === 2);
                    if (oneCube &&
                        !s.oldGameCubes[Math.floor(oneCube.position.y / Block.HEIGHT) - 1][Math.floor(oneCube.position.x / Block.WIDTH)]) {
                        // rotate success
                        const newCubes = this.cubes.map((cube) => {
                            if (cube.rotationID === 0) {
                                return Object.assign(Object.assign({}, cube), { position: positionMap[1] });
                            }
                            else if (cube.rotationID === 1) {
                                return Object.assign(Object.assign({}, cube), { position: Object.assign(Object.assign({}, positionMap[2]), { y: positionMap[2].y - Block.HEIGHT }) });
                            }
                            else if (cube.rotationID === 2) {
                                return cube;
                            }
                            else {
                                return Object.assign(Object.assign({}, cube), { position: positionMap[0] });
                            }
                        });
                        this.cubes = newCubes;
                        this.rotationLevel = 3;
                    }
                    else {
                        // rotate failed
                        return s;
                    }
                }
                else if (this.rotationLevel === 3) {
                    const oneCube = this.cubes.find((cube) => cube.rotationID === 2);
                    if (oneCube &&
                        oneCube.position.x !== 0 &&
                        !hasCollision(s, oneCube, "l")) {
                        // rotate success
                        const newCubes = this.cubes.map((cube) => {
                            if (cube.rotationID === 0) {
                                return Object.assign(Object.assign({}, cube), { position: positionMap[1] });
                            }
                            else if (cube.rotationID === 1) {
                                return Object.assign(Object.assign({}, cube), { position: Object.assign(Object.assign({}, positionMap[2]), { x: positionMap[2].x - Block.WIDTH }) });
                            }
                            else if (cube.rotationID === 2) {
                                return cube;
                            }
                            else {
                                return Object.assign(Object.assign({}, cube), { position: positionMap[0] });
                            }
                        });
                        this.cubes = newCubes;
                        this.rotationLevel = 0;
                    }
                    else {
                        // rotate failed
                        return s;
                    }
                }
                return s;
            }
        });
        // Check different boxes based on different rotationLevel
        Object.defineProperty(this, "checkContinueDown", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: (s, cubes) => {
                return cubes.some((cube) => {
                    return (((this.rotationLevel === 1 &&
                        (cube.rotationID === 1 || cube.rotationID === 0)) ||
                        (this.rotationLevel === 2 &&
                            (cube.rotationID === 0 ||
                                cube.rotationID === 1 ||
                                cube.rotationID === 3)) ||
                        (this.rotationLevel === 3 &&
                            (cube.rotationID === 3 || cube.rotationID === 0)) ||
                        (this.rotationLevel === 0 &&
                            (cube.rotationID === 1 ||
                                cube.rotationID === 2 ||
                                cube.rotationID === 3))) &&
                        hasCollision(s, cube, "d"));
                });
            }
        });
        const newBlock = {
            color: randomColor(seed),
            shape: SHAPES.RAISED_BLOCK,
            position: initialPosition.POSITION_1,
            rotationID: 0,
        };
        this.cubes = [
            newBlock,
            Object.assign(Object.assign({}, newBlock), { position: initialPosition.POSITION_4, rotationID: 1 }),
            Object.assign(Object.assign({}, newBlock), { position: initialPosition.POSITION_5, rotationID: 2 }),
            Object.assign(Object.assign({}, newBlock), { position: initialPosition.POSITION_6, rotationID: 3 }),
        ];
    }
    // The detection logic of the block moving to the left
    moveLeft(s, amount) {
        // Create collision rules
        const collisionRuleGenerator = (level) => {
            return function collisionRule(state, cube, collisionSymbol) {
                return (((level === 0 && (cube.rotationID === 1 || cube.rotationID === 0)) ||
                    (level === 1 &&
                        (cube.rotationID === 0 ||
                            cube.rotationID === 3 ||
                            cube.rotationID === 1)) ||
                    (level === 2 && (cube.rotationID === 3 || cube.rotationID === 0)) ||
                    (level === 3 &&
                        (cube.rotationID === 1 ||
                            cube.rotationID === 2 ||
                            cube.rotationID === 3))) &&
                    hasCollision(state, cube, collisionSymbol));
            };
        };
        // Return collision check results
        return this.moveHelper(this, s, amount, "x", "l", collisionRuleGenerator(this.rotationLevel), leftFailed, leftSuccess);
    }
}
// Implementation class of SimplyBlock
// LightningBlock implements all required functions
export class LightningBlock extends SimplyBlock {
    // Initialize four small cubes
    constructor(seed) {
        super();
        // cubes: GameCube[] = new Array(Constants.CUBE_NUMBERS).fill(null);
        Object.defineProperty(this, "rotationLevel", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        // The detection logic of the block moving to the left
        Object.defineProperty(this, "moveLeft", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: (s, amount) => {
                // Create collision rules
                const collisionRuleGenerator = (level) => {
                    return function collisionRule(state, cube, collisionSymbol) {
                        return (((level === 0 && (cube.rotationID === 2 || cube.rotationID === 0)) ||
                            (level === 1 &&
                                (cube.rotationID === 0 ||
                                    cube.rotationID === 3 ||
                                    cube.rotationID === 1)) ||
                            (level === 2 && (cube.rotationID === 3 || cube.rotationID === 1)) ||
                            (level === 3 &&
                                (cube.rotationID === 0 ||
                                    cube.rotationID === 2 ||
                                    cube.rotationID === 3))) &&
                            hasCollision(state, cube, collisionSymbol));
                    };
                };
                // Return collision check results
                return this.moveHelper(this, s, amount, "x", "l", collisionRuleGenerator(this.rotationLevel), leftFailed, leftSuccess);
            }
        });
        // The detection logic of the block moving to the right
        Object.defineProperty(this, "moveRight", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: (s, amount) => {
                // Create collision rules
                const collisionRuleGenerator = (level) => {
                    return function collisionRule(state, cube, collisionSymbol) {
                        return (((level === 0 && (cube.rotationID === 3 || cube.rotationID === 1)) ||
                            (level === 2 && (cube.rotationID === 2 || cube.rotationID === 0)) ||
                            (level === 3 &&
                                (cube.rotationID === 0 ||
                                    cube.rotationID === 1 ||
                                    cube.rotationID === 3)) ||
                            (level === 1 &&
                                (cube.rotationID === 0 ||
                                    cube.rotationID === 2 ||
                                    cube.rotationID === 3))) &&
                            hasCollision(state, cube, collisionSymbol));
                    };
                };
                // Return collision check results
                return this.moveHelper(this, s, amount, "x", "r", collisionRuleGenerator(this.rotationLevel), rightFailed, rightSuccess);
            }
        });
        // The detection logic of the block moving to the down
        Object.defineProperty(this, "moveDown", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: (s, amount) => {
                // Check is within boundary
                if (isWithinBoundary(this.cubes, "y", amount)) {
                    // Is there a collision
                    if (this.checkContinueDown(s, this.cubes)) {
                        return downFailed(this, s);
                    }
                    else {
                        return downSuccess(this, s, amount);
                    }
                }
                else {
                    // If it is not in the boundary, it will be forced to return to the boundary
                    return s;
                }
            }
        });
        // Implemented rotation function
        Object.defineProperty(this, "rotate", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: (s) => {
                // Record the position before rotation
                const positionMap = this.cubes.reduce((acc, cube) => (Object.assign(Object.assign({}, acc), { [cube.rotationID]: cube.position })), {});
                // Depending on the rotationLevel, different rotation strategies
                // are implemented for blocks with different rotationIDs.
                // The reference coordinate of the rotation is the block with rotationID equal to 2
                if (this.rotationLevel === 0) {
                    const oneCube = this.cubes.find((cube) => cube.rotationID === 2);
                    if (oneCube &&
                        !hasCollision(s, oneCube, "l") &&
                        !s.oldGameCubes[Math.floor(oneCube.position.y / Block.HEIGHT) + 1][Math.floor(oneCube.position.x / Block.WIDTH) - 1]) {
                        // rotate success
                        const newCubes = this.cubes.map((cube) => {
                            if (cube.rotationID === 0) {
                                return Object.assign(Object.assign({}, cube), { position: {
                                        x: positionMap[2].x - Block.WIDTH,
                                        y: positionMap[2].y + Block.HEIGHT,
                                    } });
                            }
                            else if (cube.rotationID === 1) {
                                return Object.assign(Object.assign({}, cube), { position: Object.assign(Object.assign({}, positionMap[2]), { x: positionMap[2].x - Block.WIDTH }) });
                            }
                            else if (cube.rotationID === 2) {
                                return cube;
                            }
                            else {
                                return Object.assign(Object.assign({}, cube), { position: positionMap[1] });
                            }
                        });
                        this.cubes = newCubes;
                        this.rotationLevel = 1;
                    }
                    else {
                        // rotate failed
                        return s;
                    }
                }
                else if (this.rotationLevel === 1) {
                    const oneCube = this.cubes.find((cube) => cube.rotationID === 2);
                    if (oneCube &&
                        oneCube.position.x !== Viewport.CANVAS_WIDTH - Block.WIDTH &&
                        !hasCollision(s, oneCube, "d") &&
                        !s.oldGameCubes[Math.floor(oneCube.position.y / Block.HEIGHT) + 1][Math.floor(oneCube.position.x / Block.WIDTH) + 1]) {
                        // rotate success
                        const newCubes = this.cubes.map((cube) => {
                            if (cube.rotationID === 0) {
                                return Object.assign(Object.assign({}, cube), { position: {
                                        x: positionMap[2].x + Block.WIDTH,
                                        y: positionMap[2].y + Block.HEIGHT,
                                    } });
                            }
                            else if (cube.rotationID === 1) {
                                return Object.assign(Object.assign({}, cube), { position: Object.assign(Object.assign({}, positionMap[2]), { y: positionMap[2].y + Block.HEIGHT }) });
                            }
                            else if (cube.rotationID === 2) {
                                return cube;
                            }
                            else {
                                return Object.assign(Object.assign({}, cube), { position: positionMap[1] });
                            }
                        });
                        this.cubes = newCubes;
                        this.rotationLevel = 2;
                    }
                    else {
                        // rotate failed
                        return s;
                    }
                }
                else if (this.rotationLevel === 2) {
                    const oneCube = this.cubes.find((cube) => cube.rotationID === 2);
                    if (oneCube &&
                        !hasCollision(s, oneCube, "r") &&
                        !s.oldGameCubes[Math.floor(oneCube.position.y / Block.HEIGHT) - 1][Math.floor(oneCube.position.x / Block.WIDTH) + 1]) {
                        // rotate success
                        const newCubes = this.cubes.map((cube) => {
                            if (cube.rotationID === 0) {
                                return Object.assign(Object.assign({}, cube), { position: {
                                        x: positionMap[2].x + Block.WIDTH,
                                        y: positionMap[2].y - Block.HEIGHT,
                                    } });
                            }
                            else if (cube.rotationID === 1) {
                                return Object.assign(Object.assign({}, cube), { position: Object.assign(Object.assign({}, positionMap[2]), { x: positionMap[2].x + Block.WIDTH }) });
                            }
                            else if (cube.rotationID === 2) {
                                return cube;
                            }
                            else {
                                return Object.assign(Object.assign({}, cube), { position: positionMap[1] });
                            }
                        });
                        this.cubes = newCubes;
                        this.rotationLevel = 3;
                    }
                    else {
                        // rotate failed
                        return s;
                    }
                }
                else if (this.rotationLevel === 3) {
                    const oneCube = this.cubes.find((cube) => cube.rotationID === 2);
                    if (oneCube &&
                        oneCube.position.x !== 0 &&
                        !s.oldGameCubes[Math.floor(oneCube.position.y / Block.HEIGHT) - 1][Math.floor(oneCube.position.x / Block.WIDTH)] &&
                        !s.oldGameCubes[Math.floor(oneCube.position.y / Block.HEIGHT) - 1][Math.floor(oneCube.position.x / Block.WIDTH) - 1]) {
                        // rotate success
                        const newCubes = this.cubes.map((cube) => {
                            if (cube.rotationID === 0) {
                                return Object.assign(Object.assign({}, cube), { position: {
                                        x: positionMap[2].x - Block.WIDTH,
                                        y: positionMap[2].y - Block.HEIGHT,
                                    } });
                            }
                            else if (cube.rotationID === 1) {
                                return Object.assign(Object.assign({}, cube), { position: Object.assign(Object.assign({}, positionMap[2]), { y: positionMap[2].y - Block.HEIGHT }) });
                            }
                            else if (cube.rotationID === 2) {
                                return cube;
                            }
                            else {
                                return Object.assign(Object.assign({}, cube), { position: positionMap[1] });
                            }
                        });
                        this.cubes = newCubes;
                        this.rotationLevel = 0;
                    }
                    else {
                        // rotate failed
                        return s;
                    }
                }
                return s;
            }
        });
        // Check different boxes based on different rotationLevel
        Object.defineProperty(this, "checkContinueDown", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: (s, cubes) => {
                return cubes.some((cube) => {
                    return (((this.rotationLevel === 1 &&
                        (cube.rotationID === 2 || cube.rotationID === 0)) ||
                        (this.rotationLevel === 2 &&
                            (cube.rotationID === 0 ||
                                cube.rotationID === 1 ||
                                cube.rotationID === 3)) ||
                        (this.rotationLevel === 3 &&
                            (cube.rotationID === 3 || cube.rotationID === 1)) ||
                        (this.rotationLevel === 0 &&
                            (cube.rotationID === 0 ||
                                cube.rotationID === 2 ||
                                cube.rotationID === 3))) &&
                        hasCollision(s, cube, "d"));
                });
            }
        });
        const newBlock = {
            color: randomColor(seed),
            shape: SHAPES.LIGHTNING_BLOCK,
            position: initialPosition.POSITION_1,
            rotationID: 0,
        };
        this.cubes = [
            newBlock,
            Object.assign(Object.assign({}, newBlock), { position: initialPosition.POSITION_2, rotationID: 1 }),
            Object.assign(Object.assign({}, newBlock), { position: initialPosition.POSITION_6, rotationID: 2 }),
            Object.assign(Object.assign({}, newBlock), { position: initialPosition.POSITION_7, rotationID: 3 }),
        ];
    }
}
// Implementation class of SimplyBlock
// LineBlock implements all required functions
export class LineBlock extends SimplyBlock {
    // Initialize four small cubes
    constructor(seed) {
        super();
        Object.defineProperty(this, "rotationLevel", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        // The detection logic of the block moving to the left
        Object.defineProperty(this, "moveLeft", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: (s, amount) => {
                // Create collision rules
                const collisionRuleGenerator = (level) => {
                    return function collisionRule(state, cube, collisionSymbol) {
                        return (((level === 0 && cube.rotationID === 0) ||
                            (level === 1 &&
                                (cube.rotationID === 0 ||
                                    cube.rotationID === 1 ||
                                    cube.rotationID === 2 ||
                                    cube.rotationID === 3))) &&
                            hasCollision(state, cube, collisionSymbol));
                    };
                };
                // Return collision check results
                return this.moveHelper(this, s, amount, "x", "l", collisionRuleGenerator(this.rotationLevel), leftFailed, leftSuccess);
            }
        });
        // The detection logic of the block moving to the right
        Object.defineProperty(this, "moveRight", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: (s, amount) => {
                // Create collision rules
                const collisionRuleGenerator = (level) => {
                    return function collisionRule(state, cube, collisionSymbol) {
                        return (((level === 0 && cube.rotationID === 3) ||
                            (level === 1 &&
                                (cube.rotationID === 0 ||
                                    cube.rotationID === 1 ||
                                    cube.rotationID === 2 ||
                                    cube.rotationID === 3))) &&
                            hasCollision(state, cube, collisionSymbol));
                    };
                };
                // Return collision check results
                return this.moveHelper(this, s, amount, "x", "r", collisionRuleGenerator(this.rotationLevel), rightFailed, rightSuccess);
            }
        });
        // The detection logic of the block moving to the down
        Object.defineProperty(this, "moveDown", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: (s, amount) => {
                // Check is within boundary
                if (isWithinBoundary(this.cubes, "y", amount)) {
                    // Is there a collision
                    if (this.checkContinueDown(s, this.cubes)) {
                        return downFailed(this, s);
                    }
                    else {
                        return downSuccess(this, s, amount);
                    }
                }
                else {
                    // If it is not in the boundary, it will be forced to return to the boundary
                    return s;
                }
            }
        });
        // Implemented rotation function
        Object.defineProperty(this, "rotate", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: (s) => {
                // Record the position before rotation
                const positionMap = this.cubes.reduce((acc, cube) => (Object.assign(Object.assign({}, acc), { [cube.rotationID]: cube.position })), {});
                // Depending on the rotationLevel, different rotation strategies
                // are implemented for blocks with different rotationIDs.
                // The reference coordinate of the rotation is the block with rotationID equal to 2
                if (this.rotationLevel === 0) {
                    const oneCube = this.cubes.find((cube) => cube.rotationID === 2);
                    if (oneCube &&
                        oneCube.position.y < Viewport.CANVAS_HEIGHT - Block.HEIGHT &&
                        oneCube.position.y >= 2 * Block.HEIGHT &&
                        !s.oldGameCubes[Math.floor(oneCube.position.y / Block.HEIGHT) - 1][Math.floor(oneCube.position.x / Block.WIDTH)] &&
                        !s.oldGameCubes[Math.floor(oneCube.position.y / Block.HEIGHT) - 2][Math.floor(oneCube.position.x / Block.WIDTH)] &&
                        !hasCollision(s, oneCube, "d")) {
                        // rotate success
                        const newCubes = this.cubes.map((cube) => {
                            if (cube.rotationID === 0) {
                                return Object.assign(Object.assign({}, cube), { position: {
                                        x: positionMap[2].x,
                                        y: positionMap[2].y - 2 * Block.HEIGHT,
                                    } });
                            }
                            else if (cube.rotationID === 1) {
                                return Object.assign(Object.assign({}, cube), { position: {
                                        x: positionMap[2].x,
                                        y: positionMap[2].y - Block.HEIGHT,
                                    } });
                            }
                            else if (cube.rotationID === 2) {
                                return cube;
                            }
                            else {
                                return Object.assign(Object.assign({}, cube), { position: {
                                        x: positionMap[2].x,
                                        y: positionMap[2].y + Block.HEIGHT,
                                    } });
                            }
                        });
                        this.cubes = newCubes;
                        this.rotationLevel = 1;
                    }
                    else {
                        // rotate failed
                        return s;
                    }
                }
                else if (this.rotationLevel === 1) {
                    const oneCube = this.cubes.find((cube) => cube.rotationID === 2);
                    if (oneCube &&
                        oneCube.position.x >= 2 * Block.WIDTH &&
                        oneCube.position.x < Viewport.CANVAS_WIDTH - Block.WIDTH &&
                        !s.oldGameCubes[Math.floor(oneCube.position.y / Block.HEIGHT)][Math.floor(oneCube.position.x / Block.WIDTH) - 2] &&
                        !hasCollision(s, oneCube, "l") &&
                        !hasCollision(s, oneCube, "r")) {
                        // rotate success
                        const newCubes = this.cubes.map((cube) => {
                            if (cube.rotationID === 0) {
                                return Object.assign(Object.assign({}, cube), { position: {
                                        x: positionMap[2].x - 2 * Block.WIDTH,
                                        y: positionMap[2].y,
                                    } });
                            }
                            else if (cube.rotationID === 1) {
                                return Object.assign(Object.assign({}, cube), { position: {
                                        x: positionMap[2].x - Block.WIDTH,
                                        y: positionMap[2].y,
                                    } });
                            }
                            else if (cube.rotationID === 2) {
                                return cube;
                            }
                            else {
                                return Object.assign(Object.assign({}, cube), { position: {
                                        x: positionMap[2].x + Block.WIDTH,
                                        y: positionMap[2].y,
                                    } });
                            }
                        });
                        this.cubes = newCubes;
                        this.rotationLevel = 0;
                    }
                    else {
                        // rotate failed
                        return s;
                    }
                }
                return s;
            }
        });
        // Check different boxes based on different rotationLevel
        Object.defineProperty(this, "checkContinueDown", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: (s, cubes) => {
                return cubes.some((cube) => {
                    return (((this.rotationLevel === 1 && cube.rotationID === 3) ||
                        (this.rotationLevel === 0 &&
                            (cube.rotationID === 0 ||
                                cube.rotationID === 1 ||
                                cube.rotationID === 2 ||
                                cube.rotationID === 3))) &&
                        hasCollision(s, cube, "d"));
                });
            }
        });
        const newBlock = {
            color: randomColor(seed),
            shape: SHAPES.LINE_BLOCK,
            position: initialPosition.POSITION_0,
            rotationID: 0,
        };
        this.cubes = [
            newBlock,
            Object.assign(Object.assign({}, newBlock), { position: initialPosition.POSITION_1, rotationID: 1 }),
            Object.assign(Object.assign({}, newBlock), { position: initialPosition.POSITION_2, rotationID: 2 }),
            Object.assign(Object.assign({}, newBlock), { position: initialPosition.POSITION_3, rotationID: 3 }),
        ];
    }
}
// Advanced Features
// An abstract class implements the movement logic of a single block
class SpecialBlock extends SimplyBlock {
    // Initialize the object with parameters
    constructor(color, shape) {
        super();
        Object.defineProperty(this, "color", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: color
        });
        Object.defineProperty(this, "shape", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: shape
        });
        // The detection logic of the block moving to the left
        Object.defineProperty(this, "moveLeft", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: (s, amount) => {
                // Check is within boundary
                if (isWithinBoundary(this.cubes, "x", amount)) {
                    // Is there a collision
                    if (this.cubes.some((cube) => hasCollision(s, cube, "l"))) {
                        return leftFailed(this, s);
                    }
                    else {
                        return leftSuccess(this, s, amount);
                    }
                }
                else {
                    return s;
                }
            }
        });
        // The detection logic of the block moving to the right
        Object.defineProperty(this, "moveRight", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: (s, amount) => {
                // Check is within boundary
                if (isWithinBoundary(this.cubes, "x", amount)) {
                    // Is there a collision
                    if (this.cubes.some((cube) => hasCollision(s, cube, "r"))) {
                        return rightFailed(this, s);
                    }
                    else {
                        return rightSuccess(this, s, amount);
                    }
                }
                else {
                    return s;
                }
            }
        });
        // The detection logic of the block moving to the down
        Object.defineProperty(this, "moveDown", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: (s, amount) => {
                // Check is within boundary
                if (isWithinBoundary(this.cubes, "y", amount)) {
                    // Is there a collision
                    if (this.checkContinueDown(s, this.cubes)) {
                        return downFailed(this, s);
                    }
                    else {
                        return downSuccess(this, s, amount);
                    }
                }
                else {
                    return s;
                }
            }
        });
        // Implemented rotation function
        Object.defineProperty(this, "rotate", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: (s) => {
                return s;
            }
        });
        Object.defineProperty(this, "checkContinueDown", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: (s, cubes) => {
                return cubes.some((cube) => hasCollision(s, cube, "d"));
            }
        });
        const newBlock = {
            color: color,
            shape: shape,
            position: initialPosition.POSITION_1,
            rotationID: 0,
        };
        this.cubes = [newBlock];
    }
}
// The star block has a unique elimination function.
// It can eliminate its own line and the adjacent lines above and below.
// (a total of three lines)
export class StarBlock extends SpecialBlock {
    constructor() {
        super("white", SHAPES.STAR);
    }
}
// The moment BombBlock stops moving,
// it will blow up itself and the blocks in the four directions, up, down, left, and right.
export class BombBlock extends SpecialBlock {
    constructor() {
        super("rgba(74, 64, 53, 0.7)", SHAPES.BOMB);
        Object.defineProperty(this, "updateOldGameCubes", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: (s) => {
                const oneCube = this.cubes[0];
                const deletePositions = this.getAdjacentPositions(oneCube.position);
                // Use the updateOldGameCubesUtil function to update the state. Assign the blown position to null.
                const deletedPosition = deletePositions.reduce((acc, position) => {
                    return updateOldGameCubesUtil(acc, Math.floor(position.y / Block.HEIGHT), Math.floor(position.x / Block.WIDTH), null);
                }, s.oldGameCubes);
                return Object.assign(Object.assign({}, s), { oldGameCubes: deletedPosition });
            }
        });
        // Get five coordinates including itself
        Object.defineProperty(this, "getAdjacentPositions", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: (position) => {
                const { x, y } = position;
                return [
                    { x: x, y: y - Block.HEIGHT },
                    { x: x, y: y + Block.HEIGHT },
                    { x: x - Block.WIDTH, y: y },
                    { x: x + Block.WIDTH, y: y },
                    { x, y },
                ];
            }
        });
    }
}
/**
 * Updates the state by proceeding with one time step.
 *
 * @param s Current state
 * @returns Updated state
 */
export const tick = (s, action = null) => {
    // If there is a block at the top, it means gameOver
    if (s.oldGameCubes[0].some((cube) => cube !== null)) {
        return Object.assign(Object.assign({}, s), { gameEnd: true });
    }
    // If there is no block, create it
    if (!s.currentGameCube || s.needToCreateCube) {
        const { currentBlock, nextBlock } = createNewShapeFactory(s, s.shapeSeed, s.colorSeed);
        return Object.assign(Object.assign({}, s), { currentGameCube: s.nextBlock || currentBlock, nextBlock: nextBlock, needToCreateCube: false });
    }
    // Check if any blocks need to be removed
    const checkLineRemove = (state) => {
        if (needLineRemove(state.oldGameCubes)) {
            return lineRemoved(state);
        }
        else {
            return state;
        }
    };
    // Check if it can be moved
    if (s.currentGameCube.checkContinueMove(s)) {
        // Perform operations based on the type of instruction
        if (action !== null) {
            // move to the left
            if (action.axis === "x" &&
                action.amount < 0) {
                const newState = s.currentGameCube.moveLeft(s, action.amount);
                return checkLineRemove(newState);
            }
            // move to the right
            else if (action.axis === "x" &&
                action.amount > 0) {
                const newState = s.currentGameCube.moveRight(s, action.amount);
                return checkLineRemove(newState);
            }
            // move to the down
            else if (action.axis === "y" &&
                action.amount > 0) {
                const newState = s.currentGameCube.moveDown(s, action.amount);
                return checkLineRemove(newState);
            }
            else if (action.axis === "z") {
                const newState = s.currentGameCube.rotate(s);
                return checkLineRemove(newState);
            }
        }
        else {
            // This is no special instruction, keep moving
            const newState = s.currentGameCube.updatePositions(s);
            return checkLineRemove(newState);
        }
    }
    else {
        // Cannot move
        // Save this block
        const storedOldState = s.currentGameCube.updateOldGameCubes(s);
        // Create new block
        const { currentBlock, nextBlock } = createNewShapeFactory(s, s.shapeSeed, s.colorSeed);
        // Checks if the game should end
        if (storedOldState.oldGameCubes[0].some((cube) => cube !== null)) {
            return Object.assign(Object.assign({}, getPoints(storedOldState)), { gameEnd: true });
        }
        return Object.assign(Object.assign({}, getPoints(storedOldState)), { currentGameCube: s.nextBlock || currentBlock, nextBlock: nextBlock });
    }
    return s;
};
