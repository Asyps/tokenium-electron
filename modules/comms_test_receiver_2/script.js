output = document.getElementById("output");

window.defineAPI("change displayed text", (thingToOutput) => {
    output.value = thingToOutput[0];
});