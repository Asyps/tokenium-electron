// Get DOM elements
let gameDropdown = document.getElementById("select game");
let playButton = document.getElementById("play");
let changeButton = document.getElementById("change");
let removeButton = document.getElementById("remove");

// Startup
async function setupGameDropdown() {
    // Get the list of existing games
    var gameList = await window.getGameList();
    
    // Add each one to the dropdown
    for (let i of gameList) {
        let option = document.createElement("option");
        option.text = option.value = i;
        gameDropdown.add(option);
    }
}
setupGameDropdown();

// Buttons enable/disable event
gameDropdown.onchange = () => {
    if (gameDropdown.value != "-") {
        // If no game is selected, disable relevant buttons
        playButton.disabled = false;
        changeButton.disabled = false;
        removeButton.disabled = false;
    }
    else {
        // If a game is selected, enable relevant buttons
        playButton.disabled = true;
        changeButton.disabled = true;
        removeButton.disabled = true;
    }
}


// Play button
function start() {
    window.system.loadGame(gameDropdown.value);
}

// Change modules button
function openModuleSelector() {
    let moduleSelector = window.open("../module_selector/index.html");
    moduleSelector.window.gameName = gameDropdown.value;
}
