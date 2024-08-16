async function setupGameList() {
    var list = await window.gameList();

    var gameSelector = document.getElementById("game select");
    
    for (let i of list) {
        let option = document.createElement("option");
        option.text = option.value = i;
        gameSelector.add(option);
    }
}

setupGameList();

async function test() {
    window.system.loadGame(await window.moduleList());
}

test();

