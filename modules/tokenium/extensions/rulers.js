
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

// html canvas
c = document.createElement("canvas");
c.id = "rulerLayer";
c.setAttribute("class", "tokenium_standard");
/*
    <canvas id="rulerLayer" class="tokenium_standard"></canvas>
*/
tokenium.meta.container.insertBefore(c, tokenium.tokens.logicalContainer);

// ruler data and functions
tokenium.ruler = {
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
    }
}

// resizing event
document.addEventListener("changeTokeniumSize", (e) => {
    tokenium.ruler.canvas.setAttribute("width", e.detail.width);
    tokenium.ruler.canvas.setAttribute("height", e.detail.height);
});


// the ruler system events
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

window.declareAsLoaded("tokenium", "rulers");
