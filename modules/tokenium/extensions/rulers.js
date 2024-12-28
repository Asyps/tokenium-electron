// Register a description
window.callFunctionOnLoaded(["chat", "commands"], "register extension description", "tokenium", "rulers", 
    "This extension adds the functionality of rulers to tokenium. Rulers look like arrows. Rulers are a visual guide to token moving, and they can be used to measure distances."
);

// Class for storing arrows
class Arrow {
    constructor(start, end, color) {
        this.color = color;
        
        // The start and end point of the arrow base
        this.start = start;
        this.end = end;

        // The angle between the base of the arrow and the flaps
        let flapAngle = Math.PI / 6;

        // The lenght of the flaps
        let flapLength = 10;

        // Angle between the positive x axis and the base of the arrow
        let angle = Math.atan2(start.y - end.y, start.x - end.x);

        // The coordinates of the ending points of the flaps
        this.flap1 = {
            x: Math.cos(angle + flapAngle) * flapLength + end.x,
            y: Math.sin(angle + flapAngle) * flapLength + end.y
        };
        this.flap2 = {
            x: Math.cos(angle - flapAngle) * flapLength + end.x,
            y: Math.sin(angle - flapAngle) * flapLength + end.y
        };
    }
}

// Alter DOM
let c = document.createElement("canvas");
c.id = "rulerLayer";
c.setAttribute("class", "tokenium_standard");
c.setAttribute("width", tokeniumData.width);
c.setAttribute("height", tokeniumData.height);
// <canvas id="rulerLayer" class="tokenium_standard" width=tokeniumData.width height=tokeniumData.height></canvas>
tokenium.panZoomHandler.container.insertBefore(c, tokenium.tokens.logicalContainer);

// Add data to mockup of Document       in the document, maybe only the data inserted into the constructor will be stored
tokeniumData.publicArrows = [
    new Arrow({ x: 96, y: 96 }, { x: 288, y: 160 }, "#FF00FF"),
    new Arrow({ x: 288, y: 160 }, { x: 544, y: 224 }, "#FF00FF"),
    new Arrow({ x: 609, y: 437 }, { x: 311, y: 47 }, "#0000FF"),
]


// Add ruler data and functions to the tokenium data object
tokenium.ruler = {
    // DOM elements
    canvas: document.getElementById("rulerLayer"),
    ctx: document.getElementById("rulerLayer").getContext("2d"),

    // The resize function
    resize(width, height) {
        this.canvas.setAttribute("width", width);
        this.canvas.setAttribute("height", height);

        // Redraw the grid
        this.redraw();
    },

    measureStatus: "idle",

    // Lists of client side arrows
    localArrows: [],
    pathArrows: [],

    // The starting and ending positions of the current arrow
    currentArrowStart: {x: 0, y: 0},
    currentArrowEnd: {x: 0, y: 0},

    initMeasuring(ev) {
        // Initialise measuring
        // If a token is being moved, set the start coordinates to the center of the token
        if (tokenium.dragHandler.dragStatus) {
            let x = unpx(tokenium.dragHandler.dragObject.style.left) + tokenium.dragHandler.dragObject.width / 2;
            let y = unpx(tokenium.dragHandler.dragObject.style.top) + tokenium.dragHandler.dragObject.height / 2;
            tokenium.ruler.currentArrowStart = {x: x, y: y};
        }
        else {
            // Otherwise set the starting coordinate based on the mouse position
            if (!ev.ctrlKey) {var gridSnap = "center"}
            tokenium.ruler.currentArrowStart = tokenium.panZoomHandler.projectPoint({x: ev.pageX, y: ev.pageY}, gridSnap);
        }
    },

    endMeasuring(wasMovingToken=false) {
        // End the measuring process
        this.measureStatus = "idle";

        // If a token was being moved, the current state of the arrows is a path for the token.
        if (wasMovingToken) {
            // Save the path for returning
            var tokenPath = this.localArrows.concat([new Arrow(this.currentArrowStart, this.currentArrowEnd, playerColor)]);
        }

        // Clear client side arrows
        this.localArrows = [];

        // Clear the current arrow
        this.currentArrowStart = {x: 0, y: 0};
        this.currentArrowEnd = {x: 0, y: 0};

        // If a token was being moved, return the path.
        if (wasMovingToken) return tokenPath;
        
        // Only redraw if a token wasn't moved
        this.redraw();
    },

    redraw() {
        // Reset line width
        this.ctx.lineWidth = 5;

        // Clear all arrows
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Assemble all arrows into one list
        let arrowList = tokeniumData.publicArrows.concat(this.localArrows).concat(this.pathArrows).concat([new Arrow(this.currentArrowStart, this.currentArrowEnd, playerColor)]);

        // Draw all arrows
        for (const arrow of arrowList) {
            if (arrow.start.x != arrow.end.x || arrow.start.y != arrow.end.y) {
                this.ctx.strokeStyle = arrow.color;

                this.ctx.beginPath();

                // Draw the flaps
                this.ctx.moveTo(arrow.flap1.x, arrow.flap1.y);
                this.ctx.lineTo(arrow.end.x, arrow.end.y);
                this.ctx.lineTo(arrow.flap2.x, arrow.flap2.y);

                // Draw the base
                this.ctx.moveTo(arrow.start.x, arrow.start.y);
                this.ctx.lineTo(arrow.end.x, arrow.end.y);

                // Apply changes
                this.ctx.stroke();
            }
        }
    }
}

// Redraw the ruler canvas
tokenium.ruler.redraw();


// The ruler system events
window.addEventListener("contextmenu", (ev) => {
    // Prevent context menu when measuring
    if (tokenium.ruler.measureStatus == "active") {
        ev.preventDefault()
    }
});

window.addEventListener("mousedown", (ev) => {
    if (ev.button == 0) {
        // End measurement if LMB was pressed
        if (tokenium.ruler.measureStatus == "active") {
            tokenium.ruler.endMeasuring();
        }
    }
});
window.addEventListener("mouseup", (ev) => {
    // If RMB was released in "ready" mode, don't start measuring
    if (ev.button == 2 && tokenium.ruler.measureStatus == "ready") {
        tokenium.ruler.measureStatus == "idle";
    }
});

tokenium.panZoomHandler.container.addEventListener("mousedown", (ev) => {
    if (ev.button == 2) {
        // If the RMB was pressed...
        ev.preventDefault();
        
        // Get ready for measurement 
        if (tokenium.ruler.measureStatus == "idle") {    
            tokenium.ruler.measureStatus = "ready";
        }

        // Pivot the arrow
        else if (tokenium.ruler.measureStatus == "active") {
            // Add the current arrow to the list of existing arrows
            tokenium.ruler.localArrows.push(new Arrow(tokenium.ruler.currentArrowStart, tokenium.ruler.currentArrowEnd, playerColor));

            // Set the new start coordinates
            if (tokenium.dragHandler.dragStatus) {
                // If a token is being moved, set the start coordinates to the center of the token
                let x = unpx(tokenium.dragHandler.dragObject.style.left) + tokenium.dragHandler.dragObject.width / 2;
                let y = unpx(tokenium.dragHandler.dragObject.style.top) + tokenium.dragHandler.dragObject.height / 2;
                tokenium.ruler.currentArrowStart = {x: x, y: y};
            }
            else {
                // Otherwise set the starting coordinate based on the mouse position
                if (!ev.ctrlKey) {var gridSnap = "center"}
                tokenium.ruler.currentArrowStart = tokenium.panZoomHandler.projectPoint({x: ev.pageX, y: ev.pageY}, gridSnap);
            }

            // Reset the end coordinates
            tokenium.ruler.currentArrowEnd = { x: 0, y: 0 }
        }
    }
});

tokenium.panZoomHandler.container.addEventListener("mousemove", (ev) => {
    // If mouse is moved while status is ready, measuring can begin
    if (tokenium.ruler.measureStatus == "ready") {
        tokenium.ruler.measureStatus = "active";

        // Initialisation of measuring
        // If a token is being moved, set the start coordinates to the center of the visual token (of the starting position)
        if (tokenium.dragHandler.dragStatus) {
            // Get the visual token
            let visualToken = document.getElementById(tokenium.dragHandler.dragObject.getAttribute("visualToken"));

            // Set the starting coordinates
            let x = unpx(visualToken.style.left) + visualToken.width / 2;
            let y = unpx(visualToken.style.top) + visualToken.height / 2;
            tokenium.ruler.currentArrowStart = {x: x, y: y};
        }
        else {
            // Otherwise set the starting coordinate based on the mouse position
            if (!ev.ctrlKey) {var gridSnap = "center"}
            tokenium.ruler.currentArrowStart = tokenium.panZoomHandler.projectPoint({x: ev.pageX, y: ev.pageY}, gridSnap);
        }
    }

    // Updating the arrow while moving
    else if (tokenium.ruler.measureStatus == "active") {
        if (tokenium.dragHandler.dragStatus) {
            // If a token is being moved, always put the arrow in the center of the token
            let lastArrowEnd = [tokenium.ruler.currentArrowEnd.x, tokenium.ruler.currentArrowEnd.y];

            // Set the new ending position of the current arrow
            let x = unpx(tokenium.dragHandler.dragObject.style.left) + tokenium.dragHandler.dragObject.width / 2;
            let y = unpx(tokenium.dragHandler.dragObject.style.top) + tokenium.dragHandler.dragObject.height / 2;
            tokenium.ruler.currentArrowEnd = {x: x, y: y}

            // Only change the arrow and redraw if the arrow is diffirent from the last one
            if (tokenium.ruler.currentArrowEnd.x != lastArrowEnd[0] || tokenium.ruler.currentArrowEnd.y != lastArrowEnd[1]) {
                // Redraw the grid
                tokenium.ruler.redraw();
            }
        }
        else if (ev.ctrlKey || tokeniumData.gridSize == null) {
            // If a token is not being moved and ctrl is held or grid is turned off, always put the end position at the mouse, and always change the arrow and redraw
            tokenium.ruler.currentArrowEnd = tokenium.panZoomHandler.projectPoint({x: ev.pageX, y: ev.pageY});

            // Redraw the grid
            tokenium.ruler.redraw();
        } 
        else {
            // Otherwise, snap the position to the grid
            let lastArrowEnd = [tokenium.ruler.currentArrowEnd.x, tokenium.ruler.currentArrowEnd.y];

            tokenium.ruler.currentArrowEnd = tokenium.panZoomHandler.projectPoint({x: ev.pageX, y: ev.pageY}, "center");

            // Only change the arrow and redraw if the arrow is diffirent from the last one
            if (tokenium.ruler.currentArrowEnd.x != lastArrowEnd[0] || tokenium.ruler.currentArrowEnd.y != lastArrowEnd[1]) {
                // Redraw the grid
                tokenium.ruler.redraw();
            }
        }
    }
});


// Drag system integration

// Replace beginDrag with a function that also starts measuring
tokenium.dragHandler.beginDrag = (ev) => {
    if (ev.button == 0) {
        ev.preventDefault();
        
        tokenium.ruler.measureStatus = "ready";
        
        tokenium.dragHandler.dragStatus = true;
        tokenium.dragHandler.dragObject = ev.target;
    }
}

// Replace moveVisualToken with a function that takes into account the path traced by arrows
tokenium.dragHandler.moveVisualToken = () => {
    // Obtain the tokens
    let dragToken = tokenium.dragHandler.dragObject;
    let visualToken = document.getElementById(dragToken.getAttribute("visualToken"));

    // Remove the event listener that starts dragging
    dragToken.removeEventListener("mousedown", tokenium.dragHandler.beginDrag);

    // Calculate the offsets to compensate for the fact arrows are in the middle of the token
    let offsetX = visualToken.width / 2;
    let offsetY = visualToken.height / 2;

    // End arrow measuring, obtain the path
    let tokenPath = tokenium.ruler.endMeasuring(true);

    // Add the arrows of the path into a list of path arrows to be drawn
    tokenium.ruler.pathArrows = tokenium.ruler.pathArrows.concat(tokenPath);

    // A function to recursively process an arrow
    function processArrow(timeout=1000) {
        // Shift the oldest arrow
        let oldestArrow = tokenPath.shift();
            
        // Apply movement
        visualToken.style.left = px(oldestArrow.end.x - offsetX);
        visualToken.style.top = px(oldestArrow.end.y - offsetY);
        
        // After the movement finishes (1 s), remove the arrow from displayed path arrows
        setTimeout(() => {
            // Since the arrow was added into pathArrows using a shallow copy, the indexOf function will be able to find the match
            tokenium.ruler.pathArrows.splice(tokenium.ruler.pathArrows.indexOf(oldestArrow), 1);

            // Redraw the arrows
            tokenium.ruler.redraw();
        }, timeout);
        
        
        if (tokenPath.length > 0) {
            // If there are any arrows left in the path, set the next timeout
            setTimeout(processArrow, timeout, timeout);
        }
        else {
            // Otherwise reset the transition property and re-enable dragging
            visualToken.style.removeProperty("transition-duration");
            dragToken.addEventListener("mousedown", tokenium.dragHandler.beginDrag);
        }
    }

    // Process the first arrow
    if (tokenPath.length == 1) {
        // If there is only a single pivot, process it normally
        processArrow();
    }
    else {
        // Otherwise change the timeout such that the whole animation takes sqrt(n) seconds => each segment takes sqrt(n)/n
        let timeout = Math.round(Math.sqrt(tokenPath.length) / tokenPath.length * 1000);
        visualToken.style["transition-duration"] = timeout + "ms";
        processArrow(timeout);
    }
}

// Declare as loaded
window.declareAsLoaded("tokenium", "rulers");
