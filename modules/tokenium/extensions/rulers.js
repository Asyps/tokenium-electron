// Register a description
let description = "This extension adds the functionality of rulers to tokenium. Rulers look like arrows. Rulers are a visual guide to token moving, and they can be used to measure distances.";
window.callFunctionOnLoaded(["chat", "commands"], "register extension description", "tokenium", "rulers", description);

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
        let flapLenght = 10;

        // Angle between the positive x axis and the base of the arrow
        let angle = Math.atan2(start.y - end.y, start.x - end.x);

        // The coordinates of the ending points of the flaps
        this.flap1 = {
            x: Math.cos(angle + flapAngle) * flapLenght + end.x,
            y: Math.sin(angle + flapAngle) * flapLenght + end.y
        };
        this.flap2 = {
            x: Math.cos(angle - flapAngle) * flapLenght + end.x,
            y: Math.sin(angle - flapAngle) * flapLenght + end.y
        };
    }
}

// Alter DOM
let c = document.createElement("canvas");
c.id = "rulerLayer";
c.setAttribute("class", "tokenium_standard");
// <canvas id="rulerLayer" class="tokenium_standard"></canvas>
tokenium.meta.container.insertBefore(c, tokenium.tokens.logicalContainer);

// Add ruler data and functions to the tokenium data object
tokenium.ruler = {
    // DOM elements
    canvas: document.getElementById("rulerLayer"),
    ctx: document.getElementById("rulerLayer").getContext("2d"),

    measureStatus: "idle",

    // List of client side arrows
    myArrows: [],

    // Mockup for arrows of other people, will get replaced by server
    otherArrows: [],

    // The starting and ending positions of the current arrow
    currentArrowStart: {},
    currentArrowEnd: {},

    endMeasuring() {
        // End the measuring process
        tokenium.ruler.measureStatus = "idle";

        // Clear client side arrows and refresh canvas
        tokenium.ruler.myArrows = [];
        tokenium.ruler.redraw();
    },

    redraw() {
        // Reset line width
        this.ctx.lineWidth = 5;

        // Clear all arrows
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw all arrows
        for (const arrow of this.myArrows.concat(this.otherArrows)) {
            if (arrow.start.x != arrow.end.x || arrow.start.y != arrow.end.y) {
                this.ctx.strokeStyle = arrow.color;

                this.ctx.beginPath();

                // Draw the flaps
                this.ctx.moveTo(arrow.flap1.x, arrow.flap1.y);
                this.ctx.lineTo(arrow.end.x, arrow.end.y);
                this.ctx.lineTo(arrow.flap2.x, arrow.flap2.y);

                // Draw the base
                this.ctx.moveTo(arrow.start.x, arrow.start.y);
                this.ctx.lineTo(arrow.end.x, arrow.end.y)

                // Apply changes
                this.ctx.stroke();
            }
        }
    }
}

// Add the ruler canvas to the resizing event
window.defineAPI("changeTokeniumSize", (args) => {
    [width, height] = args;

    // Change the size of the ruler canvas
    tokenium.ruler.canvas.setAttribute("width", width);
    tokenium.ruler.canvas.setAttribute("height", height);

    // Redraw the ruler canvas
    tokenium.ruler.redraw();
});


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
            tokenium.ruler.endMeasuring()
        }
    }
});
window.addEventListener("mouseup", (ev) => {
    // If LMB was released, end measurement                            If RMB was released in "ready" mode, don't start measuring
    if ((ev.button == 0 && tokenium.ruler.measureStatus != "idle") || (ev.button == 2 && tokenium.ruler.measureStatus == "ready")) {
        tokenium.ruler.endMeasuring();
    }
});

tokenium.meta.container.addEventListener("mousedown", (ev) => {
    if (ev.button == 2) {
        // If the RMB was pressed...
        ev.preventDefault();
        
        // Get ready for measurement 
        if (tokenium.ruler.measureStatus == "idle") {    
            tokenium.ruler.measureStatus = "ready";
        }

        // Pivot the arrow
        else if (tokenium.ruler.measureStatus == "active") {
            // Add the current arrow to the list
            tokenium.ruler.myArrows.push(new Arrow(tokenium.ruler.currentArrowStart, tokenium.ruler.currentArrowEnd, playerColor));

            // Set the new start coordinates
            if (!ev.ctrlKey) {var gridSnap = "center"}
            tokenium.ruler.currentArrowStart = tokenium.meta.projectPoint({x: ev.pageX, y: ev.pageY}, gridSnap);
        }
    }
});

tokenium.meta.container.addEventListener("mousemove", (ev) => {
    // If mouse is moved while status is ready, measuring can begin
    if (tokenium.ruler.measureStatus == "ready") {
        tokenium.ruler.measureStatus = "active";

        // Initialisation of measuring
        if (!ev.ctrlKey) {var gridSnap = "center"}
        tokenium.ruler.currentArrowStart = tokenium.meta.projectPoint({x: ev.pageX, y: ev.pageY}, gridSnap);
    }

    // Updating the arrow while moving
    else if (tokenium.ruler.measureStatus == "active") {
        if (!ev.ctrlKey) {
            // If ctrl is not held, snap the position to the grid
            let lastArrowEnd = [tokenium.ruler.currentArrowEnd.x, tokenium.ruler.currentArrowEnd.y];

            tokenium.ruler.currentArrowEnd = tokenium.meta.projectPoint({x: ev.pageX, y: ev.pageY}, "center");

            // Only change the arrow and redraw if the arrow is diffirent from the last one
            if (tokenium.ruler.currentArrowEnd.x != lastArrowEnd[0] || tokenium.ruler.currentArrowEnd.y != lastArrowEnd[1]) {
                tokenium.ruler.myArrows.pop();
                tokenium.ruler.myArrows.push(new Arrow(tokenium.ruler.currentArrowStart, tokenium.ruler.currentArrowEnd, playerColor));
                tokenium.ruler.redraw();
            }
        }
        else {
            // If ctrl is held, always put the end position at the mouse, and always change the arrow and redraw
            tokenium.ruler.currentArrowEnd = tokenium.meta.projectPoint({x: ev.pageX, y: ev.pageY});
            tokenium.ruler.myArrows.pop();
            tokenium.ruler.myArrows.push(new Arrow(tokenium.ruler.currentArrowStart, tokenium.ruler.currentArrowEnd, playerColor));
            tokenium.ruler.redraw();
        }
    }
});


// Declare as loaded
window.declareAsLoaded("tokenium", "rulers");
