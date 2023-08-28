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


/**
 * ONLY FOR TEST
 */
const print = (message:any) =>{
  console.log(message);
}
/**
 * ONLY FOR TEST
 */


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
  CUBE_NUMBERS: 4,
} as const;

const Block = {
  WIDTH: Viewport.CANVAS_WIDTH / Constants.GRID_WIDTH,
  HEIGHT: Viewport.CANVAS_HEIGHT / Constants.GRID_HEIGHT,
};

const SHAPES = {
  SQUARE_BLOCK: 0,
  RAISED_BLOCK: 1,
  LIGHTNING_BLOCK: 2,
  LINE_BLOCK: 3
} as const;

/** User input */

type Key = "KeyS" | "KeyA" | "KeyD";

type Event = "keydown" | "keyup" | "keypress";

/** Utility functions */
// util function to simulate factory method to create the attribute for new block
const createNewShapeFactory = ():GameBlock =>{
  // const shape = ["Square"];
  // const randomShape = shape[Math.floor(Math.random() * shape.length)];
  // if(randomShape === )

  return new SquareBlock();
}

// util function to check line whether is need to remove
const needLineRemove = (oldGameCubes: GameCube[][]): boolean => {
  // If a row in the array is completely filled, the representation can be eliminated
  return oldGameCubes.some(row => row.every(cube => cube !== null));
}
// util function to check line removed and update related data
const lineRemoved = (s: State):ScoreAndDropRate =>{
  // TODO: update the score and call gameScoreChangeSubject.next(THE_LEAST_SCORE), gameScoreChange$ will subscribe the change
  /** if (one line has been removed){
   *    const newScore = s.scoreAndDropRate.gameScore + getPoints;
   *    const newLevel = Math.floor(newScore / 100) + 1;
   *    const newHightScore = newScore > s.scoreAndDropRate.gameHighScore ? newScore : s.scoreAndDropRate.gameHighScore;
   *    const newDropRate = newLevel/10;
   *    return {newScore, newLevel, newHightScore, newDropRate} as ScoreAndDropRate;
   *  } */ 
  return {...s.scoreAndDropRate} as ScoreAndDropRate;
}

// util function to update position of block
// const updatePosition = (s: State, updateScoreAndDropRate:ScoreAndDropRate): Position =>{
//   // 
//   return {
//     x: s.currentGameCube?.position.x,
//     y: s.currentGameCube?.position.y as number + Block.HEIGHT * (1 + (updateScoreAndDropRate.dropRate as number))
//   } as Position;
// }

// util function to check whether is continue for current block TODO: check more detail for future
const checkContinueMove = (s: State): boolean =>{
  // go to create new game cube
  if(!s.currentGameCube){
    return false;
  }

  // If the cube reaches the bottom or there are other cubes below it, stop moving.
  // if(s.oldGameCubes && s.currentGameCube && 
  //   (s.currentGameCube?.position.y === Viewport.CANVAS_HEIGHT - Block.HEIGHT || 
  //     s.oldGameCubes[Math.floor((s.currentGameCube?.position.y as number)/Block.HEIGHT)+1][Math.floor((s.currentGameCube?.position.x as number)/Block.WIDTH)])){
  //       return false;
  // }

  return true;
}

//util function to map new array
const updateOldGameCubesUtil = (oldArray: GameCube[][], updateRow: number, updateCol: number, newValue: GameCube):GameCube[][] => {
  // Update the array at the corresponding position according to the specified row and col. 
  // Finally, a new two-dimensional array will be returned.
  return oldArray.map((row, i) => {
    if (i === updateRow){
      return row.map((cube, j) => {
        return j === updateCol ? newValue : cube;
      })
    }
    return row;
  });
}

// left failed
const leftFailed = (block: GameBlock, s: State): State => {
  const newCubes = block.cubes.map(cube => {
    return {
      ...cube,
      position:{
        x:Math.floor((cube.position.x as number)/Block.WIDTH)*Block.WIDTH,
        y:cube.position.y
      }
    }
  });
  block.cubes = newCubes;
  return {
    ...s,
    currentGameCube: block
  } as State;
}

// left success
const leftSuccess = (block: GameBlock, s: State, amount: number):State => {
  const newCubes = block.cubes.map(cube => {
    return {
      ...cube,
      position:{
        x:(cube.position.x as number)+amount,
        y:cube.position.y
      }
    }
  });
  block.cubes = newCubes;
  return {
    ...s,
    currentGameCube: block
  } as State;
}

// move left canvas
const moveLeftCanvas = (block: GameBlock, s: State):State => {
  const newCubes = block.cubes.map(cube => {
    if(cube.rotationID === 0 || cube.rotationID === 2){
      return {
        ...cube,
        position:{
          x:0,
          y:cube.position.y
        }
      }
    } else {
      return {
        ...cube,
        position:{
          x:Block.WIDTH,
          y:cube.position.y
        }
      }
    }
  });
  block.cubes = newCubes;
  return {
    ...s,
    currentGameCube: block
  } as State;
}

// util function to move
// const moveLeft = (s:State, amount:number): State => {
//   // left amount is negative number
//   if(s.currentGameCube?.position.x as number + amount >= 0){
//     if(s.oldGameCubes[Math.floor((s.currentGameCube?.position.y as number)/Block.HEIGHT)][Math.floor((s.currentGameCube?.position.x as number)/Block.WIDTH)-1]){
//       return {
//         ...s,
//         currentGameCube:{
//           ...s.currentGameCube,
//           position:{
//             x:Math.floor((s.currentGameCube?.position.x as number)/Block.WIDTH)*Block.WIDTH,
//             y:s.currentGameCube?.position.y
//           }
//         }
//       } as State;
//     } else{
//       return {
//         ...s,
//         currentGameCube:{
//           ...s.currentGameCube,
//           position:{
//             x:(s.currentGameCube?.position.x as number)+amount,
//             y:s.currentGameCube?.position.y
//           }
//         }
//       } as State;
//     }
//   } else {
//     return {
//       ...s,
//       currentGameCube:{
//         ...s.currentGameCube,
//         position:{
//           x:0,
//           y:s.currentGameCube?.position.y
//         }
//       }
//     } as State;
//   }
// }

// v:2.0
// move right failed
const rightFailed = (block: GameBlock, s: State): State => {
  const newCubes = block.cubes.map(cube => {
    return {
      ...cube,
      position:{
        x:Math.floor((cube.position.x as number)/Block.WIDTH)*Block.WIDTH,
        y:cube.position.y
      }
    }
  });
  block.cubes = newCubes;
  return {
    ...s,
    currentGameCube: block
  } as State;
}

// move right success
const rightSuccess = (block: GameBlock, s: State, amount: number): State => {
  const newCubes = block.cubes.map(cube => {
    return {
      ...cube,
      position:{
        x:(cube.position.x as number)+amount,
        y:cube.position.y
      }
    }
  });
  block.cubes = newCubes;
  return {
    ...s,
    currentGameCube: block
  } as State;
}

// move right canvas
const moveRightCanvas = (block: GameBlock, s: State): State => {
  const newCubes = block.cubes.map(cube => {
    if(cube.rotationID === 1 || cube.rotationID === 3){
      return {
        ...cube,
        position:{
          x:(Viewport.CANVAS_WIDTH-Block.WIDTH),
          y:cube.position.y
        }
      }
    } else {
      return {
        ...cube,
        position:{
          x:(Viewport.CANVAS_WIDTH-Block.WIDTH)-Block.WIDTH,
          y:cube.position.y
        }
      }
    }
  });
  block.cubes = newCubes;
  return {
    ...s,
    currentGameCube: block
  } as State;
}

// util function to move
// const moveRight = (s:State, amount:number): State => {
//   if(s.currentGameCube?.position.x as number + amount <= (Viewport.CANVAS_WIDTH-Block.WIDTH)){
//     if(s.oldGameCubes[Math.floor((s.currentGameCube?.position.y as number)/Block.HEIGHT)][Math.floor((s.currentGameCube?.position.x as number)/Block.WIDTH)+1]){
//       return {
//         ...s,
//         currentGameCube:{
//           ...s.currentGameCube,
//           position:{
//             x:Math.floor((s.currentGameCube?.position.x as number)/Block.WIDTH)*Block.WIDTH,
//             y:s.currentGameCube?.position.y
//           }
//         }
//       } as State;
//     } else {
//       return {
//         ...s,
//         currentGameCube:{
//           ...s.currentGameCube,
//           position:{
//             x:(s.currentGameCube?.position.x as number)+amount,
//             y:s.currentGameCube?.position.y
//           }
//         }
//       } as State;
//     }
//   } else {
//     return {
//       ...s,
//       currentGameCube:{
//         ...s.currentGameCube,
//         position:{
//           x:(Viewport.CANVAS_WIDTH-Block.WIDTH),
//           y:s.currentGameCube?.position.y
//         }
//       }
//     } as State;
//   }
// }

const downFailed = (block: GameBlock, s: State): State => {
  const newCubes = block.cubes.map(cube => {
    return {
      ...cube,
      position:{
        x:cube.position.x,
        y:Math.floor((cube.position.y as number)/Block.HEIGHT)*Block.HEIGHT
      }
    }
  });
  block.cubes = newCubes;
  return {
    ...s,
    currentGameCube: block
  } as State;
}

const downSuccess = (block: GameBlock, s: State, amount: number): State => {
  const newCubes = block.cubes.map(cube => {
    return {
      ...cube,
      position:{
        x:cube.position.x,
        y:(cube.position.y as number) + amount
      }
    }
  });
  block.cubes = newCubes;
  return {
    ...s,
    currentGameCube: block
  } as State;
}

const moveBottomCanvas = (block: GameBlock, s: State): State => {
  const newCubes = block.cubes.map(cube => {
    if(cube.rotationID === 2 || cube.rotationID === 3){
      return {
        ...cube,
        position:{
          x:cube.position.x,
          y:Viewport.CANVAS_HEIGHT-Block.HEIGHT
        }
      }
    } else {
      return {
        ...cube,
        position:{
          x:cube.position.x,
          y:Viewport.CANVAS_HEIGHT-Block.HEIGHT-Block.HEIGHT
        }
      }
    }
  });
  block.cubes = newCubes;
  return {
    ...s,
    currentGameCube: block
  } as State;
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
  svgCoordinates:SvgCoordinate;
  rotationID:number;
}>;

type ScoreAndDropRate = Readonly<{
  gameLevel?:(number | null);
  gameScore?: (number|null);
  gameHighScore?: (number | null);
  dropRate?: (number | null);
}>

type State = Readonly<{
  gameEnd: boolean;
  currentGameCube?: (GameBlock | null);
  oldGameCubes: (GameCube | null)[][]; // to record old blocks
  needToCreateCube?: (boolean | null);
  scoreAndDropRate: (ScoreAndDropRate | null);
}>;

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

type Keypress = Readonly<{
  axis: 'x' | 'y',
  amount: number
}>;

type ActionType = ((number | Keypress) | null);

interface SvgCoordinate{
  index_x: number;
  index_y: number;
}

interface GameBlock{
  cubes: GameCube[];
  moveLeft(s: State, amount:number): State;
  moveRight(s: State, amount:number): State;
  moveDown(s: State, amount:number): State;
  rotate(s: State): State;
  checkContinueMove(s: State): boolean;
  updatePositions(s: State): State;
  updateOldGameCubes(s: State): State;
}

class SquareBlock implements GameBlock{
  constructor(){
    const colors = ["red", "green", "blue", "yellow"];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const newBlock:GameCube = {
      color: randomColor,
      shape: SHAPES.SQUARE_BLOCK,
      position: { //init position
        x: Block.WIDTH * (Math.floor(Viewport.CANVAS_WIDTH / Block.WIDTH / 2) - 1),
        y: 0
      },
      svgCoordinates: {
        index_x: 0,
        index_y: Viewport.CANVAS_WIDTH / (Block.WIDTH * (Math.floor(Viewport.CANVAS_WIDTH / Block.WIDTH / 2) - 1))
      }, 
      rotationID: 0
    };
    
    this.cubes = [newBlock, {
      ...newBlock,
      position: {
        x: Block.WIDTH * (Math.floor(Viewport.CANVAS_WIDTH / Block.WIDTH / 2)),
        y: 0
      },
      svgCoordinates: {
        index_x: 0,
        index_y: Viewport.CANVAS_WIDTH / Block.WIDTH * (Math.floor(Viewport.CANVAS_WIDTH / Block.WIDTH / 2))
      }, 
      rotationID: 1
    }, {
      ...newBlock,
      position: {
        x: Block.WIDTH * (Math.floor(Viewport.CANVAS_WIDTH / Block.WIDTH / 2) - 1),
        y: newBlock.position.y + Block.HEIGHT
      },
      svgCoordinates: {
        index_x: 1,
        index_y: Viewport.CANVAS_WIDTH / (Block.WIDTH * (Math.floor(Viewport.CANVAS_WIDTH / Block.WIDTH / 2) - 1))
      },
      rotationID: 2
    }, {
      ...newBlock,
      position: {
        x: Block.WIDTH * (Math.floor(Viewport.CANVAS_WIDTH / Block.WIDTH / 2)),
        y: newBlock.position.y + Block.HEIGHT
      },
      svgCoordinates: {
        index_x: 1,
        index_y: Viewport.CANVAS_WIDTH / Block.WIDTH * (Math.floor(Viewport.CANVAS_WIDTH / Block.WIDTH / 2))
      },
      rotationID: 3
    }];
  }
  
  cubes: GameCube[] = new Array(Constants.CUBE_NUMBERS).fill(null);
  moveLeft = (s: State, amount:number): State => {
    if(this.cubes.every(cube => cube.position.x as number + amount >= 0)){
      if (this.cubes.some(cube => (cube.rotationID === 0 || cube.rotationID === 2) && 
        s.oldGameCubes[Math.floor(cube.position.y as number / Block.HEIGHT)][Math.floor(cube.position.x as number / Block.WIDTH)-1])) {
        return leftFailed(this, s);
      } else {
        return leftSuccess(this, s, amount);
      }
    } else {
      return moveLeftCanvas(this, s);
    }
  }
  moveRight = (s: State, amount:number): State => {
    if(this.cubes.every(cube => cube.position.x as number + amount <= (Viewport.CANVAS_WIDTH-Block.WIDTH))){
      if(this.cubes.some(cube => (cube.rotationID === 1 || cube.rotationID === 3) &&
        s.oldGameCubes[Math.floor(cube.position.y as number / Block.HEIGHT)][Math.floor(cube.position.x as number / Block.WIDTH)+1])){
          return rightFailed(this, s);
      } else {
        return rightSuccess(this, s, amount);
      }
    } else {
      return moveRightCanvas(this, s);
    }
  }
  moveDown = (s: State, amount:number): State => {
    if(this.cubes.every(cube => cube.position.y as number + amount <= (Viewport.CANVAS_HEIGHT-Block.HEIGHT))){
      if(this.cubes.some(cube => (cube.rotationID === 2 || cube.rotationID === 3) && 
        s.oldGameCubes[Math.floor(cube.position.y as number / Block.HEIGHT)+1][Math.floor(cube.position.x as number / Block.WIDTH)])){
          return downFailed(this, s);
        } else {
          return downSuccess(this, s, amount);
        }
    } else {
      return moveBottomCanvas(this, s);
    }
  }
  rotate = (s: State): State => {
    // Square block does not have ration change
    return s;
  }
  checkContinueMove = (s: State): boolean => {
    if(this.cubes.every(cube => cube.position.y as number + Block.HEIGHT*(s.scoreAndDropRate?.dropRate as number) <= (Viewport.CANVAS_HEIGHT-Block.HEIGHT))){
      if(this.cubes.some(cube => (cube.rotationID === 2 || cube.rotationID === 3) && 
        s.oldGameCubes[Math.floor(cube.position.y as number / Block.HEIGHT)+1][Math.floor(cube.position.x as number / Block.WIDTH)])){
          return false;
        } else {
          return true;
        }
    } else {
      return false;
    }
  }
  updatePositions = (s: State): State => {
    return this.moveDown(s, Block.HEIGHT*(s.scoreAndDropRate?.dropRate as number));
  }
  updateOldGameCubes = (s: State): State => {
    const newOldGameCubes = this.updateOldGameCubesRec(0, s.oldGameCubes as GameCube[][]);
    return {
      ...s,
      oldGameCubes: newOldGameCubes
    } as State;
  }
  // util function to update the old game cubes by recursive method
  updateOldGameCubesRec = (index: number, oldGameCubes: GameCube[][]):GameCube[][]  => {
    if(index >= this.cubes.length){
      return oldGameCubes;
    }
    const oneCube = this.cubes.find(cube => cube.rotationID === index);
    if(oneCube){
      const oldGameCubesUpdated = updateOldGameCubesUtil(oldGameCubes, Math.floor((oneCube.position.y as number)/Block.HEIGHT), Math.floor((oneCube.position.x as number)/Block.WIDTH), oneCube);
      return this.updateOldGameCubesRec(index+1, oldGameCubesUpdated);
    }
    return this.updateOldGameCubesRec(index+1, oldGameCubes);
  }
}

class RaisedBlock implements GameBlock{
  constructor(){}
  cubes: GameCube[] = new Array(Constants.CUBE_NUMBERS).fill(null);
  moveLeft = (s: State, amount:number): State => {
    // TODO: implement this method
    return s;
  }
  moveRight = (s: State, amount:number): State => {
    // TODO: implement this method
    return s;
  }
  moveDown = (s: State, amount:number): State => {
    // TODO: implement this method
    return s;
  }
  rotate = (s: State): State => {
    // TODO: implement this method
    return s;
  }
  checkContinueMove = (s: State): boolean => {
    // TODO: implement this method
    return true;
  }
  updatePositions = (s: State): State => {
    // TODO: implement this method
    return s;
  }
  updateOldGameCubes = (s: State): State => {
    // TODO: implement this method
    return s;
  }
}

class LightningBlock implements GameBlock{
  constructor(){}
  cubes: GameCube[] = new Array(Constants.CUBE_NUMBERS).fill(null);
  moveLeft = (s: State, amount:number): State => {
    // TODO: implement this method
    return s;
  }
  moveRight = (s: State, amount:number): State => {
    // TODO: implement this method
    return s;
  }
  moveDown = (s: State, amount:number): State => {
    // TODO: implement this method
    return s;
  }
  rotate = (s: State): State => {
    // TODO: implement this method
    return s;
  }
  checkContinueMove = (s: State): boolean => {
    // TODO: implement this method
    return true;
  }
  updatePositions = (s: State): State => {
    // TODO: implement this method
    return s;
  }
  updateOldGameCubes = (s: State): State => {
    // TODO: implement this method
    return s;
  }
}

class LineBlock implements GameBlock{
  constructor(){}
  cubes: GameCube[] = new Array(Constants.CUBE_NUMBERS).fill(null);
  moveLeft = (s: State, amount:number): State => {
    // TODO: implement this method
    return s;
  }
  moveRight = (s: State, amount:number): State => {
    // TODO: implement this method
    return s;
  }
  moveDown = (s: State, amount:number): State => {
    // TODO: implement this method
    return s;
  }
  rotate = (s: State): State => {
    // TODO: implement this method
    return s;
  }
  checkContinueMove = (s: State): boolean => {
    // TODO: implement this method
    return true;
  }
  updatePositions = (s: State): State => {
    // TODO: implement this method
    return s;
  }
  updateOldGameCubes = (s: State): State => {
    // TODO: implement this method
    return s;
  }
}



/**
 * Updates the state by proceeding with one time step.
 *
 * @param s Current state
 * @returns Updated state
 */
const tick = (s: State, action: ActionType = null):State => {

  // If there is a block at the top, it means gameOver
  if(s.oldGameCubes[0].some(cube => cube !== null)){
    return {
      ...s,
      gameEnd: true
    } as State;
  }

  if(!s.currentGameCube || s.needToCreateCube){
    return {
      ...s,
      currentGameCube: createNewShapeFactory(),
      needToCreateCube: false
    } as State;
  }

  // if(needLineRemove(s.oldGameCubes as GameCube[][])){

  // }

  if(s.currentGameCube.checkContinueMove(s)){
    if(action !== null){
      if((action as Keypress).axis === 'x' && (action as Keypress).amount < 0){
        const newState = s.currentGameCube.moveLeft(s, (action as Keypress).amount);
        if(needLineRemove(newState.oldGameCubes as GameCube[][])){
          const updateState = lineRemoved(newState);
          return {
            ...newState,
            scoreAndDropRate: updateState
          } as State;
        } else {
          return newState;
        }
      } else if((action as Keypress).axis === 'x' && (action as Keypress).amount > 0){
        const newState = s.currentGameCube.moveRight(s, (action as Keypress).amount);
        if(needLineRemove(newState.oldGameCubes as GameCube[][])){
          const updateState = lineRemoved(newState);
          return {
            ...newState,
            scoreAndDropRate: updateState
          } as State;
        } else {
          return newState;
        }
      } else if((action as Keypress).axis === 'y' && (action as Keypress).amount > 0){
        const newState = s.currentGameCube.moveDown(s, (action as Keypress).amount);
        if(needLineRemove(newState.oldGameCubes as GameCube[][])){
          const updateState = lineRemoved(newState);
          return {
            ...newState,
            scoreAndDropRate: updateState
          } as State;
        } else {
          return newState;
        }
      }
    } else {
      print("sdsad")
      const newState = s.currentGameCube.updatePositions(s);
        if(needLineRemove(newState.oldGameCubes as GameCube[][])){
          const updateState = lineRemoved(newState);
          return {
            ...newState,
            scoreAndDropRate: updateState
          } as State;
        } else {
          return newState;
        }
    }
  } else {
    const storedOldState = s.currentGameCube.updateOldGameCubes(s);
    return {
      ...storedOldState,
      currentGameCube: createNewShapeFactory()
    } as State;
  }

  // // If the current block can continue to function
  // if(checkContinueMove(s)){
  //   if(action !== null){
  //     if((action as Keypress).axis === 'x' && (action as Keypress).amount < 0){
  //       const newState = moveLeft(s,(action as Keypress).amount);
  //       if(needLineRemove(newState.oldGameCubes as GameCube[][])){
  //         const updateState = lineRemoved(newState);
  //         const nextPosition = updatePosition(newState, updateState);
  //         return {
  //           ...newState,
  //           currentGameCube:{
  //             ...newState.currentGameCube,
  //             position:nextPosition
  //           },
  //           needToCreateCube: false,
  //           scoreAndDropRate: updateState
  //         } as State;
  //       } else{
  //         return newState;
  //       }
  //     } else if((action as Keypress).axis === 'x' && (action as Keypress).amount > 0){
  //       const newState = moveRight(s,(action as Keypress).amount);
  //       if(needLineRemove(newState.oldGameCubes as GameCube[][])){
  //         const updateState = lineRemoved(newState);
  //         const nextPosition = updatePosition(newState, updateState);
  //         return {
  //           ...newState,
  //           currentGameCube:{
  //             ...newState.currentGameCube,
  //             position:nextPosition
  //           },
  //           needToCreateCube: false,
  //           scoreAndDropRate: updateState
  //         } as State;
  //       } else{
  //         return newState;
  //       }
  //     } else if((action as Keypress).axis === 'y' && (action as Keypress).amount > 0){
  //       return tick(s);
  //     }
  //   }

  //   // If there is a row that needs to be cleared (scores can be obtained)
  //   if(needLineRemove(s.oldGameCubes as GameCube[][])){
  //     // line remove
  //     const updateScoreAndDropRate = lineRemoved(s);
  //     const nextPosition = updatePosition(s, updateScoreAndDropRate); // update the least position of current block
  //     // return the least state
  //     return {
  //       ...s,
  //       currentGameCube:{
  //         ...s.currentGameCube,
  //         position:nextPosition
  //       },
  //       needToCreateCube: false,
  //       scoreAndDropRate: updateScoreAndDropRate
  //     } as State;
  //   } else {
  //     // do not get points, continue to the next step
  //     const nextPosition = updatePosition(s, s.scoreAndDropRate as ScoreAndDropRate);
  //     // return the least state
  //     return {
  //       ...s,
  //       currentGameCube:{
  //         ...s.currentGameCube,
  //         position:nextPosition
  //       },
  //       needToCreateCube: false
  //     } as State;
  //   }
  // } else{
  //   // can't move anymore
  //   // If there is no running block, create it.
  //   if(!s.currentGameCube){
  //     return {
  //       ...s,
  //       currentGameCube: createNewShapeFactory(),
  //       needToCreateCube: true
  //     } as State;
  //   } else if (needLineRemove(s.oldGameCubes as GameCube[][])){
  //     // The cube can't continue to move, but gamer can clear a row and get points
  //     const updateScoreAndDropRate = lineRemoved(s);
  //     // update the oldGameCubes array
  //     const mapOldGameCubes = updateOldGameCubesUtil(s.oldGameCubes as GameCube[][], Math.floor((s.currentGameCube?.position.y as number)/Block.HEIGHT), Math.floor((s.currentGameCube?.position.x as number)/Block.WIDTH), {...s.currentGameCube});
  //     return {
  //       ...s,
  //       currentGameCube: createNewShapeFactory(),
  //       oldGameCubes: mapOldGameCubes,
  //       needToCreateCube: true,
  //       scoreAndDropRate: updateScoreAndDropRate
  //     } as State;
  //   } else {
  //     // The cube can't continue to move and update the oldGameCubes array
  //     const mapOldGameCubes = updateOldGameCubesUtil(s.oldGameCubes as GameCube[][], Math.floor((s.currentGameCube?.position.y as number)/Block.HEIGHT), Math.floor((s.currentGameCube?.position.x as number)/Block.WIDTH), {...s.currentGameCube});
  //     return {
  //       ...s,
  //       currentGameCube: createNewShapeFactory(),
  //       oldGameCubes: mapOldGameCubes,
  //       needToCreateCube: true
  //     } as State;
  //   }
    
  // }
  return s;

};



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


  const source$ = merge(tick$, left$, right$, down$)
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




