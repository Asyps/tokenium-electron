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

    // List of client side arrows
    localArrows: [],

    // The starting and ending positions of the current arrow
    currentArrowStart: {},
    currentArrowEnd: {},

    endMeasuring() {
        // End the measuring process
        tokenium.ruler.measureStatus = "idle";

        // Clear client side arrows and refresh canvas
        tokenium.ruler.localArrows = [];
        tokenium.ruler.redraw();
    },

    redraw() {
        // Reset line width
        this.ctx.lineWidth = 5;

        // Clear all arrows
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw all arrows
        for (const arrow of this.localArrows.concat(tokeniumData.publicArrows)) {
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
            // Add the current arrow to the list
            tokenium.ruler.localArrows.push(new Arrow(tokenium.ruler.currentArrowStart, tokenium.ruler.currentArrowEnd, playerColor));

            // Set the new start coordinates
            if (!ev.ctrlKey) {var gridSnap = "center"}
            tokenium.ruler.currentArrowStart = tokenium.panZoomHandler.projectPoint({x: ev.pageX, y: ev.pageY}, gridSnap);
        }
    }
});

tokenium.panZoomHandler.container.addEventListener("mousemove", (ev) => {
    // If mouse is moved while status is ready, measuring can begin
    if (tokenium.ruler.measureStatus == "ready") {
        tokenium.ruler.measureStatus = "active";

        // Initialisation of measuring
        if (!ev.ctrlKey) {var gridSnap = "center"}
        tokenium.ruler.currentArrowStart = tokenium.panZoomHandler.projectPoint({x: ev.pageX, y: ev.pageY}, gridSnap);
    }

    // Updating the arrow while moving
    else if (tokenium.ruler.measureStatus == "active") {
        if (!ev.ctrlKey) {
            // If ctrl is not held, snap the position to the grid
            let lastArrowEnd = [tokenium.ruler.currentArrowEnd.x, tokenium.ruler.currentArrowEnd.y];

            tokenium.ruler.currentArrowEnd = tokenium.panZoomHandler.projectPoint({x: ev.pageX, y: ev.pageY}, "center");

            // Only change the arrow and redraw if the arrow is diffirent from the last one
            if (tokenium.ruler.currentArrowEnd.x != lastArrowEnd[0] || tokenium.ruler.currentArrowEnd.y != lastArrowEnd[1]) {
                tokenium.ruler.localArrows.pop();
                tokenium.ruler.localArrows.push(new Arrow(tokenium.ruler.currentArrowStart, tokenium.ruler.currentArrowEnd, playerColor));
                tokenium.ruler.redraw();
            }
        }
        else {
            // If ctrl is held, always put the end position at the mouse, and always change the arrow and redraw
            tokenium.ruler.currentArrowEnd = tokenium.panZoomHandler.projectPoint({x: ev.pageX, y: ev.pageY});
            tokenium.ruler.localArrows.pop();
            tokenium.ruler.localArrows.push(new Arrow(tokenium.ruler.currentArrowStart, tokenium.ruler.currentArrowEnd, playerColor));
            tokenium.ruler.redraw();
        }
    }
});


// Declare as loaded
window.declareAsLoaded("tokenium", "rulers");
