const { app, BrowserWindow, ipcMain } = require('electron');
//const fs = require("fs")

app.on("window-all-closed", () => {
    if (process.platform != "darwin") app.quit();
});

function createWindow(w, h, x, y, file) {
    win = new BrowserWindow({
        width: w,
        height: h,
        x: x,
        y: y,
        webPreferences: {
            preload: __dirname + "/preload.js"
        }
    })

    win.loadFile(file);
    return win;
}

app.whenReady().then(() => {
    window1 = createWindow(800, 600, 10, 10, "test_functions/index.html");
    window2 = createWindow(600, 800, 900, 700, "test_functions/susdex.html");
    
});

ipcMain.on("from_index", (e) => {
    window2.webContents.contents.postMessage("sus", "knedle", e.ports[0]);
});