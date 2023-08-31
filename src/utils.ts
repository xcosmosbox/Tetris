

/** Utility functions */

import { Block, Viewport } from "./main";
import { LightningBlock, LineBlock, RaisedBlock, SquareBlock } from "./state";

const randomShape = ():GameBlock => {
    const blockContainer = [SquareBlock, RaisedBlock, LightningBlock, LineBlock];
    // const blockContainer = [LineBlock];
    const randomIndex = Math.floor(Math.random()*blockContainer.length);
    return new blockContainer[randomIndex]();
}

// util function to simulate factory method to create the attribute for new block
export const createNewShapeFactory = ():{currentBlock:GameBlock, nextBlock:GameBlock} =>{
    return {currentBlock:randomShape(), nextBlock:randomShape()};
}

// util function to check line whether is need to remove
export const needLineRemove = (oldGameCubes: GameCube[][]): boolean => {
    // If a row in the array is completely filled, the representation can be eliminated
    return oldGameCubes.some(row => row.every(cube => cube !== null));
}

// helper function to find the closest non-empty upper row index by lineRemoved() function
const findClosestNonEmptyUpRowIndex = (cubes: (GameCube | null)[][], startRow: number): number | null =>{
    const reversedTemps = cubes.slice(0, startRow+1).reverse();
    const result = reversedTemps.findIndex(row => row.some(element => element !== null));
    return result !== -1 ? startRow - result : null;
} 
const findMinDistanceToBottom = (cubes: (GameCube | null)[][], startRow: number): number => {
    const rows = cubes[startRow];
    const distance = rows.map( (element, colIndex) => {
        if(element === null){
            return Infinity;
        }
        const distanceToNonEmpty = cubes.slice(startRow + 1, cubes.length)
                                        .findIndex(nextRow => nextRow[colIndex] !== null);
        return distanceToNonEmpty === -1 ? cubes.length - startRow : distanceToNonEmpty;
    } );
    return Math.min(...distance);
}
// util function to check line removed and update related data
export const lineRemoved = (s: State):State =>{
    // TODO: update the score and call gameScoreChangeSubject.next(THE_LEAST_SCORE), gameScoreChange$ will subscribe the change
    /** if (one line has been removed){
     *    const newScore = s.scoreAndDropRate.gameScore + getPoints;
     *    const newLevel = Math.floor(newScore / 100) + 1;
     *    const newHightScore = newScore > s.scoreAndDropRate.gameHighScore ? newScore : s.scoreAndDropRate.gameHighScore;
     *    const newDropRate = newLevel/10;
     *    return {newScore, newLevel, newHightScore, newDropRate} as ScoreAndDropRate;
     *  } */ 

    console.log(s.oldGameCubes)
    
    // get all index of full fill row 
    const fullyFilledRowIndices = s.oldGameCubes
    .map((row, index) => (row.every(cell => cell !== null) ? index : -1))
    .filter(index => index !== -1);

    // get new 2D array exclusive full fill row
    const clearedCanvas = s.oldGameCubes.map((row, rowIndex) => {
        return fullyFilledRowIndices.includes(rowIndex) ? new Array(row.length).fill(null) : row;
    });
    console.log(clearedCanvas)

    const moveDownMatrix = clearedCanvas.map((row, index) => {
        if(index <= Math.max(...fullyFilledRowIndices)){
            return index - fullyFilledRowIndices.length >= 0 
            ? clearedCanvas[index - fullyFilledRowIndices.length].map(element => {
                return element ? {
                    ...element,
                    position: {
                        ...element.position,
                        y: element.position.y + fullyFilledRowIndices.length * Block.HEIGHT
                    }
                } as GameCube : null;
            }) 
            : new Array(row.length).fill(null);
        }
        return row;
    });
    console.log(moveDownMatrix)

    const newScore = s.scoreAndDropRate?.gameScore as number + 100 * fullyFilledRowIndices.length;
    const newLevel = Math.floor(newScore / 1000) + 1;
    const newHightScore = newScore > (s.scoreAndDropRate?.gameHighScore as number) ? newScore : s.scoreAndDropRate?.gameHighScore as number;
    const newDropRate = newLevel;

    return {
        ...s,
        oldGameCubes: moveDownMatrix,
        scoreAndDropRate: {
            gameScore: newScore,
            gameHighScore: newHightScore,
            gameLevel: newLevel,
            dropRate: newDropRate
        }
    } as State;

}

// util function to check whether is continue for current block TODO: check more detail for future
export const checkContinueMove = (s: State): boolean =>{
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
export const updateOldGameCubesUtil = (oldArray: GameCube[][], updateRow: number, updateCol: number, newValue: GameCube):GameCube[][] => {
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
export const leftFailed = (block: GameBlock, s: State): State => {
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
export const leftSuccess = (block: GameBlock, s: State, amount: number):State => {
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



// v:2.0
// move right failed
export const rightFailed = (block: GameBlock, s: State): State => {
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
export const rightSuccess = (block: GameBlock, s: State, amount: number): State => {
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


export const downFailed = (block: GameBlock, s: State): State => {
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

export const downSuccess = (block: GameBlock, s: State, amount: number): State => {
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

// export const moveBottomCanvas = (block: GameBlock, s: State): State => {
//     const newCubes = block.cubes.map(cube => {
//         if(cube.rotationID === 2 || cube.rotationID === 3){
//         return {
//             ...cube,
//             position:{
//             x:cube.position.x,
//             y:Viewport.CANVAS_HEIGHT-Block.HEIGHT
//             }
//         }
//         } else {
//         return {
//             ...cube,
//             position:{
//             x:cube.position.x,
//             y:Viewport.CANVAS_HEIGHT-Block.HEIGHT-Block.HEIGHT
//             }
//         }
//         }
//     });
//     block.cubes = newCubes;
//     return {
//         ...s,
//         currentGameCube: block
//     } as State;
// }