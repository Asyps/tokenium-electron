async function setupGameList() {
    list = await window.gameList();
    console.log(list);

    let gameSelector = document.getElementById("game select");
    
    for (let i of list) {
        console.log(i);

        let option = document.createElement("option");
        option.text = option.value = i;
        gameSelector.add(option);
    }
}

setupGameList();
