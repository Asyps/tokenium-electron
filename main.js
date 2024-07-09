const { app, BrowserWindow, BrowserView } = require('electron')

function createWindow() {
    const win = new BrowserWindow({
        width: 800, height: 600
    })

    const view1 = new BrowserView()
    const view2 = new BrowserView()

    view1.setBounds({
        x: 0,
        y: 0,
        width: 400,
        height: 600
    })
    view2.setBounds({
        x: 400,
        y: 0,
        width: 400,
        height: 600
    })

    view1.webContents.loadFile("index.html")
    view2.webContents.loadFile("susdex.html")

    win.addBrowserView(view1)
    win.addBrowserView(view2)
}

app.whenReady().then(() => {
    createWindow()
})

app.on("window-all-closed", () => {
    if (process.platform != "darwin") app.quit()
})