let gameDropdown = document.getElementById("select game");

// startup
async function setupGameDropdown() {
    var gameList = await window.getGameList();
    
    for (let i of gameList) {
        let option = document.createElement("option");
        option.text = option.value = i;
        gameDropdown.add(option);
    }
}

setupGameDropdown();




// edit modules button
function openModuleSelector() {
    moduleSelector = window.open("../module_selector/index.html");
    moduleSelector.window.gameName = gameDropdown.value;
}








/*
async function test() {
    window.system.loadGame(await window.moduleList());
}

test();
*/
