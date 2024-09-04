async function setupGameList() {
    var list = await window.gameList();

    var gameSelector = document.getElementById("select game");
    
    for (let i of list) {
        let option = document.createElement("option");
        option.text = option.value = i;
        gameSelector.add(option);
    }
}

setupGameList();



function openModuleSelector() {

}


async function generateOptions() {
    var moduleList = await window.moduleList();
    var selectedModules = await window.selectedModules("bang");

    console.log(moduleList)
    console.log(selectedModules)
}

generateOptions();






/*
async function test() {
    window.system.loadGame(await window.moduleList());
}

test();
*/
