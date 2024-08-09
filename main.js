const { app, BrowserWindow, ipcMain, MessageChannelMain } = require('electron');
const fs = require("fs/promises")
const path = require("path")

app.on("window-all-closed", () => {
    if (process.platform != "darwin") app.quit();
});

class moduleInfo {
    constructor(name, extensions) {
        this.name = name;
        this.extensions = extensions;
    }
}

async function createModuleList() {
    var moduleList = [];

    // open the modules directory
    try {
        var modulesDir = await fs.opendir(path.join(__dirname, "modules"));
    } catch {
        // if it doesn't exist, create it and return empty list
        fs.mkdir(path.join(__dirname, "modules"));
        return moduleList;
    } 

    // iterate over entries
    for await (const moduleDirent of modulesDir) {

        // check if entry is a directory, if not, throw error
        if (moduleDirent.isDirectory()) {
            let moduleName = moduleDirent.name;
            
            // check and generate list of extension names
            let extensions = [];
            let hasExtensions = true;

            // open the extensions dir
            try {
                var extensionsDir = await fs.opendir(path.join(__dirname, "modules", moduleName, "extensions"));
            }
            catch {
                // if there is no extension folder, skip next part
                hasExtensions = false;
            }

            if (hasExtensions) {
                // cycle through the extensions
                for await (const extensionDirent of extensionsDir) {
                    extensionName = extensionDirent.name;

                    // check if entry is a .js file, else throw error
                    if (extensionDirent.isFile() && (path.extname(extensionName) == ".js")) {
                        // add name of extension to list
                        extensions.push(extensionName.substring(0, extensionName.length-3));
                    }
                    else {
                        throw new Error("The folder 'extensions' of the module '" + moduleName + "' should contain only .js files.")
                    }
                }
            }
            
            moduleList.push(new moduleInfo(moduleName, extensions));

        }
        else {
            throw new Error("The folder 'modules' should contain only folders.");
        }
    }
    
    return moduleList;
}

async function createGameList() {
    var gameList = [];

    // open the games directory
    try {
        var gamesDir = await fs.opendir(path.join(__dirname, "games"));
    } catch {
        // if it doesn't exist, create it and return empty list
        fs.mkdir(path.join(__dirname, "games"));
        return gameList;
    } 

    // iterate over entries
    for await (const gameDirent of gamesDir) {

        // check if entry is a directory, if not, throw error
        if (gameDirent.isDirectory()) {
            gameList.push(gameDirent.name);
        }
        else {
            throw new Error("The folder 'games' should contain only folders.");
        }
    }
    
    return gameList;
}


/*
function createWindow(w, h, x, y, file) {
    win = new BrowserWindow({
        width: w,
        height: h,
        x: x,
        y: y,
        webPreferences: {
            preload: path.join(__dirname, "preload.js")
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

ipcMain.handle("gameList", async () => await createGameList());


app.whenReady().then(() => {
    win = new BrowserWindow({
        width: 800,
        height: 600,
        x: 25,
        y: 50,
        webPreferences: {
            preload: path.join(__dirname, "game_choose_window", "preload.js")
        }
    });

    win.loadFile(path.join(__dirname, "game_choose_window", "index.html"));
});
