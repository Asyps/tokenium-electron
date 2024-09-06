let gameDropdown = document.getElementById("select game");

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

// Play button
function start() {
    window.system.loadGame(gameDropdown.value);
}

// Change modules button
function openModuleSelector() {
    let moduleSelector = window.open("../module_selector/index.html");
    moduleSelector.window.gameName = gameDropdown.value;
}








/*
async function test() {
    window.system.loadGame(await window.moduleList());
}

test();
*/
