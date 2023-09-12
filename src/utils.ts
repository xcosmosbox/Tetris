/** Utility functions */

import { Block, Constants, SHAPES, Viewport } from "./main";
import {
  BombBlock,
  LightningBlock,
  LineBlock,
  RaisedBlock,
  SquareBlock,
  StarBlock,
} from "./state";
import { scan, type Observable, map, interval } from "rxjs";
import { GameBlock, State, GameCube, Position, ScoreAndDropRate } from "./types";

/**
 * A random number generator which provides two pure functions
 * `hash` and `scaleToRange`.  Call `hash` repeatedly to generate the
 * sequence of hashes.
 */
abstract class RNG {
  // LCG using GCC's constants
  private static m = 0x80000000; // 2**31
  private static a = 1103515245;
  private static c = 12345;

  /**
   * Call `hash` repeatedly to generate the sequence of hashes.
   * @param seed
   * @returns a hash of the seed
   */
  public static hash = (seed: number) => (RNG.a * seed + RNG.c) % RNG.m;

  public static scale = (hash: number) => {
    return Math.floor((hash / RNG.m) * 4 + 1) - 1;
  };
}
/**
 * Creates a stream of random numbers in the range [0,3]
 *
 * @param source$ The source Observable, elements of this are replaced with random numbers
 * @param seed The seed for the random number generator
 */
export function createRngStreamFromSource<T>(source$: Observable<T>) {
  return function createRngStream(seed: number = 0): Observable<number> {
    const randomNumberStream = source$.pipe(
      // when scan finishes processing the seed value
      // it will pass the result to the map function to perform the next step
      scan((seed) => RNG.hash(seed), seed),
      map(RNG.scale)
    );

    return randomNumberStream;
  };
}

/**
 *
 * @param shapeSeed random number for creating shape
 * @param colorSeed random number for creating color
 * @returns GameBlock
 */
const randomShape = (shapeSeed: number, colorSeed: number): GameBlock => {
  // choose GameBlock class
  const blockContainer = [SquareBlock, RaisedBlock, LightningBlock, LineBlock];
  // return an random GameBlock
  return new blockContainer[shapeSeed](colorSeed);
};

/**
 *
 * @param seed using seed to choose color
 * @returns reandom color
 */
export const randomColor = (seed: number): string => {
  const colors = ["red", "green", "blue", "yellow"];
  return colors[seed];
};

/**
 * util function to simulate factory method to create the attribute for new block
 * @param s game state
 * @param shapeSeed one seed to choose shpae
 * @param colorSeed one seed to choose color
 * @returns currentBlock choose and nextBlock choose
 */
export const createNewShapeFactory = (
  s: State,
  shapeSeed: number,
  colorSeed: number
): {
  currentBlock: GameBlock;
  nextBlock: GameBlock;
} => {
  if (RNG.scale(RNG.hash(shapeSeed) + RNG.hash(colorSeed)) < 1) {
    if (
      RNG.scale(
        RNG.hash(RNG.scale(RNG.hash(shapeSeed) + RNG.hash(colorSeed)))
      ) < 2 &&
      (s.scoreAndDropRate?.gameLevel as number) > 3
    ) {
      return {
        currentBlock: randomShape(shapeSeed, colorSeed),
        nextBlock: new BombBlock(),
      };
    }
    return {
      currentBlock: randomShape(shapeSeed, colorSeed),
      nextBlock: new StarBlock(),
    };
  }
  return {
    currentBlock: randomShape(shapeSeed, colorSeed),
    nextBlock: randomShape(shapeSeed, colorSeed),
  };
};

/**
 * increase difficult function
 * create one whole row bedrocks to increase game difficult
 * @param rowIndex bedrocks row index
 * @returns one row GameCube
 */
export const createRowBedrocks = (rowIndex: number): GameCube[] => {
  // using Array.from to iterate
  // using map to return new element
  return Array.from({ length: Constants.GRID_WIDTH }).map((_, index) => {
    // return GameCube
    return {
      color: "gray",
      shape: SHAPES.BEDROCK,
      position: {
        x: index * Block.WIDTH,
        y:
          Viewport.CANVAS_HEIGHT -
          (Constants.GRID_HEIGHT - rowIndex) * Block.HEIGHT,
      } as Position,
      rotationID: 0,
    } as GameCube;
  });
};

/**
 * Calculate current game score
 * @param s game state
 * @param lineRemoved to check this function will calculate 100*amout points, default value false
 * @param amount number of rows removed
 * @returns new game state
 */
export const getPoints = (
  s: State,
  lineRemoved: boolean = false,
  amount: number = 0
): State => {
  // Calculate new score
  const newScore = lineRemoved
    ? (s.scoreAndDropRate?.gameScore as number) + 100 * amount
    : (s.scoreAndDropRate?.gameScore as number) + 10;
  // Calculate new level
  const newLevel = Math.floor(newScore / 1000) + 1;
  // Calculate new high score (if needed)
  const newHightScore =
    newScore > (s.scoreAndDropRate?.gameHighScore as number)
      ? newScore
      : (s.scoreAndDropRate?.gameHighScore as number);

  // Increase game difficulty according to game level
  // The maximum difficulty increase is level 10
  if (newLevel > 1 && newLevel <= 10) {
    // Calculate the lines that need to be disabled according to the game level
    const buildBedrock = s.oldGameCubes.map((row, index) => {
      if (index >= Constants.GRID_HEIGHT - (newLevel - 1)) {
        return createRowBedrocks(index);
      }
      return row;
    });
    // return game sate
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

  // return game state
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
  // If a row in the array is completely filled, the representation can be removed
  return oldGameCubes.some((row) =>
    row.every((cube) => cube !== null && cube.shape !== SHAPES.BEDROCK)
  );
};

// util function to check line removed and update related data
export const lineRemoved = (s: State): State => {
  // get all index number of full fill row
  // except the disabled line
  const fullyFilledRowIndices = s.oldGameCubes
    .map((row, index) =>
      row.every((cell) => cell !== null && cell.shape !== SHAPES.BEDROCK)
        ? index
        : -1
    )
    .filter((index) => index !== -1);

  // confirm whether there is a StarBlock in the line that needs to be removed
  const startIndex = s.oldGameCubes
    .map((row, index) => {
      return fullyFilledRowIndices.includes(index) &&
        row.some((cell) => cell !== null && cell.shape === SHAPES.STAR)
        ? index
        : -1;
    })
    .filter((index) => index !== -1);

  // Add a new remove effect according to the line where the startblock is located
  const newRemoveRow = [
    ...new Set(
      startIndex.reduce<number[]>((acc, index) => {
        // Handle edge cases
        if (index === 0) {
          return [0, 1, ...acc];
        }
        if (index === 19) {
          return [18, 19, ...acc];
        }
        // star block will remove three lines at once
        return [index - 1, index, index + 1, ...acc];
      }, [])
    ),
  ];

  // merge final array between fullyFilledRowIndices and newRemoveRow
  // if there is no star block, the result is the same as fullyFilledRowIndices
  const finalRemoveRow = [
    ...new Set([...fullyFilledRowIndices, ...newRemoveRow]),
  ];

  // get new 2D array, full fill row cleaned
  const clearedCanvas = s.oldGameCubes.map((row, rowIndex) => {
    return finalRemoveRow.includes(rowIndex)
      ? new Array(row.length).fill(null)
      : row;
  });

  // Move the row above the removed row
  // Rows below the removed row are left unchanged
  const moveDownMatrix = clearedCanvas.map((row, index) => {
    // check location
    if (index <= Math.max(...finalRemoveRow)) {
      // handle edge case
      return index - finalRemoveRow.length >= 0
        ? clearedCanvas[index - finalRemoveRow.length].map((element) => {
            return element
              ? ({
                  ...element,
                  position: {
                    ...element.position,
                    y:
                      element.position.y + finalRemoveRow.length * Block.HEIGHT,
                  },
                } as GameCube)
              : null;
          })
        : new Array(row.length).fill(null);
    }
    // below row
    return row;
  });

  // Calculate the new score and return the new state
  return getPoints(
    { ...s, oldGameCubes: moveDownMatrix },
    true,
    finalRemoveRow.length
  );
};

//util function to map new array
export const updateOldGameCubesUtil = (
  oldArray: GameCube[][],
  updateRow: number,
  updateCol: number,
  newValue: GameCube | null
): (GameCube | null)[][] => {
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

/**
 * Check if the block is within the bounds
 * Use direction and amount to determine which boundary to check specifically
 * @param cubes GameCubes to be checked
 * @param direction direction
 * @param amount check distance amount
 * @returns
 */
export const isWithinBoundary = (
  cubes: GameCube[],
  direction: string,
  amount: number
): boolean => {
  // check left edge
  if (direction === "x" && amount < 0) {
    return cubes.every((cube) => (cube.position.x as number) + amount >= 0);
  }
  // check right edge
  if (direction === "x" && amount > 0) {
    return cubes.every(
      (cube) =>
        (cube.position.x as number) + amount <=
        Viewport.CANVAS_WIDTH - Block.WIDTH
    );
  }
  // check bottom edge
  return cubes.every(
    (cube) =>
      (cube.position.y as number) + amount <=
      Viewport.CANVAS_HEIGHT - Block.HEIGHT
  );
};

/**
 * check any cubes whether has collision
 * @param s game state
 * @param cube one cube
 * @param direction direction symbol
 * @returns boolean value for has collision
 */
export const hasCollision = (
  s: State,
  cube: GameCube,
  direction: string
): boolean => {
  // check left edge
  if (direction === "l") {
    return s.oldGameCubes[
      Math.floor((cube.position.y as number) / Block.HEIGHT)
    ][Math.floor((cube.position.x as number) / Block.WIDTH) - 1]
      ? true
      : false;
  }
  // check right edge
  if (direction === "r") {
    return s.oldGameCubes[
      Math.floor((cube.position.y as number) / Block.HEIGHT)
    ][Math.floor((cube.position.x as number) / Block.WIDTH) + 1]
      ? true
      : false;
  }
  // check bottom edge
  return s.oldGameCubes[
    Math.floor((cube.position.y as number) / Block.HEIGHT) + 1
  ][Math.floor((cube.position.x as number) / Block.WIDTH)]
    ? true
    : false;
};

/**
 * Move left failed
 * @param block one game block
 * @param s game state
 * @returns updated game state
 */
export const leftFailed = (block: GameBlock, s: State): State => {
  // update cubes
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

/**
 * Move left successfully
 * @param block one game block
 * @param s game state
 * @param amount left distance
 * @returns updated game state
 */
export const leftSuccess = (
  block: GameBlock,
  s: State,
  amount: number
): State => {
  // update cubes
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

/**
 * Move right failed
 * @param block one game block
 * @param s game state
 * @returns updated game state
 */
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

/**
 * Move right successfully
 * @param block one game block
 * @param s game state
 * @param amount left distance
 * @returns updated game state
 */
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

/**
 * Move down failed
 * @param block one game block
 * @param s game state
 * @returns updated game state
 */
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

/**
 * Move down successfully
 * @param block one game block
 * @param s game state
 * @param amount left distance
 * @returns updated game state
 */
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
