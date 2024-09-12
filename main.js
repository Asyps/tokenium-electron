// Debug
process.traceProcessWarnings = true

// Imports
const { app, BrowserWindow, ipcMain, MessageChannelMain } = require('electron');
const fs = require("fs/promises");
const path = require("path");

// Close the application when all windows are closed
app.on("window-all-closed", () => {
    if (process.platform != "darwin") app.quit();
});

// Main menu
app.whenReady().then(() => {
    // Open the main menu
    mainMenu = new BrowserWindow({
        // To do - security stuff
        width: 800,
        height: 600,
        x: 25,
        y: 50,
        webPreferences: {
            preload: path.join(__dirname, "main_menu", "preload.js")
        }
    });

    mainMenu.loadFile(path.join(__dirname, "main_menu", "index.html"));

    // Handler for the module selector window
    mainMenu.webContents.setWindowOpenHandler(() => {
        // To do - security stuff
        return {
            action: "allow",
            overrideBrowserWindowOptions: {
                width: 400,
                height: 500,

                frame: true,
                resizable: true,
                
                modal: true,
                parent: mainMenu,

                webPreferences: {
                    preload: path.join(__dirname, "module_selector", "preload.js")
                }
            }
        }
    });
});

// Class for handling modules
class moduleInfo {
    constructor(name, extensions) {
        this.name = name;
        this.extensions = extensions;
    }
}

// Mockup, will later get the info from server/files/whatever
let games = {
    bang: [
        new moduleInfo("tokenium", [])
    ],
    desert: [
        new moduleInfo("tokenium", ["startup"]),
        new moduleInfo("chat", []),
        new moduleInfo("calculator", [])
    ],
    uno: [
        new moduleInfo("tokenium", []),
        new moduleInfo("chat", [])
    ]
};




// Functions for reading available modules and games
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

// Functions to obtain lists of existing image files etc.
async function createProfilePictureList() {
    let profilePictureList = [];

    // Open the profile picture directory
    try {
        var pfpDir = await fs.opendir(path.join(__dirname, "profile_pics"));
    } catch {
        // If it doesn't exist, create it and return empty pfp list
        fs.mkdir(path.join(__dirname, "profile_pics"));
        return profilePictureList;
    }

    // Iterate over entries
    for await (const pfpDirent of pfpDir) {

        // Check if entry is a directory, if not, throw error
        if (pfpDirent.isFile()) {
            profilePictureList.push(pfpDirent.name);
        }
        else {
            throw new Error("The folder 'profile_pics' should contain only ().");
        }
    }

    return profilePictureList;
}

async function createImageList(gameName) {
    let imageList = [];

    // Open the profile picture directory
    try {
        var imagesDir = await fs.opendir(path.join(__dirname, "games", gameName, "images"));
    } catch {
        // If it doesn't exist, create it and return empty pfp list
        fs.mkdir(path.join(__dirname, "games", gameName, "images"));
        return imageList;
    }
}


// Main menu handlers
ipcMain.handle("getGameList", async () => await createGameList());
ipcMain.handle("getModuleList", async () => await createModuleList());
ipcMain.handle("getSelectedModules", (ev, gameName) => games[gameName]);
ipcMain.handle("setSelectedModules", (ev, gameName, moduleList) => games[gameName] = moduleList);

ipcMain.handle("loadGame", (ev, gameName) => {
    // Close main menu
    mainMenu.close();

    // Get the list of modules to load
    modList = games[gameName];

    for (i of modList) {
        // Create the module window
        let moduleWindow = new BrowserWindow({
            // To-do security stuff
            width: 800,
            height: 600,
            x: 25,
            y: 50,
            /*
            webPreferences: {
                preload: path.join(__dirname, "preload.js");
            }
            */
        });

        moduleWindow.loadFile(path.join(__dirname, "modules", i.name, "index.html"));

        // Add extensions
        for (j of i.extensions) {
            moduleWindow.webContents.executeJavaScript("window.s = document.createElement('script'); window.s.src = 'extensions\\" + path.sep + j + ".js'; document.body.appendChild(window.s); delete window.s;");
        }

    }
});










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