import { Block, Constants, SHAPES, Viewport, initialPosition } from "./main";
import {
  leftFailed,
  leftSuccess,
  rightFailed,
  rightSuccess,
  downFailed,
  downSuccess,
  updateOldGameCubesUtil,
  createNewShapeFactory,
  needLineRemove,
  lineRemoved,
  getPoints,
  randomColor,
  isWithinBoundary,
  hasCollision,
} from "./utils";

/**
 * An abstract class used to implement common functions
 * SimplyBlock implements the function of checking whether it can continue to move
 * It also completes the functions for position update and OldGameCubes update
 */
abstract class SimplyBlock implements GameBlock {
  constructor() {}
  cubes: GameCube[] = new Array(Constants.CUBE_NUMBERS).fill(null);
  rotationLevel: number = 0; 
  abstract moveLeft(s: State, amount: number): State;
  abstract moveRight(s: State, amount: number): State;
  abstract moveDown(s: State, amount: number): State;

  moveHelper = (block: GameBlock, s: State, amount: number, boundarySymbol:string, collisionSymbol:string, collisionRule:(state: State, cube:GameCube, collisionSymbol:string)=>boolean,
                failed:(failedBlock:GameBlock, state: State)=>State, success:(successBlock:GameBlock, state: State, amount: number)=>State):State => {
    // Check is within boundary
    if (isWithinBoundary(block.cubes, boundarySymbol, amount)) {
      // Is there a collision
      if (block.cubes.some((cube) => collisionRule(s, cube, collisionSymbol))) {
        return failed(block, s);
      } else {
        return success(block, s, amount);
      }
    } else {
      // If it is not in the boundary, it will be forced to return to the boundary
      return s;
    }
  }

  abstract rotate(s: State): State;

  // Checks if it is possible to continue moving down
  checkContinueMove = (s: State): boolean => {
    if (isWithinBoundary(this.cubes, "y", Block.HEIGHT)) {
      if (this.checkContinueDown(s, this.cubes)) {
        return false;
      } else {
        return true;
      }
    } else {
      return false;
    }
  };

  // Since the shapes represented by different classes are different, 
  // the specific implementation of this function is left to subclasses.
  abstract checkContinueDown(s: State, cubes: GameCube[]): boolean;
  
  // update position
  updatePositions = (s: State): State => {
    return this.moveDown(s, Block.HEIGHT);
  };

  // update oldGameCubes
  updateOldGameCubes = (s: State): State => {
    // Update using recursion
    const newOldGameCubes = this.updateOldGameCubesRec(
      0,
      s.oldGameCubes as GameCube[][]
    );
    return {
      ...s,
      oldGameCubes: newOldGameCubes,
    } as State;
  };
  // util function to update the old game cubes by recursive method (FRP)
  updateOldGameCubesRec = (
    index: number,
    oldGameCubes: GameCube[][]
  ): GameCube[][] => {
    // recursive end condition
    if (index >= this.cubes.length) {
      return oldGameCubes;
    }
    // Find the specified square based on rotationID
    const oneCube = this.cubes.find((cube) => cube.rotationID === index);

    // Save this block to state
    if (oneCube) {
      const oldGameCubesUpdated = updateOldGameCubesUtil(
        oldGameCubes,
        Math.floor((oneCube.position.y as number) / Block.HEIGHT),
        Math.floor((oneCube.position.x as number) / Block.WIDTH),
        oneCube
      );

      // go to next recursive
      return this.updateOldGameCubesRec(
        index + 1,
        oldGameCubesUpdated as GameCube[][]
      );
    }
    return this.updateOldGameCubesRec(index + 1, oldGameCubes);
  };
}

// Implementation class of SimplyBlock
// SquareBlock implements all required functions
export class SquareBlock extends SimplyBlock {
  // Initialize four small cubes
  constructor(seed: number) {
    super();
    const newBlock: GameCube = {
      color: randomColor(seed),
      shape: SHAPES.SQUARE_BLOCK,
      position: initialPosition.POSITION_1,
      rotationID: 0,
    };

    this.cubes = [
      newBlock,
      {
        ...newBlock,
        position: initialPosition.POSITION_2,
        rotationID: 1,
      },
      {
        ...newBlock,
        position: initialPosition.POSITION_5,
        rotationID: 2,
      },
      {
        ...newBlock,
        position: initialPosition.POSITION_6,
        rotationID: 3,
      },
    ];
  }

  // The detection logic of the block moving to the left
  moveLeft = (s: State, amount: number): State => {
    // Check is within boundary
    if (isWithinBoundary(this.cubes, "x", amount)) {
      // Is there a collision
      if (
        this.cubes.some(
          (cube) =>
            (cube.rotationID === 0 || cube.rotationID === 2) &&
            hasCollision(s, cube, "l")
        )
      ) {
        return leftFailed(this, s);
      } else {
        return leftSuccess(this, s, amount);
      }
    } else {
      // If it is not in the boundary, it will be forced to return to the boundary
      const newCubes = this.cubes.map((cube) => {
        if (cube.rotationID === 0 || cube.rotationID === 2) {
          return {
            ...cube,
            position: {
              x: 0,
              y: cube.position.y,
            },
          };
        } else {
          return {
            ...cube,
            position: {
              x: Block.WIDTH,
              y: cube.position.y,
            },
          };
        }
      });
      this.cubes = newCubes;
      return {
        ...s,
        currentGameCube: this,
      } as State;
    }
  };

  // The detection logic of the block moving to the right
  moveRight = (s: State, amount: number): State => {
    // Check is within boundary
    if (isWithinBoundary(this.cubes, "x", amount)) {
      // Is there a collision
      if (
        this.cubes.some(
          (cube) =>
            (cube.rotationID === 1 || cube.rotationID === 3) &&
            hasCollision(s, cube, "r")
        )
      ) {
        return rightFailed(this, s);
      } else {
        return rightSuccess(this, s, amount);
      }
    } else {
      // If it is not in the boundary, it will be forced to return to the boundary
      const newCubes = this.cubes.map((cube) => {
        if (cube.rotationID === 1 || cube.rotationID === 3) {
          return {
            ...cube,
            position: {
              x: Viewport.CANVAS_WIDTH - Block.WIDTH,
              y: cube.position.y,
            },
          };
        } else {
          return {
            ...cube,
            position: {
              x: Viewport.CANVAS_WIDTH - Block.WIDTH - Block.WIDTH,
              y: cube.position.y,
            },
          };
        }
      });
      this.cubes = newCubes;
      return {
        ...s,
        currentGameCube: this,
      } as State;
    }
  };

  // The detection logic of the block moving to the down
  moveDown = (s: State, amount: number): State => {
    // Check is within boundary
    if (isWithinBoundary(this.cubes, "y", amount)) {
      // Is there a collision
      if (this.checkContinueDown(s, this.cubes)) {
        return downFailed(this, s);
      } else {
        return downSuccess(this, s, amount);
      }
    } else {
      // If it is not in the boundary, it will be forced to return to the boundary
      const newCubes = this.cubes.map((cube) => {
        if (cube.rotationID === 2 || cube.rotationID === 3) {
          return {
            ...cube,
            position: {
              x: cube.position.x,
              y: Viewport.CANVAS_HEIGHT - Block.HEIGHT,
            },
          };
        } else {
          return {
            ...cube,
            position: {
              x: cube.position.x,
              y: Viewport.CANVAS_HEIGHT - Block.HEIGHT - Block.HEIGHT,
            },
          };
        }
      });
      this.cubes = newCubes;
      return {
        ...s,
        currentGameCube: this,
      } as State;
    }
  };
  rotate = (s: State): State => {
    // Square block does not have rotation change
    return s;
  };

  // When moving down 
  // only need to pay attention to whether the blocks 
  // with rotationID equal to 2 and 3 have no collision
  checkContinueDown = (s: State, cubes: GameCube[]) => {
    return cubes.some(
      (cube) =>
        (cube.rotationID === 2 || cube.rotationID === 3) &&
        hasCollision(s, cube, "d")
    );
  };
}

// Implementation class of SimplyBlock
// RaisedBlock implements all required functions
export class RaisedBlock extends SimplyBlock {
  // Initialize four small cubes
  constructor(seed: number) {
    super();
    const newBlock: GameCube = {
      color: randomColor(seed),
      shape: SHAPES.RAISED_BLOCK,
      position: initialPosition.POSITION_1,
      rotationID: 0,
    };

    this.cubes = [
      newBlock,
      {
        ...newBlock,
        position: initialPosition.POSITION_4,
        rotationID: 1,
      },
      {
        ...newBlock,
        position: initialPosition.POSITION_5,
        rotationID: 2,
      },
      {
        ...newBlock,
        position: initialPosition.POSITION_6,
        rotationID: 3,
      },
    ];
  }
  rotationLevel: number = 0;

  // The detection logic of the block moving to the left
  moveLeft(s: State, amount: number): State{

    const collisionRuleGenerator = (level: number) => {
      return function collisionRule(state: State, cube:GameCube, collisionSymbol:string):boolean  {
        return (
              ((level === 0 &&
                (cube.rotationID === 1 || cube.rotationID === 0)) ||
                (level === 1 &&
                  (cube.rotationID === 0 ||
                    cube.rotationID === 3 ||
                    cube.rotationID === 1)) ||
                (level === 2 &&
                  (cube.rotationID === 3 || cube.rotationID === 0)) ||
                (level === 3 &&
                  (cube.rotationID === 1 ||
                    cube.rotationID === 2 ||
                    cube.rotationID === 3))) &&
              hasCollision(state, cube, collisionSymbol)
            );
      } 
    }

    return this.moveHelper(this, s, amount, "x", "l", collisionRuleGenerator(this.rotationLevel), leftFailed, leftSuccess);
    
  };

  // The detection logic of the block moving to the right
  moveRight = (s: State, amount: number): State => {

    const collisionRuleGenerator = (level: number) => {
      return function collisionRule(state: State, cube:GameCube, collisionSymbol:string):boolean  {
        return (
          ((level === 0 &&
            (cube.rotationID === 3 || cube.rotationID === 0)) ||
            (level === 2 &&
              (cube.rotationID === 1 || cube.rotationID === 0)) ||
            (level === 3 &&
              (cube.rotationID === 0 ||
                cube.rotationID === 1 ||
                cube.rotationID === 3)) ||
            (level === 1 &&
              (cube.rotationID === 1 ||
                cube.rotationID === 2 ||
                cube.rotationID === 3))) &&
          hasCollision(state, cube, collisionSymbol)
        );
      } 
    }

    return this.moveHelper(this, s, amount, "x", "r", collisionRuleGenerator(this.rotationLevel), rightFailed, rightSuccess);

    // // Check is within boundary
    // if (isWithinBoundary(this.cubes, "x", amount)) {
    //    // Is there a collision
    //   if (
    //     this.cubes.some((cube) => {
    //       return (
    //         ((this.rotationLevel === 0 &&
    //           (cube.rotationID === 3 || cube.rotationID === 0)) ||
    //           (this.rotationLevel === 2 &&
    //             (cube.rotationID === 1 || cube.rotationID === 0)) ||
    //           (this.rotationLevel === 3 &&
    //             (cube.rotationID === 0 ||
    //               cube.rotationID === 1 ||
    //               cube.rotationID === 3)) ||
    //           (this.rotationLevel === 1 &&
    //             (cube.rotationID === 1 ||
    //               cube.rotationID === 2 ||
    //               cube.rotationID === 3))) &&
    //         hasCollision(s, cube, "r")
    //       );
    //     })
    //   ) {
    //     return rightFailed(this, s);
    //   } else {
    //     return rightSuccess(this, s, amount);
    //   }
    // } else {
    //   // If it is not in the boundary, it will be forced to return to the boundary
    //   return s;
    // }
  };

  // The detection logic of the block moving to the down
  moveDown = (s: State, amount: number): State => {
    // Check is within boundary
    if (isWithinBoundary(this.cubes, "y", amount)) {
      // Is there a collision
      if (this.checkContinueDown(s, this.cubes)) {
        return downFailed(this, s);
      } else {
        return downSuccess(this, s, amount);
      }
    } else {
      // If it is not in the boundary, it will be forced to return to the boundary
      return s;
    }
  };

  // Implemented rotation function
  rotate = (s: State): State => {
    // Record the position before rotation
    const positionMap: Record<number, Position> = this.cubes.reduce(
      (acc, cube) => ({ ...acc, [cube.rotationID]: cube.position }),
      {}
    );

    // Depending on the rotationLevel, different rotation strategies 
    // are implemented for blocks with different rotationIDs.
    // The reference coordinate of the rotation is the block with rotationID equal to 2
    if (this.rotationLevel === 0) {
      const oneCube = this.cubes.find((cube) => cube.rotationID === 2);
      if (oneCube && !hasCollision(s, oneCube, "d")) {
        // rotate success
        const newCubes = this.cubes.map((cube) => {
          if (cube.rotationID === 0) {
            return {
              ...cube,
              position: positionMap[1],
            } as GameCube;
          } else if (cube.rotationID === 1) {
            return {
              ...cube,
              position: {
                ...positionMap[2],
                y: positionMap[2].y + Block.HEIGHT,
              },
            } as GameCube;
          } else if (cube.rotationID === 2) {
            return cube;
          } else {
            return {
              ...cube,
              position: positionMap[0],
            } as GameCube;
          }
        });
        this.cubes = newCubes;
        this.rotationLevel = 1;
      } else {
        // rotate failed
        return s;
      }
    } else if (this.rotationLevel === 1) {
      const oneCube = this.cubes.find((cube) => cube.rotationID === 2);
      if (
        oneCube &&
        oneCube.position.x !== Viewport.CANVAS_WIDTH - Block.WIDTH &&
        !hasCollision(s, oneCube, "r")
      ) {
        // rotate success
        const newCubes = this.cubes.map((cube) => {
          if (cube.rotationID === 0) {
            return {
              ...cube,
              position: positionMap[1],
            } as GameCube;
          } else if (cube.rotationID === 1) {
            return {
              ...cube,
              position: {
                ...positionMap[2],
                x: positionMap[2].x + Block.WIDTH,
              },
            } as GameCube;
          } else if (cube.rotationID === 2) {
            return cube;
          } else {
            return {
              ...cube,
              position: positionMap[0],
            } as GameCube;
          }
        });
        this.cubes = newCubes;
        this.rotationLevel = 2;
      } else {
        // rotate failed
        return s;
      }
    } else if (this.rotationLevel === 2) {
      const oneCube = this.cubes.find((cube) => cube.rotationID === 2);
      if (
        oneCube &&
        !s.oldGameCubes[
          Math.floor((oneCube.position.y as number) / Block.HEIGHT) - 1
        ][Math.floor((oneCube.position.x as number) / Block.WIDTH)]
      ) {
        // rotate success
        const newCubes = this.cubes.map((cube) => {
          if (cube.rotationID === 0) {
            return {
              ...cube,
              position: positionMap[1],
            } as GameCube;
          } else if (cube.rotationID === 1) {
            return {
              ...cube,
              position: {
                ...positionMap[2],
                y: positionMap[2].y - Block.HEIGHT,
              },
            } as GameCube;
          } else if (cube.rotationID === 2) {
            return cube;
          } else {
            return {
              ...cube,
              position: positionMap[0],
            } as GameCube;
          }
        });
        this.cubes = newCubes;
        this.rotationLevel = 3;
      } else {
        // rotate failed
        return s;
      }
    } else if (this.rotationLevel === 3) {
      const oneCube = this.cubes.find((cube) => cube.rotationID === 2);
      if (
        oneCube &&
        oneCube.position.x !== 0 &&
        !hasCollision(s, oneCube, "l")
      ) {
        // rotate success
        const newCubes = this.cubes.map((cube) => {
          if (cube.rotationID === 0) {
            return {
              ...cube,
              position: positionMap[1],
            } as GameCube;
          } else if (cube.rotationID === 1) {
            return {
              ...cube,
              position: {
                ...positionMap[2],
                x: positionMap[2].x - Block.WIDTH,
              },
            } as GameCube;
          } else if (cube.rotationID === 2) {
            return cube;
          } else {
            return {
              ...cube,
              position: positionMap[0],
            } as GameCube;
          }
        });
        this.cubes = newCubes;
        this.rotationLevel = 0;
      } else {
        // rotate failed
        return s;
      }
    }
    return s;
  };

  // Check different boxes based on different rotationLevel
  checkContinueDown = (s: State, cubes: GameCube[]): boolean => {
    return cubes.some((cube) => {
      return (
        ((this.rotationLevel === 1 &&
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
        hasCollision(s, cube, "d")
      );
    });
  };
}

// Implementation class of SimplyBlock
// LightningBlock implements all required functions
export class LightningBlock extends SimplyBlock {
  // Initialize four small cubes
  constructor(seed: number) {
    super();
    const newBlock: GameCube = {
      color: randomColor(seed),
      shape: SHAPES.LIGHTNING_BLOCK,
      position: initialPosition.POSITION_1,
      rotationID: 0,
    };

    this.cubes = [
      newBlock,
      {
        ...newBlock,
        position: initialPosition.POSITION_2,
        rotationID: 1,
      },
      {
        ...newBlock,
        position: initialPosition.POSITION_6,
        rotationID: 2,
      },
      {
        ...newBlock,
        position: initialPosition.POSITION_7,
        rotationID: 3,
      },
    ];
  }
  // cubes: GameCube[] = new Array(Constants.CUBE_NUMBERS).fill(null);
  rotationLevel: number = 0;

  // The detection logic of the block moving to the left
  moveLeft = (s: State, amount: number): State => {

    const collisionRuleGenerator = (level: number) => {
      return function collisionRule(state: State, cube:GameCube, collisionSymbol:string):boolean  {
        return (
          ((level === 0 &&
            (cube.rotationID === 2 || cube.rotationID === 0)) ||
            (level === 1 &&
              (cube.rotationID === 0 ||
                cube.rotationID === 3 ||
                cube.rotationID === 1)) ||
            (level === 2 &&
              (cube.rotationID === 3 || cube.rotationID === 1)) ||
            (level === 3 &&
              (cube.rotationID === 0 ||
                cube.rotationID === 2 ||
                cube.rotationID === 3))) &&
          hasCollision(state, cube, collisionSymbol)
        );
      } 
    }

    return this.moveHelper(this, s, amount, "x", "l", collisionRuleGenerator(this.rotationLevel), leftFailed, leftSuccess);
  };

  // The detection logic of the block moving to the right
  moveRight = (s: State, amount: number): State => {

    const collisionRuleGenerator = (level: number) => {
      return function collisionRule(state: State, cube:GameCube, collisionSymbol:string):boolean  {
        return (
          ((level === 0 &&
            (cube.rotationID === 3 || cube.rotationID === 1)) ||
            (level === 2 &&
              (cube.rotationID === 2 || cube.rotationID === 0)) ||
            (level === 3 &&
              (cube.rotationID === 0 ||
                cube.rotationID === 1 ||
                cube.rotationID === 3)) ||
            (level === 1 &&
              (cube.rotationID === 0 ||
                cube.rotationID === 2 ||
                cube.rotationID === 3))) &&
            hasCollision(state, cube, collisionSymbol)
        );
      } 
    }

    return this.moveHelper(this, s, amount, "x", "r", collisionRuleGenerator(this.rotationLevel), rightFailed, rightSuccess);

  };

  // The detection logic of the block moving to the down
  moveDown = (s: State, amount: number): State => {
    // Check is within boundary
    if (isWithinBoundary(this.cubes, "y", amount)) {
      // Is there a collision
      if (this.checkContinueDown(s, this.cubes)) {
        return downFailed(this, s);
      } else {
        return downSuccess(this, s, amount);
      }
    } else {
      // If it is not in the boundary, it will be forced to return to the boundary
      return s;
    }
  };

  // Implemented rotation function
  rotate = (s: State): State => {
    // Record the position before rotation
    const positionMap: Record<number, Position> = this.cubes.reduce(
      (acc, cube) => ({ ...acc, [cube.rotationID]: cube.position }),
      {}
    );

    // Depending on the rotationLevel, different rotation strategies 
    // are implemented for blocks with different rotationIDs.
    // The reference coordinate of the rotation is the block with rotationID equal to 2
    if (this.rotationLevel === 0) {
      const oneCube = this.cubes.find((cube) => cube.rotationID === 2);
      if (
        oneCube &&
        !hasCollision(s, oneCube, "l") &&
        !s.oldGameCubes[
          Math.floor((oneCube.position.y as number) / Block.HEIGHT) + 1
        ][Math.floor((oneCube.position.x as number) / Block.WIDTH) - 1]
      ) {
        // rotate success
        const newCubes = this.cubes.map((cube) => {
          if (cube.rotationID === 0) {
            return {
              ...cube,
              position: {
                x: positionMap[2].x - Block.WIDTH,
                y: positionMap[2].y + Block.HEIGHT,
              },
            } as GameCube;
          } else if (cube.rotationID === 1) {
            return {
              ...cube,
              position: {
                ...positionMap[2],
                x: positionMap[2].x - Block.WIDTH,
              },
            } as GameCube;
          } else if (cube.rotationID === 2) {
            return cube;
          } else {
            return {
              ...cube,
              position: positionMap[1],
            } as GameCube;
          }
        });
        this.cubes = newCubes;
        this.rotationLevel = 1;
      } else {
        // rotate failed
        return s;
      }
    } else if (this.rotationLevel === 1) {
      const oneCube = this.cubes.find((cube) => cube.rotationID === 2);
      if (
        oneCube &&
        oneCube.position.x !== Viewport.CANVAS_WIDTH - Block.WIDTH &&
        !hasCollision(s, oneCube, "d") &&
        !s.oldGameCubes[
          Math.floor((oneCube.position.y as number) / Block.HEIGHT) + 1
        ][Math.floor((oneCube.position.x as number) / Block.WIDTH) + 1]
      ) {
        // rotate success
        const newCubes = this.cubes.map((cube) => {
          if (cube.rotationID === 0) {
            return {
              ...cube,
              position: {
                x: positionMap[2].x + Block.WIDTH,
                y: positionMap[2].y + Block.HEIGHT,
              },
            } as GameCube;
          } else if (cube.rotationID === 1) {
            return {
              ...cube,
              position: {
                ...positionMap[2],
                y: positionMap[2].y + Block.HEIGHT,
              },
            } as GameCube;
          } else if (cube.rotationID === 2) {
            return cube;
          } else {
            return {
              ...cube,
              position: positionMap[1],
            } as GameCube;
          }
        });
        this.cubes = newCubes;
        this.rotationLevel = 2;
      } else {
        // rotate failed
        return s;
      }
    } else if (this.rotationLevel === 2) {
      const oneCube = this.cubes.find((cube) => cube.rotationID === 2);
      if (
        oneCube &&
        !hasCollision(s, oneCube, "r") &&
        !s.oldGameCubes[
          Math.floor((oneCube.position.y as number) / Block.HEIGHT) - 1
        ][Math.floor((oneCube.position.x as number) / Block.WIDTH) + 1]
      ) {
        // rotate success
        const newCubes = this.cubes.map((cube) => {
          if (cube.rotationID === 0) {
            return {
              ...cube,
              position: {
                x: positionMap[2].x + Block.WIDTH,
                y: positionMap[2].y - Block.HEIGHT,
              },
            } as GameCube;
          } else if (cube.rotationID === 1) {
            return {
              ...cube,
              position: {
                ...positionMap[2],
                x: positionMap[2].x + Block.WIDTH,
              },
            } as GameCube;
          } else if (cube.rotationID === 2) {
            return cube;
          } else {
            return {
              ...cube,
              position: positionMap[1],
            } as GameCube;
          }
        });
        this.cubes = newCubes;
        this.rotationLevel = 3;
      } else {
        // rotate failed
        return s;
      }
    } else if (this.rotationLevel === 3) {
      const oneCube = this.cubes.find((cube) => cube.rotationID === 2);
      if (
        oneCube &&
        oneCube.position.x !== 0 &&
        !s.oldGameCubes[
          Math.floor((oneCube.position.y as number) / Block.HEIGHT) - 1
        ][Math.floor((oneCube.position.x as number) / Block.WIDTH)] &&
        !s.oldGameCubes[
          Math.floor((oneCube.position.y as number) / Block.HEIGHT) - 1
        ][Math.floor((oneCube.position.x as number) / Block.WIDTH) - 1]
      ) {
        // rotate success
        const newCubes = this.cubes.map((cube) => {
          if (cube.rotationID === 0) {
            return {
              ...cube,
              position: {
                x: positionMap[2].x - Block.WIDTH,
                y: positionMap[2].y - Block.HEIGHT,
              },
            } as GameCube;
          } else if (cube.rotationID === 1) {
            return {
              ...cube,
              position: {
                ...positionMap[2],
                y: positionMap[2].y - Block.HEIGHT,
              },
            } as GameCube;
          } else if (cube.rotationID === 2) {
            return cube;
          } else {
            return {
              ...cube,
              position: positionMap[1],
            } as GameCube;
          }
        });
        this.cubes = newCubes;
        this.rotationLevel = 0;
      } else {
        // rotate failed
        return s;
      }
    }

    return s;
  };

  // Check different boxes based on different rotationLevel
  checkContinueDown = (s: State, cubes: GameCube[]): boolean => {
    return cubes.some((cube) => {
      return (
        ((this.rotationLevel === 1 &&
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
        hasCollision(s, cube, "d")
      );
    });
  };
}

// Implementation class of SimplyBlock
// LineBlock implements all required functions
export class LineBlock extends SimplyBlock {
  // Initialize four small cubes
  constructor(seed: number) {
    super();
    const newBlock: GameCube = {
      color: randomColor(seed),
      shape: SHAPES.LINE_BLOCK,
      position: initialPosition.POSITION_0,
      rotationID: 0,
    };

    this.cubes = [
      newBlock,
      {
        ...newBlock,
        position: initialPosition.POSITION_1,
        rotationID: 1,
      },
      {
        ...newBlock,
        position: initialPosition.POSITION_2,
        rotationID: 2,
      },
      {
        ...newBlock,
        position: initialPosition.POSITION_3,
        rotationID: 3,
      },
    ];
  }

  rotationLevel: number = 0;

  // The detection logic of the block moving to the left
  moveLeft = (s: State, amount: number): State => {
    const collisionRuleGenerator = (level: number) => {
      return function collisionRule(state: State, cube:GameCube, collisionSymbol:string):boolean  {
        return (
          ((level === 0 && cube.rotationID === 0) ||
            (level === 1 &&
              (cube.rotationID === 0 ||
                cube.rotationID === 1 ||
                cube.rotationID === 2 ||
                cube.rotationID === 3))) &&
                hasCollision(state, cube, collisionSymbol)
        );
      } 
    }

    return this.moveHelper(this, s, amount, "x", "l", collisionRuleGenerator(this.rotationLevel), leftFailed, leftSuccess);
  };

  // The detection logic of the block moving to the right
  moveRight = (s: State, amount: number): State => {

    const collisionRuleGenerator = (level: number) => {
      return function collisionRule(state: State, cube:GameCube, collisionSymbol:string):boolean  {
        return (
          ((level=== 0 && cube.rotationID === 3) ||
            (level === 1 &&
              (cube.rotationID === 0 ||
                cube.rotationID === 1 ||
                cube.rotationID === 2 ||
                cube.rotationID === 3))) &&
                hasCollision(state, cube, collisionSymbol)
        );
      } 
    }

    return this.moveHelper(this, s, amount, "x", "r", collisionRuleGenerator(this.rotationLevel), rightFailed, rightSuccess);

  };

   // The detection logic of the block moving to the down
  moveDown = (s: State, amount: number): State => {
    // Check is within boundary
    if (isWithinBoundary(this.cubes, "y", amount)) {
      // Is there a collision
      if (this.checkContinueDown(s, this.cubes)) {
        return downFailed(this, s);
      } else {
        return downSuccess(this, s, amount);
      }
    } else {
      // If it is not in the boundary, it will be forced to return to the boundary
      return s;
    }
  };

  // Implemented rotation function
  rotate = (s: State): State => {
    // Record the position before rotation
    const positionMap: Record<number, Position> = this.cubes.reduce(
      (acc, cube) => ({ ...acc, [cube.rotationID]: cube.position }),
      {}
    );

    // Depending on the rotationLevel, different rotation strategies 
    // are implemented for blocks with different rotationIDs.
    // The reference coordinate of the rotation is the block with rotationID equal to 2
    if (this.rotationLevel === 0) {
      const oneCube = this.cubes.find((cube) => cube.rotationID === 2);
      if (
        oneCube &&
        oneCube.position.y < Viewport.CANVAS_HEIGHT - Block.HEIGHT &&
        oneCube.position.y >= 2 * Block.HEIGHT &&
        !s.oldGameCubes[
          Math.floor((oneCube.position.y as number) / Block.HEIGHT) - 1
        ][Math.floor((oneCube.position.x as number) / Block.WIDTH)] &&
        !s.oldGameCubes[
          Math.floor((oneCube.position.y as number) / Block.HEIGHT) - 2
        ][Math.floor((oneCube.position.x as number) / Block.WIDTH)] &&
        !hasCollision(s, oneCube, "d")
      ) {
        // rotate success
        const newCubes = this.cubes.map((cube) => {
          if (cube.rotationID === 0) {
            return {
              ...cube,
              position: {
                x: positionMap[2].x,
                y: positionMap[2].y - 2 * Block.HEIGHT,
              },
            } as GameCube;
          } else if (cube.rotationID === 1) {
            return {
              ...cube,
              position: {
                x: positionMap[2].x,
                y: positionMap[2].y - Block.HEIGHT,
              },
            } as GameCube;
          } else if (cube.rotationID === 2) {
            return cube;
          } else {
            return {
              ...cube,
              position: {
                x: positionMap[2].x,
                y: positionMap[2].y + Block.HEIGHT,
              },
            } as GameCube;
          }
        });
        this.cubes = newCubes;
        this.rotationLevel = 1;
      } else {
        // rotate failed
        return s;
      }
    } else if (this.rotationLevel === 1) {
      const oneCube = this.cubes.find((cube) => cube.rotationID === 2);
      if (
        oneCube &&
        oneCube.position.x >= 2 * Block.WIDTH &&
        oneCube.position.x < Viewport.CANVAS_WIDTH - Block.WIDTH &&
        !s.oldGameCubes[
          Math.floor((oneCube.position.y as number) / Block.HEIGHT)
        ][Math.floor((oneCube.position.x as number) / Block.WIDTH) - 2] &&
        !hasCollision(s, oneCube, "l") &&
        !hasCollision(s, oneCube, "r")
      ) {
        // rotate success
        const newCubes = this.cubes.map((cube) => {
          if (cube.rotationID === 0) {
            return {
              ...cube,
              position: {
                x: positionMap[2].x - 2 * Block.WIDTH,
                y: positionMap[2].y,
              },
            } as GameCube;
          } else if (cube.rotationID === 1) {
            return {
              ...cube,
              position: {
                x: positionMap[2].x - Block.WIDTH,
                y: positionMap[2].y,
              },
            } as GameCube;
          } else if (cube.rotationID === 2) {
            return cube;
          } else {
            return {
              ...cube,
              position: {
                x: positionMap[2].x + Block.WIDTH,
                y: positionMap[2].y,
              },
            } as GameCube;
          }
        });
        this.cubes = newCubes;
        this.rotationLevel = 0;
      } else {
        // rotate failed
        return s;
      }
    }

    return s;
  };

  // Check different boxes based on different rotationLevel
  checkContinueDown = (s: State, cubes: GameCube[]) => {
    return cubes.some((cube) => {
      return (
        ((this.rotationLevel === 1 && cube.rotationID === 3) ||
          (this.rotationLevel === 0 &&
            (cube.rotationID === 0 ||
              cube.rotationID === 1 ||
              cube.rotationID === 2 ||
              cube.rotationID === 3))) &&
        hasCollision(s, cube, "d")
      );
    });
  };
}

// Advanced Features
// An abstract class implements the movement logic of a single block
abstract class SpecialBlock extends SimplyBlock {
  // Initialize the object with parameters
  constructor(public readonly color: string, public readonly shape: number) {
    super();
    const newBlock: GameCube = {
      color: color,
      shape: shape,
      position: initialPosition.POSITION_1,
      rotationID: 0,
    } as GameCube;
    this.cubes = [newBlock];

  }

  // The detection logic of the block moving to the left
  moveLeft = (s: State, amount: number): State => {
    // Check is within boundary
    if (isWithinBoundary(this.cubes, "x", amount)) {
      // Is there a collision
      if (this.cubes.some((cube) => hasCollision(s, cube, "l"))) {
        return leftFailed(this, s);
      } else {
        return leftSuccess(this, s, amount);
      }
    } else {
      // If it is not in the boundary, it will be forced to return to the boundary
      const newCubes = this.cubes.map((cube) => {
        return {
          ...cube,
          position: {
            x: 0,
            y: cube.position.y,
          },
        };
      });
      this.cubes = newCubes;
      return {
        ...s,
        currentGameCube: this,
      } as State;
    }
  };

  // The detection logic of the block moving to the right
  moveRight = (s: State, amount: number): State => {
    // Check is within boundary
    if (isWithinBoundary(this.cubes, "x", amount)) {
      // Is there a collision
      if (this.cubes.some((cube) => hasCollision(s, cube, "r"))) {
        return rightFailed(this, s);
      } else {
        return rightSuccess(this, s, amount);
      }
    } else {
      // If it is not in the boundary, it will be forced to return to the boundary
      const newCubes = this.cubes.map((cube) => {
        return {
          ...cube,
          position: {
            x: Viewport.CANVAS_WIDTH - Block.WIDTH,
            y: cube.position.y,
          },
        };
      });
      this.cubes = newCubes;
      return {
        ...s,
        currentGameCube: this,
      } as State;
    }
  };

  // The detection logic of the block moving to the down
  moveDown = (s: State, amount: number): State => {
    // Check is within boundary
    if (isWithinBoundary(this.cubes, "y", amount)) {
       // Is there a collision
      if (this.checkContinueDown(s, this.cubes)) {
        return downFailed(this, s);
      } else {
        return downSuccess(this, s, amount);
      }
    } else {
      // If it is not in the boundary, it will be forced to return to the boundary
      const newCubes = this.cubes.map((cube) => {
        return {
          ...cube,
          position: {
            x: cube.position.x,
            y: Viewport.CANVAS_HEIGHT - Block.HEIGHT,
          },
        };
      });
      this.cubes = newCubes;
      return {
        ...s,
        currentGameCube: this,
      } as State;
    }
  };

  // Implemented rotation function
  rotate = (s: State): State => {
    return s;
  };
  checkContinueDown = (s: State, cubes: GameCube[]) => {
    return cubes.some((cube) => hasCollision(s, cube, "d"));
  };
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
  }
  override updateOldGameCubes = (s: State): State => {
    const oneCube = this.cubes[0];
    const deletePositions = this.getAdjacentPositions(oneCube.position);

    // Use the updateOldGameCubesUtil function to update the state. Assign the blown position to null.
    const deletedPosition = deletePositions.reduce((acc, position) => {
      return updateOldGameCubesUtil(
        acc,
        Math.floor((position.y as number) / Block.HEIGHT),
        Math.floor((position.x as number) / Block.WIDTH),
        null
      ) as GameCube[][];
    }, s.oldGameCubes as GameCube[][]);

    return {
      ...s,
      oldGameCubes: deletedPosition,
    } as State;
  };

  // Get five coordinates including itself
  getAdjacentPositions = (position: Position): Position[] => {
    const { x, y } = position;
    return [
      { x: x, y: y - Block.HEIGHT },
      { x: x, y: y + Block.HEIGHT },
      { x: x - Block.WIDTH, y: y },
      { x: x + Block.WIDTH, y: y },
      { x, y },
    ];
  };
}

/**
 * Updates the state by proceeding with one time step.
 *
 * @param s Current state
 * @returns Updated state
 */
export const tick = (s: State, action: ActionType = null): State => {
  // If there is a block at the top, it means gameOver
  if (s.oldGameCubes[0].some((cube) => cube !== null)) {
    return {
      ...s,
      gameEnd: true,
    } as State;
  }

  // If there is no block, create it
  if (!s.currentGameCube || s.needToCreateCube) {
    const { currentBlock, nextBlock } = createNewShapeFactory(s, s.shapeSeed, s.colorSeed);
    return {
      ...s,
      currentGameCube: s.nextBlock || currentBlock,
      nextBlock: nextBlock,
      needToCreateCube: false,
    } as State;
  }

  // Check if any blocks need to be removed
  const checkLineRemove = (state: State): State => {
    if (needLineRemove(state.oldGameCubes as GameCube[][])) {
      return lineRemoved(state);
    } else {
      return state;
    }
  }

  // Check if it can be moved
  if (s.currentGameCube.checkContinueMove(s)) {
    // Perform operations based on the type of instruction
    if (action !== null) {
      // move to the left
      if (
        (action as Keypress).axis === "x" &&
        (action as Keypress).amount < 0
      ) {
        const newState = s.currentGameCube.moveLeft(
          s,
          (action as Keypress).amount
        );
        return checkLineRemove(newState);
      } 
      // move to the right
      else if (
        (action as Keypress).axis === "x" &&
        (action as Keypress).amount > 0
      ) {
        const newState = s.currentGameCube.moveRight(
          s,
          (action as Keypress).amount
        );
        return checkLineRemove(newState);
      }
      // move to the down 
      else if (
        (action as Keypress).axis === "y" &&
        (action as Keypress).amount > 0
      ) {
        const newState = s.currentGameCube.moveDown(
          s,
          (action as Keypress).amount
        );
        return checkLineRemove(newState);
      } else if ((action as Keypress).axis === "z") {
        const newState = s.currentGameCube.rotate(s);
        return checkLineRemove(newState);
      }
    } else {
      // This is no special instruction, keep moving
      const newState = s.currentGameCube.updatePositions(s);
      return checkLineRemove(newState);
    }
  } else {
    // Cannot move
    // Save this block
    const storedOldState = s.currentGameCube.updateOldGameCubes(s);
    // Create new block
    const { currentBlock, nextBlock } = createNewShapeFactory(s, s.shapeSeed, s.colorSeed);
    // Checks if the game should end
    if (storedOldState.oldGameCubes[0].some((cube) => cube !== null)) {
      return {
        ...getPoints(storedOldState),
        gameEnd: true,
      } as State;
    }
    return {
      ...getPoints(storedOldState),
      currentGameCube: s.nextBlock || currentBlock,
      nextBlock: nextBlock,
    } as State;
  }
  return s;
};
