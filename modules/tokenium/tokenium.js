// Register a description
let description = "This module is the key visual space of any game. The tokenium allows you to add a background, add tokens, and move them. Tokenium can be scrolled and panned. This module also includes a built in grid functionality.";
window.callFunctionOnLoaded(["chat", "commands"], "register module description", "tokenium", description);

// Helper functions
function px(number) {
    // Changes the inputted value to a px value
    return number.toString() + "px";
}
function unpx(pixels) {
    // Changes the inputted string value to a float
    value = Number.parseFloat(pixels);
    if (isNaN(value)) return 0;
    else return value;
}
function grid(number) {
    // Converts grid units to pixels
    if (tokenium.grid.gridSize == null) return number * 64; // Default value
    else return number * tokenium.grid.gridSize;
}

// Temporary stuff (will later be managed by other front end systems like character manager)
var imgDict = {
    "Dave": "../../games/desert/assets/Dave.png"
}
const playerColor = "#00FFFF";


const tokenium = {
    meta: {
        // DOM elements
        container: document.getElementById("tokenium container"),

        // Tokenium size in px
        width: 512,
        height: 512,

        // Data about tokenium pan and zoom
        position: {
            x: 0,
            y: 0
        },
        Z: 1,

        // Limits to zooming
        zoomLimits: {
            max: 2,
            min: 0.5
        },
        
        // Is tokenium being panned?
        panStatus: false,
        
        // Function to project a point from absolute window coordinates to the relative tokenium coordinates (coordinates within the tokenium without effects of pan and zoom)
        projectPoint(coords, snapMode="no snap") {
            let logicalX = coords.x * this.Z - (this.Z - 1) * 0.5 * this.width - this.position.x;
            let logicalY = coords.y * this.Z - (this.Z - 1) * 0.5 * this.height - this.position.y;
            
            // If snapping is on and grid is on, snap the coordinates
            if (snapMode != "no snap" && tokenium.grid.gridSize != null) {
                logicalX -= logicalX % tokenium.grid.gridSize;
                logicalY -= logicalY % tokenium.grid.gridSize;
                
                // If the snapping mode is center, move the coordinates to the center
                if (snapMode == "center") {
                    logicalX += tokenium.grid.gridSize * 0.5;
                    logicalY += tokenium.grid.gridSize * 0.5;
                }
            }

            return { x: logicalX, y: logicalY };
        },

        // Apply the current position and zoom values to the DOM
        applyTransform() {
            this.container.style.transform = "scale(" + 1 / this.Z + ") translate(" + px(this.position.x) + ", " + px(this.position.y) + ")";
        },
    },

    dragHandler: {
        // Is an object currently being dragged?
        dragStatus: false,

        // Currently dragged object
        dragObject: null,

        // A function that initiates the dragging procedure of a token - gets added to the token's mousedown event if the token should be draggable
        beginDrag(ev) {
            if (ev.button == 0) {
                ev.preventDefault();
                
                //tokenium.ruler.measureStatus = "ready";      
                
                tokenium.dragHandler.dragStatus = true;
                tokenium.dragHandler.dragObject = ev.target;
            }
        }
    },

    background: {
        // DOM elements
        container: document.getElementById("backgroundLayer"),

        // A function to add an image to the background
        addBackgroundImage(path, height, width, positionX = 0, positionY = 0) {
            let img = document.createElement("img");

            img.src = path;
            img.height = height;
            img.withh = width;
            img.style.left = px(positionX);
            img.style.top = px(positionY);
            
            this.container.appendChild(img);
        }
    },

    grid: {
        // DOM elements
        canvas: document.getElementById("gridLayer"),
        ctx: document.getElementById("gridLayer").getContext("2d"),

        // Grid size
        gridSize: null,

        redraw() {
            // Clear the grid
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            if (this.gridSize != null) {
                // Only redraw the grid if it's turned on
                this.ctx.beginPath();

                // Redraw the vertical lines
                for (let i = this.gridSize; i < this.canvas.width; i += this.gridSize) {
                    this.ctx.moveTo(i, 0);
                    this.ctx.lineTo(i, this.canvas.height);
                }

                // Redraw the horizontal lines
                for (let i = this.gridSize; i < this.canvas.height; i += this.gridSize) {
                    this.ctx.moveTo(0, i);
                    this.ctx.lineTo(this.canvas.width, i);
                }

                // Apply the redraw
                this.ctx.stroke();
            }
        }
    },

    tokens: {
        // DOM elements
        logicalContainer: document.getElementById("tokenLogicalLayer"),
        visualContainer: document.getElementById("tokenVisualLayer"),

        // A list of token names that are already in use
        tokenNameList: [],

        // Function to add a new token
        addToken(name, x, y, width=null, height=null) {
            // Create the DOM objects
            let logicalToken = document.createElement("img");
            let visualToken = document.createElement("img");

            // Set images
            logicalToken.src = visualToken.src = imgDict[name];

            // Set names
            // Appends " (n)" for duplicte ids (will later get replaced by character manager throwing a rename prompt if the id is duplicate, maybe this will stay as a safeguard)
            let n = 1
            while (this.tokenNameList.includes(name)) {
                if (n == 1) name += " (1)";
                n += 1;
                name = name.replace((n - 1).toString(), n.toString());
            }
            this.tokenNameList += name;
            
            // Setting IDs
            logicalToken.id = name + " logical";
            visualToken.id = name + " visual";

            // Setting height and width
            // If argument is specified and valid, use argument. Else if grid is turned off, use default value. Otherwise use grid size
            logicalToken.width = visualToken.width   = (width > 7) ? width : (tokenium.grid.gridSize == null) ? 64 : tokenium.grid.gridSize;
            logicalToken.height = visualToken.height = (height > 7) ? height : (tokenium.grid.gridSize == null) ? 64 : tokenium.grid.gridSize;

            // Setting position                                      Is grid turned off?
            logicalToken.style.left = visualToken.style.left = px(x);
            logicalToken.style.top = visualToken.style.top = px(y);

            // Set the CSS classes
            logicalToken.setAttribute("class", "logicalTokenLayer");
            visualToken.setAttribute("class", "visualTokenLayer");

            // Drag and drop functionality
            logicalToken.addEventListener("mousedown", tokenium.dragHandler.beginDrag);
            logicalToken.setAttribute("visualToken", visualToken.id);

            // Add the tokens to DOM
            this.logicalContainer.appendChild(logicalToken);
            this.visualContainer.appendChild(visualToken);
        },

        // Deletes the token with the given name
        removeToken(name) {
            if (this.tokenNameList.includes(name)) { 
                document.getElementById(name + " logical").remove();
                document.getElementById(name + " visual").remove();
                this.tokenNameList.remove(name);
            }
        }
    }
}


// API to resize the canvas
window.defineAPI("changeTokeniumSize", (args) => {
    [width, height] = args;

    tokenium.meta.width = width,
    tokenium.meta.height = height,

    // Change the size of the tokenium container
    tokenium.meta.container.style.setProperty("width", px(width));
    tokenium.meta.container.style.setProperty("height", px(height));

    // Change the size of the container for logical tokens
    tokenium.tokens.logicalContainer.style.setProperty("width", px(width));
    tokenium.tokens.logicalContainer.style.setProperty("height", px(height));
    
    // Change the size of the container for visual tokens
    tokenium.tokens.visualContainer.style.setProperty("width", px(width));
    tokenium.tokens.visualContainer.style.setProperty("height", px(height));

    // Change the size of the grid canvas
    tokenium.grid.canvas.setAttribute("width", width);
    tokenium.grid.canvas.setAttribute("height", height);

    // Redraw the grid
    tokenium.grid.redraw();
});

// API to change the size of a grid cell
window.defineAPI("changeGridSize", (args) => {
    [newCellSize] = args;   // If newCellSize is null, the grid is turned off

    // If the newCellSize is too small or null, turn off the grid
    if (newCellSize < 8) tokenium.grid.gridSize = null;
    else tokenium.grid.gridSize = newCellSize;

    // Redraw the grid
    tokenium.grid.redraw();
});


// Event for zooming in the tokenium
tokenium.meta.container.addEventListener("wheel", (ev) => {
    // Only apply the change if the Z value would get smaller while it's above it's minimum, or the equivalent
    if (tokenium.meta.Z > tokenium.meta.zoomLimits.min && Math.sign(ev.deltaY) == 1 || tokenium.meta.Z < tokenium.meta.zoomLimits.max && Math.sign(ev.deltaY) == -1) {
        tokenium.meta.Z *= 0.9 ** Math.sign(ev.deltaY);
    }

    // Apply the change
    tokenium.meta.applyTransform();
});

// Events for panning the tokenium
tokenium.meta.container.addEventListener("mousedown", (ev) => {
    // If the wheel button was pressed, start panning
    if (ev.button == 1) {
        ev.preventDefault();
        tokenium.meta.panStatus = true;
    }
});
window.addEventListener("mouseup", (ev) => {
    // If the wheel button was released, stop panning
    if (ev.button == 1) {
        tokenium.meta.panStatus = false;
    }
});
tokenium.meta.container.addEventListener("mousemove", (ev) => {
    // If the panStatus is true, move the tokenium along with the mouse
    if (tokenium.meta.panStatus) {
        // Change the position   
        tokenium.meta.position.x += ev.movementX * tokenium.meta.Z;
        tokenium.meta.position.y += ev.movementY * tokenium.meta.Z;
        
        // Apply the change
        tokenium.meta.applyTransform();
    }
});

// Events for token dragging
window.addEventListener("mouseup", (ev) => {
    // If the LMB was released, end dragging
    if (ev.button == 0) {   
        tokenium.dragHandler.dragStatus = false;
    }
});
tokenium.meta.container.addEventListener("mousemove", (ev) => {
    // If a token is being dragged, apply movement
    if (tokenium.dragHandler.dragStatus) {
        if (ev.ctrlKey || tokenium.grid.gridSize == null) {
            // If control is held or if grid is turned off, move the token along with the mouse
            tokenium.dragHandler.dragObject.style.left = px(unpx(tokenium.dragHandler.dragObject.style.left) + ev.movementX * tokenium.meta.Z);
            tokenium.dragHandler.dragObject.style.top = px(unpx(tokenium.dragHandler.dragObject.style.top) + ev.movementY * tokenium.meta.Z);
        }
        else {
            // Else snap token to grid
            let projectedMouse = tokenium.meta.projectPoint({x: ev.clientX, y: ev.clientY}, "corner");
            tokenium.dragHandler.dragObject.style.left = px(projectedMouse.x);
            tokenium.dragHandler.dragObject.style.top = px(projectedMouse.y);
        }
    }
});

// Declare as loaded
window.declareAsLoaded("tokenium");
