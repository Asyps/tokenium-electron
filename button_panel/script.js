/* Assistance by Claude.ai */

// Set the game name and background color
(async () => {
    document.getElementById("gameNameDiv").innerHTML = await window.gameName;
    document.body.style.backgroundColor = await window.gameColor;
})();

// Recalculates the buttons
function recalculateButtons() {   
    // Button size range
    const minimumSize = 50;
    let max = 100;
   
    // Size of the button area
    let width = window.innerWidth - 18;  // Account for the body margin
    let height = window.innerHeight - 18;
   
    // Button count
    let buttonCount = document.querySelectorAll("button").length;
   
    let min = minimumSize;

    // Find the largest acceptable button size within the allowed range using binary search
    while (max - min > 0.5) {   // Search up to a precision of 0.5
        // Check if the midpoint value is acceptable
        let mid = (max + min) / 2;
       
        // Calculate the number of slots in each direction
        // Add a small safety margin to ensure buttons fit
        let slotsX = Math.floor((width) / (1.21 * mid));
        let slotsY = Math.floor((height) / (1.21 * mid));
       
        if (slotsX * slotsY >= buttonCount + slotsX) {
            // This size works; search the higher half
            min = mid;
        } else {
            // This size doesn't work; search the lower half
            max = mid;
        }
    }
   
    // Use the final min value (largest working size)
    let finalSize = Math.floor(min * 0.98); // 2% reduction for safety

    // Calculate title size based on button size
    const gameNameElem = document.getElementById("gameNameDiv");
    gameNameElem.style.fontSize = `${Math.floor(finalSize * 0.6)}px`;
    gameNameElem.style.height = `${finalSize}px`; // Same height as a button row
    gameNameElem.style.lineHeight = `${finalSize}px`; // Center text vertically
    gameNameElem.style.marginBottom = `${finalSize / 10}px`; // Same margin as buttons
    
    // Determine if scrolling should be enabled
    if (finalSize <= minimumSize) {
        document.body.style.overflow = "auto";  // Enable scrolling at minimum size
    } else {
        document.body.style.overflow = "hidden";  // Disable scrolling otherwise
    }
   
    // Set the button size
    document.querySelectorAll("button").forEach(btn => {
        btn.style.width = btn.style.height = finalSize + "px";
        btn.style.margin = (finalSize / 10) + "px";
    });
    document.querySelectorAll("img").forEach(img => {
        img.style.width = img.style.height = (0.8 * finalSize) + "px";
    });
}

// Creates a debouncing function which executes after delay ms after last call.
function debounce(callback, delay) {
    let timeout;
    return (...args) => {
        // If the function is called again before the delay runs out, clear the timeout
        clearTimeout(timeout);

        // Set a new timeout to run the callback
        timeout = setTimeout(() => callback.apply(this, args), delay);
    }
}

// Assign the recalculation function inside debouncing to the resize event
window.addEventListener("resize", debounce(recalculateButtons, 150));


// Toggle the layout mode
var isLayoutModeOn = false;
function toggleLayoutMode() {
    isLayoutModeOn = !isLayoutModeOn;
    window.setLayoutMode(isLayoutModeOn);
}

// API for adding buttons
window.defineAPI("registerSystemButton", function (callbackName, iconPath) {
    // Create the button
    let button = document.createElement("button");

    // Assign the ID and the listener
    button.id = "moduleButton-" + callbackName;
    button.addEventListener("click", () => {
        window.callFunction(arguments[2], "system-button-" + callbackName);
    });

    // Create the image
    let img = document.createElement("img");

    // Assign the src
    img.src = "../modules/" + arguments[2] + "/" + iconPath;

    // Assemble the button and add it to DOM
    button.appendChild(img);
    document.body.appendChild(button);
    
    // Recalculate the button layout
    recalculateButtons();
}, false, true);

// API for other modules to use the system functions
window.defineAPI("shutdown", () => window.shutdown(false));
window.defineAPI("restart", () => window.shutdown(true));
window.defineAPI("toggleLayoutMode", toggleLayoutMode);

recalculateButtons();