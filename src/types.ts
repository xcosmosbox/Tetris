type Position = Readonly<{
  x: number;
  y: number;
}>;

type GameCube = Readonly<{
  color: string;
  shape: number;
  position: Position;
  rotationID: number;
}>;

type ScoreAndDropRate = Readonly<{
  gameLevel: number;
  gameScore: number;
  gameHighScore: number;
  dropRate: number;
}>;

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

type Keypress = Readonly<{
  axis: "x" | "y" | "z";
  amount: number;
}>;

type ClickType = Readonly<{
  type: string;
}>;

type RandomShapeGenerator = Readonly<{
  shapeSeed: number;
}>;

type RandomColorGenerator = Readonly<{
  colorSeed: number;
}>

type ActionType = (number | Keypress | ClickType | RandomShapeGenerator | RandomColorGenerator) | null;

interface SvgCoordinate {
  index_x: number;
  index_y: number;
}

interface GameBlock {
  cubes: GameCube[];
  moveLeft(s: State, amount: number): State;
  moveRight(s: State, amount: number): State;
  moveDown(s: State, amount: number): State;
  rotate(s: State): State;
  checkContinueMove(s: State): boolean;
  checkContinueDown(s: State, cubes: GameCube[]): boolean;
  updatePositions(s: State): State;
  updateOldGameCubes(s: State): State;
}
