let isLayoutModeOn = false;

let button = document.getElementById("Toggle layout mode button");
button.addEventListener("click", (ev) => {
    isLayoutModeOn = !isLayoutModeOn;
    window.setLayoutMode(isLayoutModeOn);
});

let shutdownButton = document.getElementById("Shutdown button");
shutdownButton.addEventListener("click", (ev) => {
    console.log("shutting")
    window.shutdown();
});
let restartButton = document.getElementById("Restart button");
restartButton.addEventListener("click", (ev) => {
    console.log("restart")
    window.shutdown(true);
});