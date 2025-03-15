var currentSize = 3;

// Recursive timeout function for checking if the buttons are off screen, and adjusting the size if so
function timeoutCallback() {
    // If the buttons go off screen, downsize them
    if (document.body.scrollHeight > window.innerHeight) {
        // Set the size
        currentSize -= 1;
        setSizeButtons(currentSize);

        // If the size is above the minimum, schedule another check in 1 ms
        if (currentSize > 1) setTimeout(timeoutCallback, 1);
    }
}

function resizeButtons(ev, upsize=false) {
    // If the button size should be reset, do so
    if (upsize) {
        setSizeButtons(3);
        currentSize = 3;
    }

    // If the size is above the minimum, schedule a check
    if (currentSize > 1) setTimeout(timeoutCallback, 1);
}

function setSizeButtons(n) {
    document.getElementById("output").innerHTML = "Resize: " + n;

    // Set the current button size classes
    document.querySelectorAll("button").forEach(btn => {
        btn.classList.remove("size-1", "size-2", "size-3");
        btn.classList.add("size-" + n);
    });
    document.querySelectorAll("img").forEach(img => {
        img.classList.remove("img-size-1", "img-size-2", "img-size-3");
        img.classList.add("img-size-" + n);
    });
}

window.addEventListener("resize", resizeButtons);
