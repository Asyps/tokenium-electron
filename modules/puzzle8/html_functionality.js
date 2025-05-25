// The starting and ending position displays
startField = document.getElementById("start-field");
endField = document.getElementById("end-field");
nextButton = document.getElementById("next-button");
previousButton = document.getElementById("previous-button");
solveButton = document.getElementById("solve-button");
moveLog = document.getElementById("moveLog");

let inputStatus = [false, false];

startField.addEventListener("input", () => {
    var isOK = true;

    // Only proceed if the amount of characters is not bigger than 9
    if (startField.value.length <= 9) {
        // Keep track of numbers
        var numbers = [];

        // Rewrite the first n cells
        for (i in startField.value) {
            // With each cell, check for duplicite numbers
            if (numbers.includes(startField.value[i])) isOK = false;
            numbers.push(startField.value[i]);

            // Check if it is a number in 0-8
            let code = startField.value[i].charCodeAt();
            if (code > 56 || code < 48) isOK = false;

            document.getElementById("start-cell-" + i).textContent = startField.value[i];
        }
        
        if (startField.value.length != 9) {
            // If string is of wrong lenght, not ok
            isOK = false;
        }

    } else {
        // If string is too long, it's not ok
        isOK = false;
    }

    // Depending on if the string is OK, add or remove error class to the input field
    if (isOK) startField.classList.remove("error");
    else startField.classList.add("error");

    // Activate or disable the solve button
    inputStatus[0] = isOK;
    solveButton.disabled = !(isOK && inputStatus[1]);
});

endField.addEventListener("input", () => {
    var isOK = true;

    // Only proceed if the amount of characters is not bigger than 9
    if (endField.value.length <= 9) {
        // Keep track of numbers
        var numbers = [];

        // Rewrite the first n cells
        for (i in endField.value) {
            // With each cell, check for duplicite numbers
            if (numbers.includes(endField.value[i])) isOK = false;
            numbers.push(endField.value[i]);

            // Check if it is a number in 0-8
            let code = endField.value[i].charCodeAt();
            if (code > 56 || code < 48) isOK = false;

            document.getElementById("end-cell-" + i).textContent = endField.value[i];
        }
        
        if (endField.value.length != 9) {
            // If string is of wrong lenght, not ok
            isOK = false;
        }

    } else {
        // If string is too long, it's not ok
        isOK = false;
    }

    // Depending on if the string is OK, add or remove error class to the input field
    if (isOK) endField.classList.remove("error");
    else endField.classList.add("error");

    // Activate or disable the solve button
    inputStatus[1] = isOK;
    solveButton.disabled = !(isOK && inputStatus[0]);
});


// Prepare the mutation observer for cell colors
let colorObserver = new MutationObserver((changes) => {
    for (change of changes) {
        if (change.target.innerHTML == "0") change.target.style.backgroundColor = "#00000000";
        else change.target.style.backgroundColor = null;
    }
})

// Observe all cells in the grids
for (i of document.querySelectorAll(".grid")) colorObserver.observe(i, {childList: true, subtree: true, characterData: true});


// Keep track of past states
var currentMoveIndex = 0;
var currentMoveCount = -1;
var moveHistory = [];

const codes = {
    "L": "Left swap",
    "R": "Right swap",
    "T": "Top swap",
    "B": "Bottom swap",
    "S": "Starting position",
    "F": "Final position",
    "U": "Unsolvable"
}

// Adding an entry to log
function addEntryToLog(msg, cells) {
    currentMoveCount++;

    // Add the entry to the html list
    let entry = document.createElement("div");
    entry.setAttribute("class", "move");
    entry.id = "move-" + currentMoveCount;
    entry.innerHTML = msg;
    moveLog.appendChild(entry);

    if (msg != "Unsolvable") {
        // Add the current state to the state history
        let state = [
            [],
            [],
            []
        ]

        for (let i = 0; i <= tableRows; i++) {
            for (let j = 0; j <= tableColumns; j++) {
                state[i][j] = cells[i][j].value;
            }
        }

        moveHistory[currentMoveCount] = state;

        moveEntry(0);
    }
}

// Clearing the log
function eraseLog() {
    moveHistory = [];
    moveLog.innerHTML = "";
    currentMoveIndex = 0;
    currentMoveCount = -1;

    // Remove the move numbers from their cells
    for (let i=0; i < 9; i++) {
        document.getElementById("cell-" + i).innerText = "";
    }
}

// Moving around in the entries list
function moveEntry(delta) {
    // Remove current coloring
    document.getElementById("move-" + (currentMoveIndex)).style.backgroundColor = "";

    // Change the index
    currentMoveIndex += delta;
    
    // New colored move
    document.getElementById("move-" + (currentMoveIndex)).style.backgroundColor = "#00FF0088";
    
    // Check the range, disable button if neccesary
    previousButton.disabled = currentMoveIndex <= 0;
    nextButton.disabled = currentMoveIndex >= moveLog.childElementCount - 1;
    
    // Insert the move numbers into their cells
    for (let i=0; i < 3; i++) {
        for (let j=0; j < 3; j++) {
            document.getElementById("cell-" + (3*i + j)).innerText = moveHistory[currentMoveIndex][i][j];
        }
    }
}
previousButton.addEventListener("click", () => moveEntry(-1));
nextButton.addEventListener("click", () => moveEntry(1));

// Dispatch events for the start and end fields to fill up the grids
startField.dispatchEvent(new Event("input"));
endField.dispatchEvent(new Event("input"));
