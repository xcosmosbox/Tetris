import { Block, Constants, SHAPES, Viewport } from "./main";
import { leftFailed, leftSuccess, rightFailed, rightSuccess, downFailed, downSuccess, updateOldGameCubesUtil, createNewShapeFactory, needLineRemove, lineRemoved } from "./utils";


export class SquareBlock implements GameBlock{
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
            const newCubes = this.cubes.map(cube => {
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
            this.cubes = newCubes;
            return { 
                ...s,
                currentGameCube: this
            } as State;
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
            const newCubes = this.cubes.map(cube => {
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
            this.cubes = newCubes;
            return {
                ...s,
                currentGameCube: this
            } as State;
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
            const newCubes = this.cubes.map(cube => {
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
            this.cubes = newCubes;
            return {
                ...s,
                currentGameCube: this
            } as State;
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
  
  export class RaisedBlock implements GameBlock{
    constructor(){
        const colors = ["red", "green", "blue", "yellow"];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        const newBlock:GameCube = {
            color: randomColor,
            shape: SHAPES.RAISED_BLOCK,
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
                x: Block.WIDTH * (Math.floor(Viewport.CANVAS_WIDTH / Block.WIDTH / 2) - 2),
                y: newBlock.position.y + Block.HEIGHT
            },
            svgCoordinates: {
                index_x: 1,
                index_y: Viewport.CANVAS_WIDTH / Block.WIDTH * (Math.floor(Viewport.CANVAS_WIDTH / Block.WIDTH / 2) - 2)
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
                index_y: Viewport.CANVAS_WIDTH / Block.WIDTH * (Math.floor(Viewport.CANVAS_WIDTH / Block.WIDTH / 2) - 1)
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
    rotationLevel: number = 0;
    moveLeft = (s: State, amount:number): State => {
        if(this.cubes.every(cube => cube.position.x as number + amount >= 0)){
            if(this.cubes.some(cube => {
                return ( (this.rotationLevel === 0 && (cube.rotationID === 1 || cube.rotationID === 0)) || 
                        (this.rotationLevel === 1 && (cube.rotationID === 0 || cube.rotationID === 3 || cube.rotationID === 1)) || 
                        (this.rotationLevel === 2 && (cube.rotationID === 3 || cube.rotationID === 0)) || 
                        (this.rotationLevel === 3 && (cube.rotationID === 1 || cube.rotationID === 2 || cube.rotationID === 3)) ) && 
                        ( s.oldGameCubes[Math.floor(cube.position.y as number / Block.HEIGHT)][Math.floor(cube.position.x as number / Block.WIDTH)-1] );
            })){
                return  leftFailed(this, s);
            } else {
                return leftSuccess(this, s, amount);
            }
        } else {
            return s;
        }
    }
    moveRight = (s: State, amount:number): State => {
        if(this.cubes.every(cube => cube.position.x as number + amount <= (Viewport.CANVAS_WIDTH-Block.WIDTH))){
            if(this.cubes.some(cube => {
                return ( (this.rotationLevel === 0 && (cube.rotationID === 3 || cube.rotationID === 0)) || 
                        (this.rotationLevel === 2 && (cube.rotationID === 1 || cube.rotationID === 0) ) || 
                        (this.rotationLevel === 3 && (cube.rotationID === 0 || cube.rotationID === 1 || cube.rotationID === 3 )) || 
                        (this.rotationLevel === 1 && (cube.rotationID === 1 || cube.rotationID === 2 || cube.rotationID === 3)) ) && 
                        ( s.oldGameCubes[Math.floor(cube.position.y as number / Block.HEIGHT)][Math.floor(cube.position.x as number / Block.WIDTH)+1] );
            })){
                return rightFailed(this, s);
            } else {
                return rightSuccess(this, s, amount);
            }
        } else {
            return s;
        }
        
    }
    moveDown = (s: State, amount:number): State => {
        if(this.cubes.every(cube => cube.position.y as number + amount <= (Viewport.CANVAS_HEIGHT-Block.HEIGHT))){
            if(this.cubes.some(cube => {
                return ( (this.rotationLevel === 1 && (cube.rotationID === 1 || cube.rotationID === 0)) || 
                        (this.rotationLevel === 2 && (cube.rotationID === 0 || cube.rotationID === 1 || cube.rotationID === 3)) || 
                        (this.rotationLevel === 3 && (cube.rotationID === 3 || cube.rotationID === 0)) || 
                        (this.rotationLevel === 0 && (cube.rotationID === 1 || cube.rotationID === 2 || cube.rotationID === 3)) ) && 
                        ( s.oldGameCubes[Math.floor(cube.position.y as number / Block.HEIGHT)+1][Math.floor(cube.position.x as number / Block.WIDTH)] );
            })){
                return downFailed(this, s);
            } else {
                return downSuccess(this, s, amount);
            }
        } else {
            return s;
        }
    }
    rotate = (s: State): State => {
        const positionMap: Record<number, Position> = this.cubes.reduce(
            (acc, cube) => ({...acc, [cube.rotationID]:cube.position})
        , {});
        if(this.rotationLevel === 0){
            const oneCube = this.cubes.find(cube => cube.rotationID === 2);
            if(oneCube && !s.oldGameCubes[Math.floor(oneCube.position.y as number / Block.HEIGHT)+1][Math.floor(oneCube.position.x as number / Block.WIDTH)]){
                // rotate success
                const newCubes = this.cubes.map( cube => {
                    if(cube.rotationID === 0){
                        return {
                            ...cube,
                            position: positionMap[1]
                        } as GameCube;
                    } else if(cube.rotationID === 1){
                        return {
                            ...cube,
                            position: {
                                ...positionMap[2],
                                y: positionMap[2].y + Block.HEIGHT

                            }
                        } as GameCube;
                    } else if(cube.rotationID === 2){
                        return cube;
                    } else{
                        return {
                            ...cube,
                            position: positionMap[0]
                        } as GameCube;
                    }
                });
                this.cubes = newCubes;
                this.rotationLevel = 1;
            } else {
                // rotate failed
                return s;
            }
        } else if(this.rotationLevel === 1){
            const oneCube = this.cubes.find(cube => cube.rotationID === 2);
            if(oneCube && oneCube.position.x !== Viewport.CANVAS_WIDTH-Block.WIDTH && !s.oldGameCubes[Math.floor(oneCube.position.y as number / Block.HEIGHT)][Math.floor(oneCube.position.x as number / Block.WIDTH)+1]){
                // rotate success
                const newCubes = this.cubes.map( cube => {
                    if(cube.rotationID === 0){
                        return {
                            ...cube,
                            position: positionMap[1]
                        } as GameCube;
                    } else if(cube.rotationID === 1){
                        return {
                            ...cube,
                            position: {
                                ...positionMap[2],
                                x: positionMap[2].x + Block.WIDTH
                            }
                        } as GameCube;
                    } else if(cube.rotationID === 2){
                        return cube;
                    } else{
                        return {
                            ...cube,
                            position: positionMap[0]
                        } as GameCube;
                    }
                });
                this.cubes = newCubes;
                this.rotationLevel = 2;
            } else {
                // rotate failed
                return s;
            }
        } else if(this.rotationLevel === 2){
            const oneCube = this.cubes.find(cube => cube.rotationID === 2);
            if(oneCube && !s.oldGameCubes[Math.floor(oneCube.position.y as number / Block.HEIGHT)-1][Math.floor(oneCube.position.x as number / Block.WIDTH)]){
                // rotate success
                const newCubes = this.cubes.map( cube => {
                    if(cube.rotationID === 0){
                        return {
                            ...cube,
                            position: positionMap[1]
                        } as GameCube;
                    } else if(cube.rotationID === 1){
                        return {
                            ...cube,
                            position: {
                                ...positionMap[2],
                                y: positionMap[2].y - Block.HEIGHT
                            }
                        } as GameCube;
                    } else if(cube.rotationID === 2){
                        return cube;
                    } else{
                        return {
                            ...cube,
                            position: positionMap[0]
                        } as GameCube;
                    }
                });
                this.cubes = newCubes;
                this.rotationLevel = 3;
            } else {
                // rotate failed
                return s;
            }
        } else if(this.rotationLevel === 3){
            const oneCube = this.cubes.find(cube => cube.rotationID === 2);
            if(oneCube && oneCube.position.x !== 0 && !s.oldGameCubes[Math.floor(oneCube.position.y as number / Block.HEIGHT)][Math.floor(oneCube.position.x as number / Block.WIDTH)-1]){
                // rotate success
                const newCubes = this.cubes.map( cube => {
                    if(cube.rotationID === 0){
                        return {
                            ...cube,
                            position: positionMap[1]
                        } as GameCube;
                    } else if(cube.rotationID === 1){
                        return {
                            ...cube,
                            position: {
                                ...positionMap[2],
                                x: positionMap[2].x - Block.WIDTH
                            }
                        } as GameCube;
                    } else if(cube.rotationID === 2){
                        return cube;
                    } else{
                        return {
                            ...cube,
                            position: positionMap[0]
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
    }
    checkContinueMove = (s: State): boolean => {
        if(this.cubes.every(cube => cube.position.y as number + Block.HEIGHT*(s.scoreAndDropRate?.dropRate as number) <= (Viewport.CANVAS_HEIGHT-Block.HEIGHT))){
            if(this.cubes.some(cube => {
                return ( (this.rotationLevel === 1 && (cube.rotationID === 1 || cube.rotationID === 0)) || 
                        (this.rotationLevel === 2 && (cube.rotationID === 0 || cube.rotationID === 1 || cube.rotationID === 3)) || 
                        (this.rotationLevel === 3 && (cube.rotationID === 3 || cube.rotationID === 0)) || 
                        (this.rotationLevel === 0 && (cube.rotationID === 1 || cube.rotationID === 2 || cube.rotationID === 3)) ) && 
                        ( s.oldGameCubes[Math.floor(cube.position.y as number / Block.HEIGHT)+1][Math.floor(cube.position.x as number / Block.WIDTH)] );
            })){
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

export class LightningBlock implements GameBlock{
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

export class LineBlock implements GameBlock{
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
export const tick = (s: State, action: ActionType = null):State => {

    // If there is a block at the top, it means gameOver
    if(s.oldGameCubes[0].some(cube => cube !== null)){
        return {
            ...s,
            gameEnd: true
        } as State;
    }

    if(!s.currentGameCube || s.needToCreateCube){
        const {currentBlock, nextBlock} = createNewShapeFactory();
        return {
            ...s,
            currentGameCube: s.nextBlock || currentBlock,
            nextBlock: nextBlock,
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
            } else if((action as Keypress).axis === 'z'){
                const newState = s.currentGameCube.rotate(s);
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
        const {currentBlock, nextBlock} = createNewShapeFactory();
        if(storedOldState.oldGameCubes[0].some(cube => cube !== null)){
            return {
                ...storedOldState,
                gameEnd: true
            } as State;
        }
        return {
            ...storedOldState,
            currentGameCube: s.nextBlock || currentBlock,
            nextBlock: nextBlock,
        } as State;
    }
    return s;

};
