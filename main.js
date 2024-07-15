const { app, BrowserWindow } = require('electron')
const fs = require("fs")

function createWindow(w, h, x, y, file) {
    win = new BrowserWindow({
        width: w,
        height: h,
        x: x,
        y: y
    })

    win.loadFile(file)
}

app.whenReady().then(() => {
    window1 = createWindow(800, 600, 10, 10, "test_functions/index.html")
    window2 = createWindow(600, 800, 900, 700, "test_functions/susdex.html")
    
})

app.on("window-all-closed", () => {
    if (process.platform != "darwin") app.quit()
})