output = document.getElementById("output")

function size(ev) {
    output.innerHTML = "Window position x: " + window.screenX + "<br>Window position y: " + window.screenY + "<br>Window width: " + window.outerWidth + "<br>Window height: " + window.outerHeight
}

document.addEventListener("mousedown", size)