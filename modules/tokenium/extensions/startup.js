// testing inputs, will be removed
window.callFunction("tokenium", "changeTokeniumSize", 64 * 13, 64 * 11);
window.callFunctionOnLoaded(["tokenium", "rulers"], "changeTokeniumSize", 64 * 12, 64 * 10);

window.callFunction("tokenium", "changeGridSize", 64);

tokenium.tokens.addToken("Dave", 3, 3);
tokenium.background.addBackgroundImage("../../games/desert/assets/cave.png", 64 * 14, 64 * 11);

window.declareAsLoaded("tokenium", "startup");
