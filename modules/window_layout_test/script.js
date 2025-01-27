let isLayoutModeOn = false;

let button = document.getElementById("Toggle layout mode button");
button.addEventListener("click", (ev) => {
    isLayoutModeOn = !isLayoutModeOn;
    window.setLayoutMode(isLayoutModeOn);
});