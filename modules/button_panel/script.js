var currentSize = 3;
/*
function recalculateButtons() {
    console.log("Recalculating")
    // Button size range
    let min = 50;
    let max = 100;

    // Size of the button area
    let width = window.innerWidth;
    let height = window.innerHeight;

    // Button count
    let buttonCount = document.querySelectorAll("button").length;

    // Find the largest acceptable button size within the allowed range using binary search
    while (max - min > 5) {
        // Once the searched range settles to a certain precision, stop iterating

        // Check the middle value in the range
        let mid = (max + min) / 2;

        // Calculate the number of slots in each direction
        let slotsX = Math.floor(width / (1.2 * mid));   // The 1.2 value includes the 1/10 margin of the button
        let slotsY = Math.floor(height / (1.2 * mid));

        // Check if the slots would fit the buttons
        if (slotsX * slotsY >= buttonCount) {
            // This size works; search the higher half
            min = mid;
        }
        else {
            // This size doesn't work; search the lower half
            max = mid;
        }
    }
    console.log("Settled on: " + min);

    // Set the current button size based on the final mid value
    document.querySelectorAll("button").forEach(btn => {
        btn.style.width = btn.style.height = min + "px";
        btn.style.margin = (min / 10) + "px";
    });
    document.querySelectorAll("img").forEach(img => {
        img.style.width = img.style.height = (0.8 * min)  + "px";
    });
}
*/

function recalculateButtons() {
    console.log("Recalculating");
    
    // Button size range
    let min = 50;
    let max = 100;
    
    // Size of the button area
    let width = window.innerWidth - 16      // Account for the body margin
    let height = window.innerHeight - 76;   // Leave 50 pixels for the game name
    console.log(`Window size: ${width}x${height}`);
    
    // Button count
    let buttonCount = document.querySelectorAll("button").length;
    console.log(`Button count: ${buttonCount}`);
    
    // Track iterations for debugging
    let iterations = 0;
    
    // Find the largest acceptable button size within the allowed range
    while (max - min > 0.5 && iterations < 20) { // Smaller precision and iteration limit
        iterations++;
        let mid = (max + min) / 2;
        
        // Calculate the number of slots in each direction
        let slotsX = Math.floor((width) / (1.2 * mid));
        let slotsY = Math.floor((height) / (1.2 * mid));
        let totalSlots = slotsX * slotsY;
        
        console.log(`Iteration ${iterations}: Testing size ${mid.toFixed(2)}px, slots: ${slotsX}x${slotsY}=${totalSlots}, need: ${buttonCount}`);
        
        if (totalSlots >= buttonCount) {
            // This size works; search the higher half
            min = mid;
            console.log(`  Size works, new min: ${min.toFixed(2)}`);
        } else {
            // This size doesn't work; search the lower half
            max = mid;
            console.log(`  Size too large, new max: ${max.toFixed(2)}`);
        }
    }
    
    // Use the final min value (largest working size)
    let finalSize = Math.floor(min); // Round down to ensure it fits
    console.log(`Final size: ${finalSize}px after ${iterations} iterations`);
    
    // Set the button size
    document.querySelectorAll("button").forEach(btn => {
        btn.style.width = btn.style.height = finalSize + "px";
        btn.style.margin = (finalSize / 10) + "px";
    });
    document.querySelectorAll("img").forEach(img => {
        img.style.width = img.style.height = (0.8 * finalSize) + "px";
    });
}



// Create a debouncing function which executes after delay ms after last call.
function debounce(callback, delay) {
    let timeout;
    return (...args) => {
        // If the function is called again before the delay runs out, clear the timeout
        clearTimeout(timeout);

        // Set a new timeout to run the callback
        timeout = setTimeout(() => callback.apply(this, args), delay);
    }
}

window.addEventListener("resize", debounce(recalculateButtons, 150));

/*
// Recursive timeout function for checking if the buttons are off screen, and adjusting the size if so
function timeoutCallback() {
    // If the buttons go off screen, downsize them
    if (document.body.scrollHeight > window.innerHeight) {
        // Set the size
        currentSize -= 1;
        setSizeButtons(currentSize);

        // If the size is above the minimum, schedule another check in 100 ms
        if (currentSize > 1) setTimeout(timeoutCallback, 100);
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



window.addEventListener("resize", resizeButtons);
*/