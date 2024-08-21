// helper functions
function px(number) {
    return number.toString() + "px";
}
function unpx(pixels) {
    value = Number.parseFloat(pixels);
    if (isNaN(value)) return 0;
    else return value;
}

// temporary stuff (will later be managed by other front end systems like character manager)
var imgDict = {
    "Dave": "./images/Dave.png"
}
const playerColor = "#00FFFF";

/*
// class arrow
class Arrow {
    constructor(start, end, color) {
        this.start = start;
        this.end = end;
        this.color = color;

        let flapAngle = Math.PI / 6;
        let flapLenght = 10;

        let angle = Math.atan2(start.y - end.y, start.x - end.x);

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
*/

const tokenium = {
    meta: {
        viewport: document.getElementById("tokenium viewport"),
        container: document.getElementById("tokenium container"),

        width: 512,
        height: 512,

        /*
        changeTokeniumSize(width, height) {
            this.viewport.style.setProperty("width", px(width));
            this.viewport.style.setProperty("height", px(height));
            this.container.style.setProperty("width", px(width));
            this.container.style.setProperty("height", px(height));
            tokenium.tokens.logicalContainer.style.setProperty("width", px(width));
            tokenium.tokens.logicalContainer.style.setProperty("height", px(height));
            tokenium.tokens.visualContainer.style.setProperty("width", px(width));
            tokenium.tokens.visualContainer.style.setProperty("height", px(height));

            tokenium.grid.canvas.setAttribute("width", width);
            tokenium.grid.canvas.setAttribute("height", height);
            //tokenium.ruler.canvas.setAttribute("width", width);
            //tokenium.ruler.canvas.setAttribute("height", height);

            this.width = width;
            this.height = height;
        },
        */

        changeTokeniumSize(width, height) {
            document.dispatchEvent(new CustomEvent("changeTokeniumSize", {
                detail: {
                    width: width,
                    height: height
                }
            }));
        },

        divOffset: {
            x: unpx(document.getElementById("tokenium viewport").style.left),
            y: unpx(document.getElementById("tokenium viewport").style.top)
        },

        position: {
            x: 0,
            y: 0
        },
        Z: 1,

        projectPoint(coords, snapToCenter=null) {
            const centerX = this.width * 0.5;
            const centerY = this.height * 0.5;
            let logicalX = (coords.x - this.divOffset.x - centerX) * this.Z + centerX - this.position.x;
            let logicalY = (coords.y - this.divOffset.y - centerY) * this.Z + centerY - this.position.y;
            
            if (snapToCenter != null) {
                if (logicalX == tokenium.meta.width) logicalX -= 1;
                if (logicalY == tokenium.meta.height) logicalY -= 1;

                logicalX -= logicalX % tokenium.grid.gridSize;
                logicalY -= logicalY % tokenium.grid.gridSize;
            }

            if (snapToCenter == true) {
                logicalX += tokenium.grid.gridSize * 0.5;
                logicalY += tokenium.grid.gridSize * 0.5;
            }
            return { x: logicalX, y: logicalY };
        },

        applyTransform() {
            this.container.style.transform = "scale(" + 1 / this.Z + ") translate(" + px(this.position.x) + ", " + px(this.position.y) + ")";
        },

        panStatus: false,
        panStart: {
            x: 0,
            y: 0
        },
        
    },

    dragHandler: {
        dragStatus: false,
        setCtrlOffset: true,
        dragStart: {
            x: 0,
            y: 0
        },
        dragObject: 0,
        dragOffset: {
            x: 0,
            y: 0
        },

        beginDrag(ev) {
            if (ev.button == 0) {
                ev.preventDefault();
                
                //tokenium.ruler.measureStatus = "ready";      
                
                tokenium.dragHandler.dragStatus = true;
                tokenium.dragHandler.dragObject = ev.target;

                if (!ev.ctrlKey) var gridSnap = false;
                tokenium.dragHandler.dragStart = tokenium.meta.projectPoint({x: ev.pageX, y: ev.pageY}, gridSnap);
            }
        }
    },

    settings: {
        zoomLimits: {
            max: 2,
            min: 0.5
        },

        checkLimits(value, limit) {
            if (value < limit.min) {
                value = limit.min;
            }
            else if (value > limit.max) {
                value = limit.max;
            }
            return value;
        }
    },

    background: {
        container: document.getElementById("backgroundLayer"),

        addBackgroundImage(path, height, width, positionX = 0, positionY = 0) {
            img = document.createElement("img");

            img.src = path;
            img.height = height;
            img.withh = width;
            img.style.left = px(positionX);
            img.style.top = px(positionY);
            
            this.container.appendChild(img);
        }
    },

    grid: {
        canvas: document.getElementById("gridLayer"),
        get ctx() { return this.canvas.getContext("2d") },

        changeGridSize(size) {
            this.gridSize = size;

            // clear grid
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            // redraw grid
            for (let i = size; i < this.canvas.width; i += size) {
                this.ctx.moveTo(i, 0);
                this.ctx.lineTo(i, this.canvas.height);
            }
            for (let i = size; i < this.canvas.height; i += size) {
                this.ctx.moveTo(0, i);
                this.ctx.lineTo(this.canvas.width, i);
            }
            this.ctx.stroke();
        },
    },

    tokens: {
        logicalContainer: document.getElementById("tokenLogicalLayer"),
        visualContainer: document.getElementById("tokenVisualLayer"),
        tokenNameList: [],

        addToken(name, x, y) {
            logicalToken = document.createElement("img");
            visualToken = document.createElement("img");

            // image
            logicalToken.src = visualToken.src = imgDict[name];

            // name
            // appends " (n)" for duplicte ids (will later get replaced by character manager throwing a rename prompt if the id is duplicate, maybe this will stay as a safeguard)
            let n = 1
            while (this.tokenNameList.includes(name)) {
                if (n == 1) name += " (1)";
                n += 1;
                name = name.replace((n - 1).toString(), n.toString());
            }
            this.tokenNameList += name;
            
            logicalToken.id = name + " logical";
            visualToken.id = name + " visual";

            // size
            logicalToken.width = visualToken.width = logicalToken.height = visualToken.height = tokenium.grid.gridSize;

            // position
            logicalToken.style.top = visualToken.style.top = px(y * tokenium.grid.gridSize);
            logicalToken.style.left = visualToken.style.left = px(x * tokenium.grid.gridSize);

            logicalToken.setAttribute("class", "logicalTokenLayer");
            visualToken.setAttribute("class", "visualTokenLayer");

            // drag and drop
            logicalToken.addEventListener("mousedown", tokenium.dragHandler.beginDrag);
            logicalToken.setAttribute("visualToken", visualToken.id);

            this.logicalContainer.appendChild(logicalToken);
            this.visualContainer.appendChild(visualToken);
        },

        removeToken(name) {
            if (this.tokenNameList.includes(name)) { 
                document.getElementById(name + " logical").remove();
                document.getElementById(name + " visual").remove();
                this.tokenNameList.remove(name);
            }
        }
    },
/*
    ruler: {
        canvas: document.getElementById("rulerLayer"),
        get ctx() { return this.canvas.getContext("2d"); },

        measureStatus: "idle",

        myArrows: [],
        otherArrows: [],

        currentArrowStart: {},
        currentArrowEnd: {},

        endMeasuring() {
            tokenium.ruler.measureStatus = "idle";

            tokenium.ruler.myArrows = [];
            tokenium.ruler.updateCanvas();
        },

        updateCanvas() {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.lineWidth = 5;

            for (const arrow of this.myArrows.concat(this.otherArrows)) {
                if (arrow.start.x != arrow.end.x || arrow.start.y != arrow.end.y) {
                    this.ctx.strokeStyle = arrow.color;

                    this.ctx.beginPath();

                    this.ctx.moveTo(arrow.flap1.x, arrow.flap1.y);
                    this.ctx.lineTo(arrow.end.x, arrow.end.y);
                    this.ctx.lineTo(arrow.flap2.x, arrow.flap2.y);

                    this.ctx.moveTo(arrow.start.x, arrow.start.y);
                    this.ctx.lineTo(arrow.end.x, arrow.end.y)

                    this.ctx.stroke();
                }
            }
        },
    },
*/
}

/*
// key press handler
var pressedKeys = {};
tokenium.meta.viewport.addEventListener("keyup", function(e) { pressedKeys[e.code] = false });
tokenium.meta.viewport.addEventListener("keydown", function(e) { pressedKeys[e.code] = true });
*/

// resizing event
document.addEventListener("changeTokeniumSize", (e) => {
    tokenium.meta.viewport.style.setProperty("width", px(e.detail.width));
    tokenium.meta.viewport.style.setProperty("height", px(e.detail.height));
    tokenium.meta.container.style.setProperty("width", px(e.detail.width));
    tokenium.meta.container.style.setProperty("height", px(e.detail.height));
    tokenium.tokens.logicalContainer.style.setProperty("width", px(e.detail.width));
    tokenium.tokens.logicalContainer.style.setProperty("height", px(e.detail.height));
    tokenium.tokens.visualContainer.style.setProperty("width", px(e.detail.width));
    tokenium.tokens.visualContainer.style.setProperty("height", px(e.detail.height));

    tokenium.grid.canvas.setAttribute("width", e.detail.width);
    tokenium.grid.canvas.setAttribute("height", e.detail.height);
});




// scrolling the tokenium
tokenium.meta.viewport.addEventListener("wheel", (ev) => {
    // change the zoom level
    tokenium.meta.Z = 1 / (1 / tokenium.meta.Z + Math.sign(ev.deltaY) * 0.1);
    tokenium.meta.Z = tokenium.settings.checkLimits(tokenium.meta.Z, tokenium.settings.zoomLimits)
    tokenium.meta.applyTransform();
});

// panning the tokenium
tokenium.meta.viewport.addEventListener("mousedown", (ev) => {
    // start panning
    if (ev.button == 1) {
        ev.preventDefault();

        tokenium.meta.panStatus = true;
        tokenium.meta.panStart = tokenium.meta.projectPoint({x: ev.pageX, y: ev.pageY});
    }
});

window.addEventListener("mouseup", (ev) => {
    // end panning
    if (ev.button == 1) {
        tokenium.meta.panStatus = false;
    }
});

tokenium.meta.viewport.addEventListener("mousemove", (ev) => {
    // moving the tokenium
    if (tokenium.meta.panStatus) {
    //if ((ev.buttons & 4) != 0 && tokenium.meta.panStatus) {
        projectedMouse = tokenium.meta.projectPoint({x: ev.pageX, y: ev.pageY});

        tokenium.meta.position.x += projectedMouse.x - tokenium.meta.panStart.x;
        tokenium.meta.position.y += projectedMouse.y - tokenium.meta.panStart.y;

        //console.log(translatedOrigin, translatedViewportSize);
        //transform.position.x = checkLimits(transform.position.x, {max: , min: });
        //transform.position.y = checkLimits(transform.position.y, {max: , min: });

        tokenium.meta.panStart = tokenium.meta.projectPoint({x: ev.pageX, y: ev.pageY});

        tokenium.meta.applyTransform();
    }
});



// dragHandler
window.addEventListener("mouseup", (ev) => {
    // end dragging
    if (ev.button == 0 && tokenium.dragHandler.dragStatus) {
        tokenium.dragHandler.dragStatus = false;
        tokenium.dragHandler.setCtrlOffset = true;
        tokenium.dragHandler.dragOffset = {x: 0, y: 0}
    }
});

tokenium.meta.container.addEventListener("mousemove", (ev) => {
    // applying movement to token
    if (tokenium.dragHandler.dragStatus) {
        if (!ev.ctrlKey) {
            var gridSnap = false
        }
        projectedMouse = tokenium.meta.projectPoint({x: ev.pageX, y: ev.pageY}, gridSnap);

        if (ev.ctrlKey && tokenium.dragHandler.setCtrlOffset) {
            tokenium.dragHandler.setCtrlOffset = false;
            tokenium.dragHandler.dragOffset = {x: projectedMouse.x - unpx(tokenium.dragHandler.dragObject.style.left), y: projectedMouse.y - unpx(tokenium.dragHandler.dragObject.style.top)}
        }
        
        tokenium.dragHandler.dragObject.style.left = px(projectedMouse.x - tokenium.dragHandler.dragOffset.x);
        tokenium.dragHandler.dragObject.style.top = px(projectedMouse.y - tokenium.dragHandler.dragOffset.y);
    }
});

window.addEventListener("keyup", (ev) => {
    if (ev.key == "Control") {
        tokenium.dragHandler.setCtrlOffset = true;
        tokenium.dragHandler.dragOffset = {x: 0, y: 0}
    }
});


/*
// the ruler system
window.addEventListener("contextmenu", (ev) => {
    // prevent context menu when measuring
    if (tokenium.ruler.measureStatus == "active") {
        ev.preventDefault()
    }
});


window.addEventListener("mousedown", (ev) => {
    if (ev.button == 0) {
        // end measurement
        if (tokenium.ruler.measureStatus == "active") {
            tokenium.ruler.endMeasuring()
        }
    }
});

tokenium.meta.container.addEventListener("mousedown", (ev) => {
    if (ev.button == 2) {
        ev.preventDefault();
        // beginning of measurement
        if (tokenium.ruler.measureStatus == "idle") {    
            tokenium.ruler.measureStatus = "ready";
        }

        // ruler pivot
        else if (tokenium.ruler.measureStatus == "active") {
            tokenium.ruler.myArrows.push(new Arrow(tokenium.ruler.currentArrowStart, tokenium.ruler.currentArrowEnd, playerColor));

            if (!ev.ctrlKey) {var gridSnap = true}
            tokenium.ruler.currentArrowStart = tokenium.meta.projectPoint({x: ev.pageX, y: ev.pageY}, gridSnap);
        }
    }
});

window.addEventListener("mouseup", (ev) => {
    // end measurement
    if ((tokenium.ruler.measureStatus != "idle" && ev.button == 0) || (tokenium.ruler.measureStatus == "ready") && ev.button == 2) {
        tokenium.ruler.endMeasuring();
    }
});

tokenium.meta.container.addEventListener("mousemove", (ev) => {
    // if mouse is moved while status is ready, measuring can begin
    if (tokenium.ruler.measureStatus == "ready") {
        tokenium.ruler.measureStatus = "active";

        // initialisation of measuring
        if (!ev.ctrlKey) {var gridSnap = true}
        tokenium.ruler.currentArrowStart = tokenium.meta.projectPoint({x: ev.pageX, y: ev.pageY}, gridSnap);
    }

    // updating the arrow while moving
    else if (tokenium.ruler.measureStatus == "active") {
        if (!ev.ctrlKey) {
            lastArrowEnd = [tokenium.ruler.currentArrowEnd.x, tokenium.ruler.currentArrowEnd.y];

            tokenium.ruler.currentArrowEnd = tokenium.meta.projectPoint({x: ev.pageX, y: ev.pageY}, true);

            if (tokenium.ruler.currentArrowEnd.x != lastArrowEnd[0] || tokenium.ruler.currentArrowEnd.y != lastArrowEnd[1]) {
                tokenium.ruler.myArrows.pop();
                tokenium.ruler.myArrows.push(new Arrow(tokenium.ruler.currentArrowStart, tokenium.ruler.currentArrowEnd, playerColor));
                tokenium.ruler.updateCanvas();
            }
        }
        else {
            tokenium.ruler.currentArrowEnd = tokenium.meta.projectPoint({x: ev.pageX, y: ev.pageY});
            tokenium.ruler.myArrows.pop();
            tokenium.ruler.myArrows.push(new Arrow(tokenium.ruler.currentArrowStart, tokenium.ruler.currentArrowEnd, playerColor));
            tokenium.ruler.updateCanvas();
        }
    }
});
*/