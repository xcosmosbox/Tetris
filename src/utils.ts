/** Utility functions */

import { Block, Constants, SHAPES, Viewport } from "./main";
import { LightningBlock, LineBlock, RaisedBlock, SquareBlock } from "./state";

const randomShape = (): GameBlock => {
//   const blockContainer = [SquareBlock, RaisedBlock, LightningBlock, LineBlock];
//   && cell.shape !== SHAPES.BEDROCK
  const blockContainer = [LineBlock, SquareBlock];
  const randomIndex = Math.floor(Math.random() * blockContainer.length);
  return new blockContainer[randomIndex]();
};

// util function to simulate factory method to create the attribute for new block
export const createNewShapeFactory = (): {
  currentBlock: GameBlock;
  nextBlock: GameBlock;
} => {
  return { currentBlock: randomShape(), nextBlock: randomShape() };
};

export const createRowBedrocks = (rowIndex: number): GameCube[] => {
  return Array.from({ length: 10 }).map((_, index) => {
    return {
      color: "gray",
      shape: SHAPES.BEDROCK,
      position: {
        x: index * Block.WIDTH,
        y:
          Viewport.CANVAS_HEIGHT -
          (Constants.GRID_HEIGHT - rowIndex) * Block.HEIGHT,
      } as Position,
      svgCoordinates: {
        index_x: Constants.GRID_HEIGHT - rowIndex,
        index_y: Viewport.CANVAS_WIDTH / (index * Block.WIDTH),
      },
      rotationID: 0,
    } as GameCube;
  });
};

export const getPoints = (
  s: State,
  lineRemoved: boolean = false,
  amount: number = 0
): State => {
  const newScore = lineRemoved
    ? (s.scoreAndDropRate?.gameScore as number) + 100 * amount
    : (s.scoreAndDropRate?.gameScore as number) + 10;
  const newLevel = Math.floor(newScore / 1000) + 1;
  const newHightScore =
    newScore > (s.scoreAndDropRate?.gameHighScore as number)
      ? newScore
      : (s.scoreAndDropRate?.gameHighScore as number);

  if (newLevel > 1) {
    const buildBedrock = s.oldGameCubes.map((row, index) => {
      if (index >= Constants.GRID_HEIGHT - (newLevel - 1)) {
        return createRowBedrocks(index);
      }
      return row;
    });
    return {
      ...s,
      scoreAndDropRate: {
        ...s.scoreAndDropRate,
        gameScore: newScore,
        gameHighScore: newHightScore,
        gameLevel: newLevel,
      } as ScoreAndDropRate,
      oldGameCubes: buildBedrock,
    } as State;
  }

  return {
    ...s,
    scoreAndDropRate: {
      ...s.scoreAndDropRate,
      gameScore: newScore,
      gameHighScore: newHightScore,
      gameLevel: newLevel,
    } as ScoreAndDropRate,
  } as State;
};

// util function to check line whether is need to remove
export const needLineRemove = (oldGameCubes: GameCube[][]): boolean => {
  // If a row in the array is completely filled, the representation can be eliminated
  return oldGameCubes.some((row) =>
    row.every((cube) => cube !== null && cube.shape !== SHAPES.BEDROCK)
  );
};

// util function to check line removed and update related data
export const lineRemoved = (s: State): State => {
  // get all index of full fill row
  const fullyFilledRowIndices = s.oldGameCubes
    .map((row, index) => (row.every((cell) => cell !== null && cell.shape !== SHAPES.BEDROCK) ? index : -1))
    .filter((index) => index !== -1);

  console.log(fullyFilledRowIndices)
  // get new 2D array exclusive full fill row
  const clearedCanvas = s.oldGameCubes.map((row, rowIndex) => {
    return fullyFilledRowIndices.includes(rowIndex)
      ? new Array(row.length).fill(null)
      : row;
  });

  const moveDownMatrix = clearedCanvas.map((row, index) => {
    if (index <= Math.max(...fullyFilledRowIndices)) {
      return index - fullyFilledRowIndices.length >= 0
        ? clearedCanvas[index - fullyFilledRowIndices.length].map((element) => {
            return element
              ? ({
                  ...element,
                  position: {
                    ...element.position,
                    y:
                      element.position.y +
                      fullyFilledRowIndices.length * Block.HEIGHT,
                  },
                } as GameCube)
              : null;
          })
        : new Array(row.length).fill(null);
    }
    return row;
  });

  return getPoints(
    { ...s, oldGameCubes: moveDownMatrix },
    true,
    fullyFilledRowIndices.length
  );

  // const newScore = s.scoreAndDropRate?.gameScore as number + 100 * fullyFilledRowIndices.length;
  // const newLevel = Math.floor(newScore / 1000) + 1;
  // const newHightScore = newScore > (s.scoreAndDropRate?.gameHighScore as number) ? newScore : s.scoreAndDropRate?.gameHighScore as number;
  // const newDropRate = newLevel;
};

//util function to map new array
export const updateOldGameCubesUtil = (
  oldArray: GameCube[][],
  updateRow: number,
  updateCol: number,
  newValue: GameCube
): GameCube[][] => {
  // Update the array at the corresponding position according to the specified row and col.
  // Finally, a new two-dimensional array will be returned.
  return oldArray.map((row, i) => {
    if (i === updateRow) {
      return row.map((cube, j) => {
        return j === updateCol ? newValue : cube;
      });
    }
    return row;
  });
};

// left failed
export const leftFailed = (block: GameBlock, s: State): State => {
  const newCubes = block.cubes.map((cube) => {
    return {
      ...cube,
      position: {
        x: Math.floor((cube.position.x as number) / Block.WIDTH) * Block.WIDTH,
        y: cube.position.y,
      },
    };
  });
  block.cubes = newCubes;
  return {
    ...s,
    currentGameCube: block,
  } as State;
};

// left success
export const leftSuccess = (
  block: GameBlock,
  s: State,
  amount: number
): State => {
  const newCubes = block.cubes.map((cube) => {
    return {
      ...cube,
      position: {
        x: (cube.position.x as number) + amount,
        y: cube.position.y,
      },
    };
  });
  block.cubes = newCubes;
  return {
    ...s,
    currentGameCube: block,
  } as State;
};

// v:2.0
// move right failed
export const rightFailed = (block: GameBlock, s: State): State => {
  const newCubes = block.cubes.map((cube) => {
    return {
      ...cube,
      position: {
        x: Math.floor((cube.position.x as number) / Block.WIDTH) * Block.WIDTH,
        y: cube.position.y,
      },
    };
  });
  block.cubes = newCubes;
  return {
    ...s,
    currentGameCube: block,
  } as State;
};

// move right success
export const rightSuccess = (
  block: GameBlock,
  s: State,
  amount: number
): State => {
  const newCubes = block.cubes.map((cube) => {
    return {
      ...cube,
      position: {
        x: (cube.position.x as number) + amount,
        y: cube.position.y,
      },
    };
  });
  block.cubes = newCubes;
  return {
    ...s,
    currentGameCube: block,
  } as State;
};

export const downFailed = (block: GameBlock, s: State): State => {
  const newCubes = block.cubes.map((cube) => {
    return {
      ...cube,
      position: {
        x: cube.position.x,
        y:
          Math.floor((cube.position.y as number) / Block.HEIGHT) * Block.HEIGHT,
      },
    };
  });
  block.cubes = newCubes;
  return {
    ...s,
    currentGameCube: block,
  } as State;
};

export const downSuccess = (
  block: GameBlock,
  s: State,
  amount: number
): State => {
  const newCubes = block.cubes.map((cube) => {
    return {
      ...cube,
      position: {
        x: cube.position.x,
        y: (cube.position.y as number) + amount,
      },
    };
  });
  block.cubes = newCubes;
  return {
    ...s,
    currentGameCube: block,
  } as State;
};
