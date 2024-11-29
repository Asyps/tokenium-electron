// Debug
process.traceProcessWarnings = true

// Imports
const { app, BrowserWindow, ipcMain, screen } = require('electron');
const fs = require("fs/promises");
const path = require("path");

// a place to put the main process global variables
globals = {};

// Close the application when all windows are closed
app.on("window-all-closed", () => {
    if (process.platform != "darwin") {
        if (globals.gameName) fileSystem.saveWindowLayout();
        app.quit();
    }
});


// Main menu
app.whenReady().then(() => {
    // Open the main menu
    globals.mainMenu = new BrowserWindow({
        // To do - security stuff
        width: 800,
        height: 600,
        x: 25,
        y: 50,
        webPreferences: {
            preload: path.join(__dirname, "main_menu", "preload.js")
        }
    });

    globals.mainMenu.loadFile(path.join(__dirname, "main_menu", "index.html"));

    // Handler for the module selector window
    globals.mainMenu.webContents.setWindowOpenHandler(() => {
        // To do - security stuff
        return {
            action: "allow",
            overrideBrowserWindowOptions: {
                width: 400,
                height: 500,

                frame: true,
                resizable: true,
                
                modal: true,
                parent: globals.mainMenu,

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


// Functions for reading file system contents
const fileSystem = {
    async getAvailableModules() {
        var dirPath = path.join(__dirname, "modules");
        var moduleList = [];

        // Open the modules directory
        try {
            var modulesDir = await fs.opendir(dirPath);
        } catch {
            // If it doesn't exist, create it and return empty list
            fs.mkdir(dirPath);
            return moduleList;
        } 

        // Iterate over entries
        for await (const moduleDirent of modulesDir) {

            // Check if entry is a directory, if not, throw error
            if (moduleDirent.isDirectory()) {
                let moduleName = moduleDirent.name;
                
                // Check and generate list of extension names
                let extensions = [];
                let hasExtensions = true;

                // Open the extensions dir
                try {
                    var extensionsDir = await fs.opendir(path.join(dirPath, moduleName, "extensions"));
                }
                catch {
                    // If there is no extension folder, skip next part
                    hasExtensions = false;
                }

                if (hasExtensions) {
                    // Cycle through the extensions
                    for await (const extensionDirent of extensionsDir) {
                        extensionName = extensionDirent.name;

                        // Check if entry is a .js file, else throw error
                        if (extensionDirent.isFile() && (path.extname(extensionName) == ".js")) {
                            // Add name of extension to list
                            extensions.push(path.basename(extensionName, ".js"));
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
    },

    async getExistingGames() {
        var dirPath = path.join(__dirname, "games");
        var gameList = [];

        // Open the games directory
        try {
            var gamesDir = await fs.opendir(dirPath);
        } catch {
            // If it doesn't exist, create it and return empty list
            fs.mkdir(dirPath);
            return gameList;
        } 

        // Iterate over entries
        for await (const gameDirent of gamesDir) {
            // If entry is not a directory, throw error
            if (gameDirent.isDirectory()) {
                gameList.push(gameDirent.name);
            }
            else {
                throw new Error("The folder 'games' should contain only folders.");
            }
        }
        
        return gameList;
    },

    async getAvailableProfilePictures() {
        var dirPath = path.join(__dirname, "profile_pics");
        let profilePictureList = [];

        // Open the profile picture directory
        try {
            var pfpDir = await fs.opendir(dirPath);
        } catch {
            // If it doesn't exist, create it and return empty pfp list
            fs.mkdir(dirPath);
            return profilePictureList;
        }

        // Iterate over entries
        for await (const pfpDirent of pfpDir) {
            // Check if entry is a directory, if not, throw error
            if (pfpDirent.isFile()) {
                profilePictureList.push(pfpDirent.name);
            }
            else {
                // To do - potentially check for .png / .jpeg etc.
                throw new Error("The folder 'profile_pics' should contain only files.");
            }
        }

        return profilePictureList;
    },

    async getAvailableAssets() {
        if (!globals.gameName) throw new Error("Tried to run a function dependent on the game name while no game was selected.");
        
        var assetList = [];
        var rootPath = path.join(__dirname, "games", globals.gameName, "assets");

        // Try opening the profile picture directory
        try {
            let dir = await fs.opendir(rootPath);
            dir.close();
        } catch {
            // If it doesn't exist, create it and return empty pfp list
            fs.mkdir(rootPath);
            return assetList;
        }

        // Function to scan a directory
        async function scanDir(relativePath) {
            // The folder will always exist because the function will be run only if assetDir has this folder as a dirent
            var assetDir = await fs.opendir(path.join(rootPath, relativePath));

            // Scroll through the folder
            for await (const assetDirent of assetDir) {
                if (assetDirent.isFile()) {
                    // If dirent is a file, add the relative file path to imageList
                    assetList.push(path.join(relativePath, assetDirent.name));
                }
                else if (assetDirent.isDirectory()) {
                    // If dirent is a folder, scan it using recursion
                    await scanDir(path.join(relativePath, assetDirent.name));
                }
                else {
                    throw new Error("The folder 'assets' should contain only folders and files.");
                }
            }
        }
        
        await scanDir("");

        return assetList;
    },

    async addProfilePicture(playerName, data) {
        let pfpPath = path.join(__dirname, "profile_pics", playerName + ".png");

        try {
            // Try writing the file
            await fs.writeFile(pfpPath, data);
        } catch {
            // If the profile_pics dir doesn't exist, create it and write again
            await fs.mkdir(path.join(__dirname, "profile_pics"));
            await fs.writeFile(pfpPath, data);
        }
    },

    async addAsset(localPath, data) {
        if (!globals.gameName) throw new Error("Tried to run a function dependent on the game name while no game was selected.");

        var assetPath = path.join(__dirname, "games", globals.gameName, "assets", localPath);
        
        try {
            // Try to make the file
            await fs.writeFile(assetPath, data);
        }
        catch {
            // If it fails, create the dir and try again
            await fs.mkdir(path.dirname(assetPath), {recursive: true});
            await fs.writeFile(assetPath, data);
        }
    },

    async removeAsset(localPath) {
        if (!window.gameName) throw new Error("Tried to run a function dependent on the game name while no game was selected.");

        let assetPath = path.join(__dirname, "games", window.gameName, "assets", localPath);
        
        // Returns the path to be deleted
        async function checkParentFolder(filePath) {
            let parentPath = path.dirname(filePath);

            if (path.basename(parentPath) == "assets") {
                // Safety recursion stop (to not delete the assets folder or anything above)
                return filePath;
            }
            
            try {
                var fileAmount = (await fs.readdir(parentPath)).length;
            }
            catch {
                // If the parent folder can't be read, stop checking
                return filePath;
            }
            
            // If the file amount in the parent folder is 1, it means it contains no files or folders except for the one being deleted
            if (fileAmount <= 1) {
                // Check the parent folder of the checked folder
                return await checkParentFolder(parentPath);
            }
            
            // If the folder isn't empty, return the original path
            return filePath;
        }
        
        fs.rm(await checkParentFolder(assetPath), {recursive: true});
    },

    async getWindowLayout() {
        if (!globals.gameName) throw new Error("Tried to run a function dependent on the game name while no game was selected.")

        let filePath = path.join(__dirname, "games", globals.gameName, "window_layout.json");

        try {
            let rawData = await fs.readFile(filePath, {encoding: "utf-8"});
            return JSON.parse(rawData);
        }
        catch {
            // Return an empty object if the file doesn't exist
            return {};
        }
        
    },

    async saveWindowLayout() {
        if (!globals.gameName) throw new Error("Tried to run a function dependent on the game name while no game was selected.");

        let filePath = path.join(__dirname, "games", globals.gameName, "window_layout.json");

        await fs.writeFile(filePath, JSON.stringify(globals.windowLayout, null, 4), {encoding: "utf8"});
    }
}

// Main menu handlers
ipcMain.handle("getGameList", async () => await fileSystem.getExistingGames());
ipcMain.handle("getModuleList", async () => await fileSystem.getAvailableModules());
ipcMain.handle("getSelectedModules", (ev, gameName) => games[gameName]);
ipcMain.handle("setSelectedModules", (ev, gameName, moduleList) => games[gameName] = moduleList);

var active_windows = {};
ipcMain.handle("loadGame", async (ev, gameName) => {
    // Set variables
    globals.gameName = gameName;

    // Get the list of modules to load
    let modList = games[gameName];
    
    // Obtain the window layout (first try getting the local one, if it doesn't exist, get it from server)
    globals.windowLayout = await fileSystem.getWindowLayout();
    if ((Object.keys(globals.windowLayout)).length == 0) {
        // coming soon :tm:
        
        // for now, use a mockup for this case
        console.log("Getting layout from server");
        globals.windowLayout = {
            tokenium: {
                height: 0.6,
                width: 0.5,
                x: 0.375,
                y: 0
            },
            comms_test_receiver_1: {
                height: 0.2,
                width: 0.125,
                x: 0.875,
                y: 0
            },
            chat: {
                height: 0.8,
                width: 0.125,
                x: 0.875,
                y: 0.2
            }
        }
    }
    
    // Get the main display width and height
    const workAreaSize = screen.getPrimaryDisplay().workAreaSize;

    // For every module needed to be loaded
    for (i of modList) {
        // Get the module window information
        let windowInfo = globals.windowLayout[i.name];

        // If the window info exists, convert relative screen value to pixels
        if (windowInfo) {
            var width = Math.round(windowInfo.width * workAreaSize.width);
            var height = Math.round(windowInfo.height * workAreaSize.height);
            var x = Math.round(windowInfo.x * workAreaSize.width);
            var y = Math.round(windowInfo.y * workAreaSize.height);
        }
        else {      // If the window info doesn't exist, use default values
            var width = 800
            var height = 600
            var x = 50
            var y = 50
        }

        // Create the module window
        let moduleWindow = new BrowserWindow({
            // to do - security stuff
            width: width,
            height: height,
            x: x,
            y: y,
            webPreferences: {
                preload: path.join(__dirname, "preload.js")
            }
        });

        // Assign the html file
        moduleWindow.loadFile(path.join(__dirname, "modules", i.name, "index.html"));

        // Add extensions
        for (j of i.extensions) {
            moduleWindow.webContents.executeJavaScript("window.s = document.createElement('script'); window.s.src = 'extensions\\" + path.sep + j + ".js'; document.body.appendChild(window.s); delete window.s;");
        }

        // Add the window to the window list
        active_windows[i.name] = moduleWindow;
    }
    
    // Close main menu
    globals.mainMenu.close();
}); 

// Communication system handler
ipcMain.handle("callFunction", (ev, moduleName, functionName, ...args) => {
    // empty module name => broadcast
    if (moduleName == "") {
        for (i in active_windows) {
            try {
                active_windows[i].webContents.send("API-" + functionName, args);
            }
            catch {
                throw new Error("Module's window was closed.");
                // I can probably ignore this error. If window was closed, do nothing. Perhaps I can remove the destroyed object from active_windows
            }
        }
    }
    else {
        try {
            active_windows[moduleName].webContents.send("API-" + functionName, args);
        }
        catch {
            throw new Error("Module is not loaded or it's window was closed.");

            // Ig I can just ignore this error, if the module is not loaded or it's window was closed, simply do nothing
        }
    }
});