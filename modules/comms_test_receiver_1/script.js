output = document.getElementById("output");

window.defineAPI("change displayed text", (thingToOutput) => {
    output.value = thingToOutput[0];
});

window.declareAsLoaded("comms_test_receiver_1");
