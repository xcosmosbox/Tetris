// Position type to record one cube position
type Position = Readonly<{
  x: number;
  y: number;
}>;

// GameCube type to record all information about one cube
type GameCube = Readonly<{
  color: string;
  shape: number;
  position: Position;
  rotationID: number;
}>;

// ScoreAndDropRate type to record game score and level
type ScoreAndDropRate = Readonly<{
  gameLevel: number;
  gameScore: number;
  gameHighScore: number;
  dropRate: number;
}>;

// State type to record all game state information
// State type is the core used to build the game state management system
type State = Readonly<{
  gameEnd: boolean;
  currentGameCube?: GameBlock | null;
  nextBlock?: GameBlock | null;
  oldGameCubes: (GameCube | null)[][]; // to record old blocks
  needToCreateCube?: boolean | null;
  scoreAndDropRate: ScoreAndDropRate | null;
  shapeSeed: number;
  colorSeed: number;
}>;

// Keypress to pack Keypress info
type Keypress = Readonly<{
  axis: "x" | "y" | "z";
  amount: number;
}>;

// ClickType to pack mouse click event
type ClickType = Readonly<{
  type: string;
}>;

// RandomShapeGenerator to pack random number generator
type RandomShapeGenerator = Readonly<{
  shapeSeed: number;
}>;

// RandomColorGenerator to pack random number generator
type RandomColorGenerator = Readonly<{
  colorSeed: number;
}>

// ActionType to pack (number | Keypress | ClickType | RandomShapeGenerator | RandomColorGenerator) type
type ActionType = (number | Keypress | ClickType | RandomShapeGenerator | RandomColorGenerator) | null;

// GameBlock is the interface of the game block. It is convenient for the class to implement fixed functions and functions
// GameBlock interface fully reflects the efficient use of generics
interface GameBlock {
  cubes: GameCube[];
  rotationLevel: number;
  moveLeft(s: State, amount: number): State;
  moveRight(s: State, amount: number): State;
  moveDown(s: State, amount: number): State;
  moveHelper(block: GameBlock, s: State, amount: number, boundarySymbol:string, collisionSymbol:string, collisionRule:(state: State, cube:GameCube, collisionSymbol:string)=>boolean,
  failed:(failedBlock:GameBlock, state: State)=>State, success:(successBlock:GameBlock, state: State, amount: number)=>State):State;
  rotate(s: State): State;
  checkContinueMove(s: State): boolean;
  checkContinueDown(s: State, cubes: GameCube[]): boolean;
  updatePositions(s: State): State;
  updateOldGameCubes(s: State): State;
}
