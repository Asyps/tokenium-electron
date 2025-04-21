// Register a description
window.callFunctionOnLoaded(["chat", "commands"], "registerDescription", "tokenium", 
    "This module is the key visual space of any game. The tokenium allows you to add a background, add tokens, and move them. Tokenium can be scrolled and panned. This module also includes a built in grid functionality."
);

// Helper functions
function px(number) {
    // Changes the inputted value to a px value
    return number.toString() + "px";
}
function unpx(pixels) {
    // Changes the inputted string value to a float
    let value = Number.parseFloat(pixels);
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
    "Dave": "../../games/desert/assets/Dave.png",
    "Fred": "../../profile_pics/placeholder_1.png",
    "Black rook": "../../games/chess/assets/black_rook.png",
    "Black knight": "../../games/chess/assets/black_knight.png",
    "Black bishop": "../../games/chess/assets/black_bishop.png",
    "Black pawn": "../../games/chess/assets/black_pawn.png",
    "Black king": "../../games/chess/assets/black_king.png",
    "Black queen": "../../games/chess/assets/black_queen.png",
    "White rook": "../../games/chess/assets/white_rook.png",
    "White knight": "../../games/chess/assets/white_knight.png",
    "White bishop": "../../games/chess/assets/white_bishop.png",
    "White pawn": "../../games/chess/assets/white_pawn.png",
    "White king": "../../games/chess/assets/white_king.png",
    "White queen": "../../games/chess/assets/white_queen.png",
}
const playerColor = "#00FFFF";

// Document mockup
tokeniumData = {
    // Tokenium size in px
    width: 1367,
    height: 2000,
    gridSize: 64,

    backgroundImage: {
        path: "../../games/desert/assets/cartoon-snow-ground.jpg",
        width: 1367,
        height: 2000
    },

    tokens: [
        {
            name: "Dave",
            position: { x: 192, y: 192 },
            width: 64,
            height: 64
        },
        {
            name: "Fred",
            position: { x: 512, y: 384 },
            width: 64,
            height: 64
        }
    ]
}

const tokenium = {
    // Builds the tokenium from Document data           if this object turns into a class, this will be the constructor
    initTokenium() {
        // Change sizes of all DOM containers
        for (i in tokenium) if (i != "initTokenium") tokenium[i].resize(tokeniumData.width, tokeniumData.height);

        // Add the background image
        this.background.addBackgroundImage(tokeniumData.backgroundImage.path, tokeniumData.backgroundImage.width, tokeniumData.backgroundImage.height);

        // Add the tokens
        for (i of tokeniumData.tokens) {
            this.tokens.addToken(i.name, i.position.x, i.position.y, i.width, i.height);
        }
    },

    panZoomHandler: {
        // DOM elements
        container: document.getElementById("tokenium container"),

        // The resize function
        resize(width, height) {
            this.container.style.setProperty("width", px(width));
            this.container.style.setProperty("height", px(height));
        },
        
        // Is tokenium being panned?
        panStatus: false,
        
        // Data about tokenium pan and zoom
        position: {
            x: 0,
            y: 0
        },
        Z: 1,

        // Limits to zooming    maybe will be moved to a Document containing tokenium settings
        zoomLimits: {
            max: 2,
            min: 0.5
        },
        
        // Function to project a point from absolute window coordinates to the relative tokenium coordinates (coordinates within the tokenium without effects of pan and zoom)
        projectPoint(coords, snapMode="no snap") {
            let logicalX = coords.x * this.Z - (this.Z - 1) * 0.5 * tokeniumData.width - this.position.x;
            let logicalY = coords.y * this.Z - (this.Z - 1) * 0.5 * tokeniumData.height - this.position.y;
            
            // If snapping is on and grid is on, snap the coordinates
            if (snapMode != "no snap" && tokeniumData.gridSize != null) {
                logicalX -= logicalX % tokeniumData.gridSize;
                logicalY -= logicalY % tokeniumData.gridSize;
                
                // If the snapping mode is center, move the coordinates to the center
                if (snapMode == "center") {
                    logicalX += tokeniumData.gridSize * 0.5;
                    logicalY += tokeniumData.gridSize * 0.5;
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
        // DOM elements
        container: document.getElementById("tokenDragLayer"),

        // The resize function
        resize(width, height) {
            this.container.style.setProperty("width", px(width));
            this.container.style.setProperty("height", px(height));
        },

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
        },

        abortCurrentDrag() {
            if (tokenium.dragHandler.dragStatus) {
                // Disable dragging
                tokenium.dragHandler.dragStatus = false;

                // Return the drag token to it's original position
                // Get the visual token
                let visualToken = document.getElementById(tokenium.dragHandler.dragObject.getAttribute("visualToken"));

                // Move the current token to where visual token is
                tokenium.dragHandler.dragObject.style.left = visualToken.style.left;
                tokenium.dragHandler.dragObject.style.top = visualToken.style.top;
            }
        },

        moveVisualToken() {
            // Obtain the visual token
            let visualToken = document.getElementById(this.dragObject.getAttribute("visualToken"));

            // Move the visual token to the position of the drag token
            visualToken.style.left = this.dragObject.style.left;
            visualToken.style.top = this.dragObject.style.top;
        }
    },

    background: {
        // DOM elements
        container: document.getElementById("backgroundLayer"),

        // The resize function
        resize(width, height) {
            this.container.style.setProperty("width", px(width));
            this.container.style.setProperty("height", px(height));
        },

        // A function to add an image to the background
        addBackgroundImage(path, width, height, positionX = 0, positionY = 0) {
            let img = document.createElement("img");

            img.src = path;
            img.height = height;
            img.width = width;
            img.style.left = px(positionX);
            img.style.top = px(positionY);
            
            this.container.appendChild(img);
        }
    },

    grid: {
        // DOM elements
        canvas: document.getElementById("gridLayer"),
        ctx: document.getElementById("gridLayer").getContext("2d"),

        // The resize function
        resize(width, height) {
            this.canvas.setAttribute("width", width);
            this.canvas.setAttribute("height", height);
    
            // Redraw the grid
            this.redraw();
        },

        redraw() {
            // Clear the grid
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            if (tokeniumData.gridSize != null) {
                // Only redraw the grid if it's turned on
                this.ctx.beginPath();

                // Redraw the vertical lines
                for (let i = tokeniumData.gridSize; i < this.canvas.width; i += tokeniumData.gridSize) {
                    this.ctx.moveTo(i, 0);
                    this.ctx.lineTo(i, this.canvas.height);
                }

                // Redraw the horizontal lines
                for (let i = tokeniumData.gridSize; i < this.canvas.height; i += tokeniumData.gridSize) {
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
        container: document.getElementById("tokenVisualLayer"),

        // The resize function
        resize(width, height) {
            this.container.style.setProperty("width", px(width));
            this.container.style.setProperty("height", px(height));
        },

        // A list of token names that are already in use
        tokenNameList: [],

        // Function to add a new token
        addToken(name, x, y, width=null, height=null) {
            // Create the DOM objects
            let dragToken = document.createElement("img");
            let visualToken = document.createElement("img");

            // Set images
            dragToken.src = visualToken.src = imgDict[name];

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
            dragToken.id = name + " drag";
            visualToken.id = name + " visual";

            // Setting height and width
            // If argument is specified and valid, use argument. Else if grid is turned off, use default value. Otherwise use grid size
            dragToken.width  = visualToken.width  = (width  > 7) ? width  : (tokenium.grid.gridSize == null) ? 64 : tokenium.grid.gridSize;
            dragToken.height = visualToken.height = (height > 7) ? height : (tokenium.grid.gridSize == null) ? 64 : tokenium.grid.gridSize;

            // Setting position
            dragToken.style.left = visualToken.style.left = px(x);
            dragToken.style.top = visualToken.style.top = px(y);

            // Set the CSS classes
            dragToken.setAttribute("class", "dragTokenLayer");
            visualToken.setAttribute("class", "visualTokenLayer");

            // Drag and drop functionality
            dragToken.addEventListener("mousedown", tokenium.dragHandler.beginDrag);
            dragToken.setAttribute("visualToken", visualToken.id);

            // Add the tokens to DOM
            tokenium.dragHandler.container.appendChild(dragToken);
            this.container.appendChild(visualToken);
        },

        moveToken(name, x, y) {
            let visual = document.getElementById(name + " drag");
            let drag = document.getElementById(name + " visual");

            visual.style.left = drag.style.left = px(x);
            visual.style.top = drag.style.top = px(y);
        },

        // Deletes the token with the given name
        removeToken(name) {
            if (this.tokenNameList.includes(name)) { 
                document.getElementById(name + " drag").remove();
                document.getElementById(name + " visual").remove();
                this.tokenNameList.remove(name);
            }
        }
    }
}

// Event for zooming in the tokenium
tokenium.panZoomHandler.container.addEventListener("wheel", (ev) => {
    // Only apply the change if the Z value would get smaller while it's above it's minimum, or the equivalent
    if (tokenium.panZoomHandler.Z > tokenium.panZoomHandler.zoomLimits.min && Math.sign(ev.deltaY) == 1 || tokenium.panZoomHandler.Z < tokenium.panZoomHandler.zoomLimits.max && Math.sign(ev.deltaY) == -1) {
        tokenium.panZoomHandler.Z *= 0.9 ** Math.sign(ev.deltaY);
    }

    // Apply the change
    tokenium.panZoomHandler.applyTransform();
});

// Events for panning the tokenium
tokenium.panZoomHandler.container.addEventListener("mousedown", (ev) => {
    // If the wheel button was pressed, start panning
    if (ev.button == 1) {
        ev.preventDefault();
        tokenium.panZoomHandler.panStatus = true;
    }
});
window.addEventListener("mouseup", (ev) => {
    // If the wheel button was released, stop panning
    if (ev.button == 1) {
        tokenium.panZoomHandler.panStatus = false;
    }
});
window.addEventListener("mousemove", (ev) => {
    // If the panStatus is true, move the tokenium along with the mouse
    if (tokenium.panZoomHandler.panStatus) {
        // Change the position   
        tokenium.panZoomHandler.position.x += ev.movementX * tokenium.panZoomHandler.Z;
        tokenium.panZoomHandler.position.y += ev.movementY * tokenium.panZoomHandler.Z;
        
        // Apply the change
        tokenium.panZoomHandler.applyTransform();
    }
});

// Events for token dragging
window.addEventListener("mouseup", (ev) => {
    // If the LMB was released, end dragging
    if (ev.button == 0 && tokenium.dragHandler.dragStatus) {   
        tokenium.dragHandler.dragStatus = false;

        // Move the visible token to the place where drag token is
        tokenium.dragHandler.moveVisualToken();
    }
});
tokenium.panZoomHandler.container.addEventListener("mousemove", (ev) => {
    // If a token is being dragged, apply movement
    if (tokenium.dragHandler.dragStatus) {
        if (ev.ctrlKey || tokeniumData.gridSize == null) {
            // If control is held or if grid is turned off, move the token along with the mouse
            tokenium.dragHandler.dragObject.style.left = px(unpx(tokenium.dragHandler.dragObject.style.left) + ev.movementX * tokenium.panZoomHandler.Z);
            tokenium.dragHandler.dragObject.style.top = px(unpx(tokenium.dragHandler.dragObject.style.top) + ev.movementY * tokenium.panZoomHandler.Z);
        }
        else {
            // Else snap token to grid
            let projectedMouse = tokenium.panZoomHandler.projectPoint({x: ev.clientX, y: ev.clientY}, "corner");
            tokenium.dragHandler.dragObject.style.left = px(projectedMouse.x);
            tokenium.dragHandler.dragObject.style.top = px(projectedMouse.y);
        }
    }
});

//tokenium.initTokenium();



// API to resize tokenium
window.defineAPI("tokeniumSize", (width, height) => {
    // If no new size is specified, the function call is an enquiry
    if (width == undefined || height == undefined) return [tokeniumData.width, tokeniumData.height];

    // Alter Document
    tokeniumData.width = width;
    tokeniumData.height = height;

    // Change sizes of all DOM containers
    for (i in tokenium) if (i != "initTokenium") tokenium[i].resize(tokeniumData.width, tokeniumData.height);

    // Return the new size 
    return [tokeniumData.width, tokeniumData.height];
}, true);

// API to change the size of a grid cell
window.defineAPI("tokeniumGridSize", (newCellSize) => { 
    // If no new grid size is specified, the function call is an enquiry
    if (newCellSize == undefined) return tokeniumData.gridSize;     
    
    // Alter Document
    if (newCellSize < 8) tokeniumData.gridSize = null;      // If the newCellSize is too small or null, turn off the grid
    else tokeniumData.gridSize = newCellSize;

    // Redraw the grid
    tokenium.grid.redraw();

    // Return the grid size
    return tokeniumData.gridSize;
}, true);

// API to add a token
window.defineAPI("addToken", (id, x, y, width, height) => {
    tokeniumData.tokens.push({
        name: id,
        position: { x: x, y: y },
        width: width,
        height: width
    },);

    tokenium.tokens.addToken(id, x, y, width, height);
});

async function defineCommannds() {
    // Command for resizing the tokenium
    // Define the handler
    window.defineAPI("command-tokenium-size", async (flags, width, height, mapName) => {
        // Parse the arguments
        if (width != undefined) width = parseInt(width);
        if (height != undefined) height = parseInt(height);    

        if (mapName == undefined) {
            // If no mapName is specified, resize if size specified, and return current/new size
            let size = await window.callFunction("tokenium", "tokeniumSize", width, height);
            
            window.callFunction("chat", "showCommandOutput", "local", "Tokenium size " + ((width == undefined || height == undefined) ? "is " : "changed to ") + size[0] + "px × " + size[1] + "px.");
        }
        else {
            // Coming soon
        }
    });
    // Register the command
    await window.callFunctionOnLoaded(["chat", "commands"], "registerCommand",
        "tokenium", "size",
        "tokenium size [width height [mapName]]",
        "Returns the size of the current tokenium map. If size is specified, it also resizes the current tokenium map. If mapName is specified, the action is done for the specific map instead.",
    );
    
    // Command for changing the tokenium grid size
    // Define the handler
    window.defineAPI("command-tokenium-grid", async (flags, newGridSize, mapName) => {
        // Parse arguments
        if (newGridSize != undefined) newGridSize = parseInt(newGridSize);
        
        if (mapName == undefined) {
            // If no mapName is specified, change grid size if it's specified, and return current/new grid size        
            let size = await window.callFunction("tokenium", "tokeniumGridSize", newGridSize);
            
            window.callFunction("chat", "showCommandOutput", "local", "Tokenium grid size " + ((newGridSize == undefined) ? "is " : "changed to ") + size + "px.");
        }
        else {
            // Coming soon
        }
    });
    // Register the command
    await window.callFunctionOnLoaded(["chat", "commands"], "registerCommand",
        "tokenium", "grid",
        "tokenium grid [newGridSize [mapName]]",
        "Returns the grid size of the current tokenium map. If newGridSize is specified, it also resizes the current tokenium grid. If mapName is specified, the action is done for the specific map instead.",
    );
}

defineCommannds() // Only run the function if user has permission for altering tokenium




// TEST define a system button

// Define the handler
window.defineAPI("system-button-resize-grid", () => {
    window.callFunction("tokenium", "tokeniumGridSize", 32);
});

// Register the button
window.callFunctionOnLoaded("button_panel", "registerSystemButton", "resize-grid", "button_icons/Dave.png");
