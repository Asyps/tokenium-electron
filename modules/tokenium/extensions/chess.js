// Prepare the tokens
var xPosition = 192;
var tokens = [];
for (i of ["rook", "knight", "bishop", "queen", "king", "bishop", "knight", "rook"]) {
    // Add the white pieces
    tokens.push({
        name: "Black " + i,
        position: { x: xPosition, y: 64 },
        width: 64,
        height: 64
    });

    tokens.push({
        name: "Black pawn",
        position: { x: xPosition, y: 128 },
        width: 64,
        height: 64
    });

    tokens.push({
        name: "White pawn",
        position: { x: xPosition, y: 448 },
        width: 64,
        height: 64
    });

    tokens.push({
        name: "White " + i,
        position: { x: xPosition, y: 512 },
        width: 64,
        height: 64
    });

    xPosition += 64;
}

// Overwrite tokenium data
tokeniumData = {
    // Tokenium size in px
    width: 960,
    height: 640,
    gridSize: 64,

    backgroundImage: {
        path: "../../games/chess/assets/chessboard.jpg",
        width: 544,
        height: 544,
        x: 176,
        y: 48
    },

    tokens: tokens,
}

// Chess board
tokenium.background.addBackgroundImage("../../games/chess/assets/wooden_table.jpg", 960, 640);



// Reseting function
function reset() {
    tokenium.tokens.moveToken("Black rook", 192, 64);
    tokenium.tokens.moveToken("Black knight", 256, 64);
    tokenium.tokens.moveToken("Black bishop", 320, 64);
    tokenium.tokens.moveToken("Black queen", 384, 64);
    tokenium.tokens.moveToken("Black king", 448, 64);
    tokenium.tokens.moveToken("Black bishop (2)", 512, 64);
    tokenium.tokens.moveToken("Black knight (2)", 576, 64);
    tokenium.tokens.moveToken("Black rook (2)", 640, 64);
    
    tokenium.tokens.moveToken("White rook", 192, 512);
    tokenium.tokens.moveToken("White knight", 256, 512);
    tokenium.tokens.moveToken("White bishop", 320, 512);
    tokenium.tokens.moveToken("White queen", 384, 512);
    tokenium.tokens.moveToken("White king", 448, 512);
    tokenium.tokens.moveToken("White bishop (2)", 512, 512);
    tokenium.tokens.moveToken("White knight (2)", 576, 512);
    tokenium.tokens.moveToken("White rook (2)", 640, 512);

    tokenium.tokens.moveToken("Black pawn", 192, 128);
    tokenium.tokens.moveToken("White pawn", 192, 448);

    for (let i = 2; i < 9; i++) {
        tokenium.tokens.moveToken("Black pawn (" + i + ")", 128 + i * 64, 128);
        tokenium.tokens.moveToken("White pawn (" + i + ")", 128 + i * 64, 448);
    }
}

// Register the button
window.defineAPI("system-button-reset-chess", reset);
window.callFunctionOnLoaded("button_panel", "registerSystemButton", "reset-chess", "button_icons/white_knight.png");
