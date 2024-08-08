const { app, BrowserWindow, ipcMain, MessageChannelMain } = require('electron');
//const fs = require("fs")

app.on("window-all-closed", () => {
    if (process.platform != "darwin") app.quit();
});
/*
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
    
    const {port1, port2} = new MessageChannelMain();
    
    window1.webContents.postMessage("port", "", [port1]);
    window2.webContents.postMessage("port", "", [port2]);
});
*/

app.whenReady().then(() => {
    win = new BrowserWindow({
        width: 800,
        height: 600,
        x: 25,
        y: 50,
        frame: false
    });

    win.loadFile("test_window_size/index.html");

    win2 = new BrowserWindow({
        width: 800,
        height: 600,
        x: 25,
        y: 50
    });

    win2.loadFile("test_window_size/index.html");
});
