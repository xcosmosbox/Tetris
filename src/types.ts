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
    gameLevel:number;
    gameScore: number;
    gameHighScore: number;
    dropRate: number;
}>

type State = Readonly<{
    gameEnd: boolean;
    currentGameCube?: (GameBlock | null);
    nextBlock?: (GameBlock | null);
    oldGameCubes: (GameCube | null)[][]; // to record old blocks
    needToCreateCube?: (boolean | null);
    scoreAndDropRate: (ScoreAndDropRate | null);
}>;

type Keypress = Readonly<{
    axis: 'x' | 'y' | 'z',
    amount: number
}>;

type ClickType = Readonly<{
    type: string
}>


type ActionType = ((number | Keypress | ClickType) | null);

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