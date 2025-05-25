// A dict for flipping the backDirection
const flipDict = {
    "left": "right",
    "top": "bottom",
    "right": "left",
    "bottom": "top",
    "leftWinAid": "right",
    "topWinAid": "bottom",
    "rightWinAid": "left",
    "bottomWinAid": "top",
}
// A dict for tangent backDirections
const tangentDict = {
    "left": ["top", "bottom"],
    "top": ["left", "right"],
    "right": ["top", "bottom"],
    "bottom": ["left", "right"]
}

// Table size (doubt that the app will be fully adaptable for all sizes)
// The value is one less than reality because the left and top most row/column are indexed 0
var tableColumns = 2;
var tableRows = 2;

// Distance matrixes
const distanceMatricesForCells = [
    // Cost to get to this destination from every cell
    [
        [0, 3, 15],
        [3, 9, 45],        // Top left
        [15, 45, 225]
    ],
    [
        [5, 0, 5],
        [15, 3, 15],        // Top
        [75, 15, 75]
    ],
    [
        [15, 3, 0],
        [45, 9, 3],        // Top right
        [225, 45, 15]
    ],
    [
        [5, 15, 75],
        [0, 3, 15],        // Left
        [5, 15, 75]
    ],
    [
        [25, 5, 25],
        [5, 0, 5],        // Center
        [25, 5, 25]
    ],
    [
        [75, 15, 5],
        [15, 3, 0],        // Right
        [75, 15, 5]
    ],
    [
        [15, 45, 225],
        [3, 9, 45],        // Bottom left
        [0, 3, 15]
    ],
    [
        [75, 15, 75],
        [15, 3, 15],        // Bottom
        [5, 0, 5]
    ],
    [
        [225, 45, 15],
        [45, 9, 3],        // Bottom right
        [15, 3, 0]
    ]
];
const distanceMatricesForCursor = [
    // Discount to get to this destination from every cell
    [
        [0, -1, -2],
        [-1, -2, -3],   // Top left
        [-2, -3, -4]
    ],
    [
        [-1, 0, -1],
        [-2, -1, -2],   // Top
        [-3, -2, -3]
    ],
    [
        [-2, -1, 0],
        [-3, -2, -1],   // Top right
        [-4, -3, -2]
    ],
    [
        [-1, -2, -3],
        [0, -1, -2],    // Left
        [-1, -2, -3]
    ],
    [
        [-2, -1, -2],
        [-1, 0, -1],    // Center
        [-2, -1, -2]
    ],
    [
        [-3, -2, -1],
        [-2, -1, 0],    // Right
        [-3, -2, -1]
    ],
    [
        [-2, -3, -4],
        [-1, -2, -3],   // Bottom left
        [0, -1, -2]
    ],
    [
        [-3, -2, -3],
        [-2, -1, -2],   // Bottom
        [-1, 0, -1]
    ],
    [
        [-4, -3, -2],
        [-3, -2, -1],   // Bottom right
        [-2, -1, 0]
    ]
];

// Checks for broken columns/rows
function leftColumnCheck() {
    if (gameState.leftColumnSealed) return 3;
    return 0;
}
function topRowCheck() {
    if (gameState.topRowSealed) return 3;
    return 0;
}
function rightColumnCheck() {
    if (gameState.rightColumnSealed) return 3;
    return 0;
}
function bottomRowCheck() {
    if (gameState.bottomRowSealed) return 3;
    return 0;
}

// Rewrites for sealed columns
function leftColumnRewrite() {
    gameState.leftColumnSealed = true;
    for (let i = 0; i <= tableRows; i++) {
        if (gameState.cells[i][0].value != gameState.cells[i][0].final) gameState.leftColumnSealed = false;
    }
}
function topRowRewrite() {
    gameState.topRowSealed = true;
    for (let i = 0; i <= tableColumns; i++) {
        if (gameState.cells[0][i].value != gameState.cells[0][i].final) gameState.topRowSealed = false;
    }
}
function rightColumnRewrite() {
    gameState.rightColumnSealed = true;
    for (let i = 0; i <= tableRows; i++) {
        if (gameState.cells[i][tableColumns].value != gameState.cells[i][tableColumns].final) gameState.rightColumnSealed = false;
    }
}
function bottomRowRewrite() {
    gameState.bottomRowSealed = true;
    for (let i = 0; i <= tableColumns; i++) {
        if (gameState.cells[tableRows][i].value != gameState.cells[tableRows][i].final) gameState.bottomRowSealed = false;
    }
}

// Functions for (de)incrementing cursor position
const increment = {
    left() { gameState.cursorColumn-- },
    top() { gameState.cursorRow-- },
    right () { gameState.cursorColumn++ },
    bottom () { gameState.cursorRow++ }
}

// Class for one cell
class Cell {
    constructor(value, finishValue, row, column) {
        // Values of this cell
        this.value = value;
        this.final = finishValue;

        // Position info
        this.row = row;
        this.column = column;
    }

    initNeighbors() {
        // References to surrounding cells
        // Left cell
        if (this.column - 1 < 0) this.left = null;
        else this.left = gameState.cells[this.row][this.column - 1];

        // Top cell
        if (this.row - 1 < 0) this.top = null;
        else this.top = gameState.cells[this.row - 1][this.column];

        // Right cell
        if (this.column + 1 > tableColumns) this.right = null;
        else this.right = gameState.cells[this.row][this.column + 1];

        // Bottom cell
        if (this.row + 1 > tableRows) this.bottom = null;
        else this.bottom = gameState.cells[this.row + 1][this.column];
    }

    initRest() {
        // Functions to check prices of moves and functions that execute moves
        // Each of these assumes the zero value is inside of the current cell, even if it isn't

        // Cost checks calculate how would the grid price change if the (0) value moved from this cell to the backDirection x
        this.checkPrice = {};
        
        // These functions swap the zero value inside this cell with the value in backDirection x
        this.executeMove = {};

        // Used to store info about the second move taken into account in a step
        // Corner cells have only one following move, so it is accounted for as a double move
        this.nextMove = {
            left: null,
            top: null,
            right: null,
            bottom: null
        };
        this.sealCheckList = {
            left: [],
            top: [],
            right: [],
            bottom: []
        };
        this.sealSetList = {
            left: [],
            top: [],
            right: [],
            bottom: []
        };
        

        // Left backDirection
        if (this.left != null) {    // If there is no cell to the left, there is no price and no execute function
            // If you can't go left twice in a row, the move would break the left column; and it may be a corner
            if (this.left.left == null) {                
                // Check if the cell to the left is a corner, set the next move if it is
                if (this.left.top == null) this.nextMove.left = "bottom";
                else if (this.left.bottom == null) this.nextMove.left = "top";

                // Add the left column break check
                this.sealCheckList.left.push(leftColumnCheck);
                this.sealSetList.left.push(leftColumnRewrite);
            }

            if (this.top == null) {
                // Add the top row break check
                this.sealCheckList.left.push(topRowCheck);
                this.sealSetList.left.push(topRowRewrite);
            }
            else if (this.bottom == null) {
                // Add the bottom row break check
                this.sealCheckList.left.push(bottomRowCheck);
                this.sealSetList.left.push(bottomRowRewrite);
            }
            
            this.checkPrice.left = () => {
                let price = 0;
                
                // New position price
                price += costLookupTable[this.left.value][this.row][this.column];       // New price of left cell
                price += costLookupTable[0][this.row][this.column - 1];                 // New price of cursor

                // Substract current position price to get the delta
                price -= costLookupTable[this.left.value][this.row][this.column - 1];   // Current price of left cell
                price -= costLookupTable[0][this.row][this.column];                     // Current price of cursor

                // Column/row break checks
                for (i of this.sealCheckList.left) price += i();

                // Next move check
                if (this.nextMove.left != null) price += this.left.checkPrice[this.nextMove.left]();

                return price;
            }

            // The execute move is always the same
            this.executeMove.left = () => {
                // Swap the values
                this.value = this.left.value;
                this.left.value = 0;

                // Change cursor coords
                gameState.cursorColumn -= 1;

                // Column/row break rewrite
                for (i of this.sealSetList.left) i();

                // Log the move
                addEntryToLog("Left swap", gameState.cells);

                // Save the return move
                gameState.returnMove = "right";

                // Execute next move if applicable
                if (this.nextMove.left != null) this.left.executeMove[this.nextMove.left]();
            }
        }

        // Top backDirection
        if (this.top != null) {    // If there is no cell to the top, there is no price and no execute function
            // If you can't go up twice in a row, the move would break the top row; and it may be a corner
            if (this.top.top == null) {
                // Check if the cell to the top is a corner, set the next move if it is
                if (this.top.left == null) this.nextMove.top = "right";
                else if (this.top.right == null) this.nextMove.top = "left";

                // Add the top row break check
                this.sealCheckList.top.push(topRowCheck);
                this.sealSetList.top.push(topRowRewrite);
            }

            if (this.left == null) {
                // Add the left column break check
                this.sealCheckList.top.push(leftColumnCheck);
                this.sealSetList.top.push(leftColumnRewrite);

            }
            else if (this.right == null) {
                // Add the right column break check
                this.sealCheckList.top.push(rightColumnCheck);
                this.sealSetList.top.push(rightColumnRewrite);
            }

            this.checkPrice.top = () => {
                let price = 0;
                
                // New position price
                price += costLookupTable[this.top.value][this.row][this.column];        // New price of top cell
                price += costLookupTable[0][this.row - 1][this.column];                 // New price of cursor

                // Substract current position price to get the delta
                price -= costLookupTable[this.top.value][this.row - 1][this.column];    // Current price of top cell
                price -= costLookupTable[0][this.row][this.column];                     // Current price of cursor

                // Column/row break checks
                for (i of this.sealCheckList.top) price += i();

                // Next move check
                if (this.nextMove.top != null) price += this.top.checkPrice[this.nextMove.top]();

                return price;
            }

            this.executeMove.top = () => {
                // Swap the values
                this.value = this.top.value;
                this.top.value = 0;

                // Change cursor coords
                gameState.cursorRow -= 1;

                // Column/row break rewrite
                for (i of this.sealSetList.top) i();

                // Log the move
                addEntryToLog("Top swap", gameState.cells);

                // Save the return move
                gameState.returnMove = "bottom";

                // Execute next move if applicable
                if (this.nextMove.top != null) this.top.executeMove[this.nextMove.top]();
            }
        }
        
        // Right backDirection
        if (this.right != null) {    // If there is no cell to the right, there is no price and no execute function
            // If you can't go right twice in a row...
            if (this.right.right == null) {
                // Check if the cell to the right is a corner, set the next move if it is
                if (this.right.top == null) this.nextMove.right = "bottom";
                else if (this.right.bottom == null) this.nextMove.right = "top";

                // Add the right column break check
                this.sealCheckList.right.push(rightColumnCheck);
                this.sealSetList.right.push(rightColumnRewrite);
            }

            if (this.top == null) {
                // Add the top row break check
                this.sealCheckList.right.push(topRowCheck);
                this.sealSetList.right.push(topRowRewrite);
            }
            else if (this.bottom == null) {
                // Add the bottom row break check
                this.sealCheckList.right.push(bottomRowCheck);
                this.sealSetList.right.push(bottomRowRewrite);
            }

            this.checkPrice.right = () => {
                let price = 0;
                
                // New position price
                price += costLookupTable[this.right.value][this.row][this.column];      // New price of right cell
                price += costLookupTable[0][this.row][this.column + 1];                 // New price of cursor

                // Substract current position price to get the delta
                price -= costLookupTable[this.right.value][this.row][this.column + 1];  // Current price of right cell
                price -= costLookupTable[0][this.row][this.column];                     // Current price of cursor

                // Column/row break checks
                for (i of this.sealCheckList.right) price += i();

                // Next move check
                if (this.nextMove.right != null) price += this.right.checkPrice[this.nextMove.right]();

                return price;
            }

            // The execute move is always the same
            this.executeMove.right = () => {
                // Swap the values
                this.value = this.right.value;
                this.right.value = 0;

                // Change cursor coords
                gameState.cursorColumn += 1;

                // Column/row break rewrite
                for (i of this.sealSetList.right) i();

                // Log the move
                addEntryToLog("Right swap", gameState.cells);

                // Save the return move
                gameState.returnMove = "left";

                // Execute next move if applicable
                if (this.nextMove.right != null) this.right.executeMove[this.nextMove.right]();
            }
        }

        // Bottom backDirection
        if (this.bottom != null) {    // If there is no cell to the bottom, there is no price and no execute function
            // If you can't go down twice in a row...
            if (this.bottom.bottom == null) {
                // Check if the cell to the bottom is a corner, set the next move if it is
                if (this.bottom.left == null) this.nextMove.bottom = "right";
                else if (this.bottom.right == null) this.nextMove.bottom = "left";

                // Add the bottom row break check
                this.sealCheckList.bottom.push(bottomRowCheck);
                this.sealSetList.bottom.push(bottomRowRewrite);
            }

            if (this.left == null) {
                // Add the left column break check
                this.sealCheckList.bottom.push(leftColumnCheck);
                this.sealSetList.bottom.push(leftColumnRewrite);
            }
            else if (this.right == null) {
                // Add the right column break check
                this.sealCheckList.bottom.push(rightColumnCheck);
                this.sealSetList.bottom.push(rightColumnRewrite);
            }

            this.checkPrice.bottom = () => {
                let price = 0;
                
                // New position price
                price += costLookupTable[this.bottom.value][this.row][this.column];         // New price of bottom cell
                price += costLookupTable[0][this.row + 1][this.column];                     // New price of cursor

                // Substract current position price to get the delta
                price -= costLookupTable[this.bottom.value][this.row + 1][this.column];     // Current price of bottom cell
                price -= costLookupTable[0][this.row][this.column];                         // Current price of cursor

                // Column/row break checks
                for (i of this.sealCheckList.bottom) price += i();

                // Next move check
                if (this.nextMove.bottom != null) price += this.bottom.checkPrice[this.nextMove.bottom]();

                return price;
            }

            // The execute move is always the same
            this.executeMove.bottom = () => {
                // Swap the values
                this.value = this.bottom.value;
                this.bottom.value = 0;

                // Change cursor coords
                gameState.cursorRow += 1;

                // Column/row break rewrite
                for (i of this.sealSetList.bottom) i();

                // Log the move
                addEntryToLog("Bottom swap", gameState.cells);

                // Save the return move
                gameState.returnMove = "top";

                // Execute next move if applicable
                if (this.nextMove.bottom != null) this.bottom.executeMove[this.nextMove.bottom]();
            }
        }
    }
}




// Each index of the cost lookup table corresponds to one value (0 = cursor)
// Corresponds to          0     1    2     3     4     5     6     7     8  
const costLookupTable = [null, null, null, null, null, null, null, null, null];
var gameState;

function solve() {
    // Clear the log
    eraseLog();

    let startingStateString = startField.value;
    let endingStateString = endField.value;

    // Check solveability
    
    // Get versions with no blank
    let startNoZero = "";
    let endNoZero = "";
    for (i of startingStateString) if (i != "0") startNoZero += i;
    for (i of endingStateString) if (i != "0") endNoZero += i;

    // Count inversions
    let startInversions = 0;
    let endInversions = 0;
    for (let i = 0; i < startNoZero.length; i++) {
        for (let j = i + 1; j < startNoZero.length; j++) {
            if (startNoZero[i] > startNoZero[j]) startInversions += 1;
            if (endNoZero[i] > endNoZero[j]) endInversions += 1;
        }
    }

    // Check solvability
    if (startInversions % 2 != endInversions % 2) {
        // If it's not solveable, display the message and break the solve function
        addEntryToLog("Unsolvable");
        return;
    }

    // Assemble the cost look up table
    let positionIndex = 0;
    for (number of endingStateString) {
        // Put the distance matrix for the specific ending position in the slots for the corresponding value
        if (number == 0) {
            costLookupTable[0] = distanceMatricesForCursor[positionIndex];
        } else {
            costLookupTable[number] = distanceMatricesForCells[positionIndex];
        }
        positionIndex++;
    }

    // Init the game
    gameState = {};

    gameState.cells = [];
    gameState.needsSolving = true;
    gameState.returnMove = "";
        
    // Populate the cells table with Cell objects
    for (let i = 0; i <= tableRows; i++) {
        gameState.cells.push([]);
        for (let j = 0; j <= tableColumns; j++) {
            let cellIndex = 3*i + j;
            gameState.cells[i][j] = new Cell(parseInt(startingStateString[cellIndex]), parseInt(endingStateString[cellIndex]), i, j);
        }
    }

    // Initialise neighbors
    for (let i = 0; i <= tableRows; i++) {
        for (let j = 0; j <= tableColumns; j++) {
            gameState.cells[i][j].initNeighbors();
        }
    }

    // Initialise the rest
    for (let i = 0; i <= tableRows; i++) {
        for (let j = 0; j <= tableColumns; j++) {
            gameState.cells[i][j].initRest();
        }
    }

    // Find the cell where 0 ends up, add special solve checking moves to neighbors and set the row and column variable
    var foundZero = false;

    for (let i = 0; i <= tableRows; i++) {
        for (let j = 0; j <= tableColumns; j++) {
            let cell = gameState.cells[i][j];

            if (cell.final == 0) {
                // Go through the neighbors, if the cells exist, add the virtual moves to the neighboring cells
                for (direction of ["left", "top", "right", "bottom"]) {
                    if (cell[direction] != null) {
                        let neighbor = cell[direction];
                        let backDirection = flipDict[direction];

                        neighbor.checkPrice[backDirection + "Finish"] = () => {
                            // If the grid would be completed, make this the chosen option
                            
                            let solvedCells = 0;
                            // Exactly 7 cells should be solved as of now if the grid is solved
                            for (let i = 0; i <= tableRows; i++) {
                                for (let j = 0; j <= tableColumns; j++) {
                                    if (gameState.cells[i][j].value == gameState.cells[i][j].final) solvedCells += 1;
                                }
                            }
                            // If the current and neighboring cells would be correct when swapped, the grid is solved
                            if (neighbor[backDirection].final == 0) solvedCells += 1;
                            if (neighbor[backDirection].value == neighbor.final) solvedCells += 1;

                            // Return the price
                            if (solvedCells == 9) return -5000;
                            return 5000;
                        }

                        neighbor.executeMove[backDirection + "Finish"] = () => {
                            neighbor.value = neighbor[backDirection].value;
                            neighbor[backDirection].value = 0;

                            // Log the final move and break the solving loop
                            addEntryToLog("Finish by " + backDirection + " swap", gameState.cells);
                            gameState.needsSolving = false;
                        }

                        // Add aiding virtual moves when the move would pass through a corner
                        if (neighbor[direction] == null) {
                            // If you can't go further away from 0, the neighbor cell may be part of a corner pass
                            // Aiding moves may be needed; check both of the tangent directions
                            for (tangentDirection of tangentDict[direction]) {
                                // If you can't go tangentDirection from the neighbor cell...
                                if (neighbor[tangentDirection] == null) {
                                    // The cell in the other direction needs an aiding virtual move
                                    let otherNeighbor = neighbor[flipDict[tangentDirection]];

                                    otherNeighbor.checkPrice[tangentDirection + "WinAid"] = () => {
                                        // If the otherNeighbor cell would be solved after this move, and if atleast 6 cells are solved (ie. the 6 cells not involved in the composite move), execute this move

                                        let solvedCells = 0;
                                        // Exactly 6 cells should be solved as of now if the grid would be solved
                                        for (let i = 0; i <= tableRows; i++) {
                                            for (let j = 0; j <= tableColumns; j++) {
                                                if (gameState.cells[i][j].value == gameState.cells[i][j].final) solvedCells += 1;
                                            }
                                        }

                                        // Return the price
                                        if (solvedCells == 6 && neighbor.value == otherNeighbor.final) return -5000;
                                        return 5000;
                                    }

                                    // The actual move is a simple standard move;
                                    otherNeighbor.executeMove[tangentDirection + "WinAid"] = () => {
                                        otherNeighbor.value = neighbor.value;
                                        neighbor.value = 0;

                                        // Change cursor coords
                                        increment[tangentDirection]();

                                        // Save the return move
                                        gameState.returnMove = flipDict[tangentDirection];

                                        // Log the final move and break the solving loop
                                        addEntryToLog("Almost - " + tangentDirection + " swap", gameState.cells);
                                    }
                                }
                            
                            
                            }
                        }
                    }
                }
                foundZero = true;
                break;
            }
        }
        if (foundZero) break;
    }

    // Find the cell where 0 starts, set the cursor coords
    foundZero = false;
    for (let i = 0; i <= tableRows; i++) {
        for (let j = 0; j <= tableColumns; j++) {
            if (gameState.cells[i][j].value == 0) {
                // Set the cursor position
                gameState.cursorRow = i;
                gameState.cursorColumn = j;

                foundZero = true;
                break;
            }
        }
        if (foundZero) break;
    }         

    // Set the seals (assume true until proven false)
    gameState.leftColumnSealed = gameState.topRowSealed = gameState.rightColumnSealed = gameState.bottomRowSealed = true;

    for (let i = 0; i <= tableRows; i++) {
        if (gameState.cells[i][0].value != gameState.cells[i][0].final) gameState.leftColumnSealed = false;
        if (gameState.cells[i][tableColumns].value != gameState.cells[i][tableColumns].final) gameState.rightColumnSealed = false;
    }
    for (let i = 0; i <= tableColumns; i++) {
        if (gameState.cells[0][i].value != gameState.cells[0][i].final) gameState.topRowSealed = false;
        if (gameState.cells[tableRows][i].value != gameState.cells[tableRows][i].final) gameState.bottomRowSealed = false;
    }

    // Log the starting state
    addEntryToLog("Starting position", gameState.cells);

    let moves = 0;
    // The B. R. A. I. N.
    while (gameState.needsSolving && moves < 500) {
        moves++;
        console.log("Move " + moves);

        let cursor = gameState.cells[gameState.cursorRow][gameState.cursorColumn];
        let bestMove;
        let bestPrice;

        // Find best move
        for (let move in cursor.checkPrice) {
            // Ignore the move that would go back a step
            if (move != gameState.returnMove) {
                let price = cursor.checkPrice[move]();

                if (price < bestPrice || bestPrice == undefined) {
                    bestMove = move;
                    bestPrice = price;
                }
            }
        }

        // Execute the best move
        cursor.executeMove[bestMove]();
    }

    //console.log(costLookupTable);
    //console.log(gameState);
}
solveButton.addEventListener("click", solve);
