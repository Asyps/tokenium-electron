// testing inputs, will be removed
tokenium.meta.changeTokeniumSize(64 * 13, 64 * 11);
tokenium.grid.changeGridSize(64);
tokenium.tokens.addToken("Dave", 3, 3);
tokenium.background.addBackgroundImage("../../games/desert/assets/cave.png", 64 * 14, 64 * 11, 0, 0);

window.declareAsLoaded("tokenium", "startup");
