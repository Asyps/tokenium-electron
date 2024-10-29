output = document.getElementById("output");

window.defineAPI("changeDisplayedText", (thingToOutput) => {
    output.value = thingToOutput;
});
