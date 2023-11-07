# Tetris Game with Typescript Implement

Use Typescript to Implement Classic Tetris Game 

Comply with FRP Style and Code Pure

## Core Features

- Observable
  - Using RxJS to create multiple Observable streams and merge together to form an Observable
  - The control of the main game process is completely put into the pipeline of `source$`
- Functional Programming
  - Disable for-loop
  - Using `reduce()`, `map()` and `filter()` to conform to FRP style
  - Make full use of higher order function
- State Management
  - One single state to manage game's state
  - Code purity
- Event Processing
  - Listening `KeyboardEvent` and `MouseEvent`

## Implemented Function

- [x] Tetris
	- [x] Blocks move down from the top discretely
		- [x] All Tetris Pieces that can be built using 4 blocks 
	- [x] Marking Board
	- [x] Row Elimination
	- [x] Random Next Shape
	- [x] Next Shape Preview
	- [x] Difficulty Increase
	- [x] Game Restart
	- [x] Advanced Feature
		- [x] Power-up Block
			- [x] Eleminate Three Rows 
		- [x] Debuff Block     
			- [x] Destroy Around Four Blocks     



## Demos
![TetrisGIF](https://github.com/xcosmosbox/Tetris/assets/56502269/f50cedc4-4298-43a4-970c-ed9af7919565)


## Usage

Setup (requires node.js):
```
> npm install
```

Start tests:
```
> npm test
```

Serve up the App (and ctrl-click the URL that appears in the console)
```
> npm run dev
```
