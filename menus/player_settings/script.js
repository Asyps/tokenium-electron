(async () => {

// Obtain data from main process
var data = await window.getData();

// Get HTML elements
var startButton = document.getElementById("start-button");
var ipField = document.getElementById("server-address");
var passwordField = document.getElementById("server-password");
var saveButton = document.getElementById("save-button");
var nameHeader = document.getElementById("game-name");

// Format the game name
nameHeader.innerHTML = data.gameName;
nameHeader.style.color = data.color;
nameHeader.style.textShadow = "2px 2px 4px " + data.color + "88"; 

// Insert starting values into fields
ipField.value = data.ipAddress;
passwordField.value = data.password;


// Validation checks (first boolean tracks if any input changed)
var errorList = [true, false];

// Check for any changes
function anyChangeCallback() {
    errorList[0] = false;
    saveButton.disabled = errorList.some((a) => a);
}
function addAnyChangeCheck() {
    document.getElementById("server-data-div").addEventListener("input", anyChangeCallback, {once: true});
}
addAnyChangeCheck();

// Input validation
ipField.addEventListener("input", () => {
    let isError = false;

    // Check using regex
    if (ipField.value.match(/^(\d{1,3}.){3}\d{1,3}:\d{4,5}$/g)) {
        // Check ranges
        [ip, port] = ipField.value.split(":");
        bytes = ip.split(".");

        for (i of bytes) {
            if (i < 0 || i > 255) isError = true;
        }

        if (port < 1024 || port > 65635) isError = true;
    }
    else isError = true;
    
    if (isError) ipField.classList.add("error");
    else ipField.classList.remove("error");

    errorList[1] = isError;
    saveButton.disabled = errorList.some((a) => a);
});


// Assign event listeners to the buttons
document.getElementById("return-button").addEventListener("click", () => window.menuTransfer("main menu"));
startButton.addEventListener("click", () => window.menuTransfer("launch"));

saveButton.addEventListener("click", () => {
    // Update the data object
    data.ipAddress = ipField.value;
    data.password = passwordField.value;

    // Send it to main process
    window.setGameData(data);

    // Reset save button
    errorList[0] = true;
    saveButton.disabled = true;
    addAnyChangeCheck();
});


/* Generated by ChatGPT */

// Create particles
for (let i = 0; i < 20; i++) {
    let particle = document.createElement("div");
    particle.classList.add("particle");
    document.body.appendChild(particle);
    particle.style.left = `${Math.random() * 100}vw`;
    particle.style.top = `${Math.random() * 100}vh`;
    particle.style.animationDuration = `${3 + Math.random() * 5}s`;
    particle.style.backgroundColor = data.color + "88";
}

})();
