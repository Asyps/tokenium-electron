// testing inputs, will be removed

window.defineAPI("testing inputs", async (args) => {
    await window.callFunction("tokenium", "changeGridSize", 64);
    await window.callFunction("tokenium", "changeTokeniumSize", grid(12), grid(10));

    tokenium.tokens.addToken("Dave", grid(3), grid(3));
    tokenium.background.addBackgroundImage("../../games/desert/assets/cave.png", grid(14), grid(11));     
});

window.callFunctionOnLoaded(["tokenium", "rulers"], "testing inputs");

window.declareAsLoaded("tokenium", "startup");
