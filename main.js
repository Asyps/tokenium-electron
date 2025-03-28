// Debug
const isDebugMode = process.argv.includes('--d');

process.traceProcessWarnings = isDebugMode;

// Remove the menu in all windows
if (!isDebugMode) Menu.setApplicationMenu(null);

// Imports commonjs
/*
const { app, BrowserWindow, ipcMain, screen } = require('electron');
const fs = require("fs/promises");
const path = require("path");
*/

// Imports

import { app, BrowserWindow, ipcMain, screen, Menu } from 'electron';
import fs from "fs/promises";
import path from "path";


// fireglue import test
import * as binary from "./fireglue/binary.mjs"
import * as errors from "./fireglue/errors.mjs"
import * as kvstore from "./fireglue/kvstore.mjs"
import * as socket from "./fireglue/socket.mjs"
import * as utils from "./fireglue/utils.mjs"
import { access } from 'fs';

async function fireglueTest() {
    let ctx = new socket.SocketCtx();
    ctx.addEventListener("message", (ev) => {
        console.log("message", ev.identifier, new Uint8Array(ev.payload));
    });
    ctx.addEventListener("userjoin", (ev) => {
        console.log("join", ev.player.nickname, ev.player.token.bigint);
    });
    ctx.addEventListener("userleave", (ev) => {
        console.log("leave", ev.token.bigint);
    });
    ctx.addEventListener("userupdate", (ev) => {
        console.log("user update", ev.user);
    });
    ctx.addEventListener("blockupdate", (ev) => {
        console.log("block update", ev.block);
    });
    console.log("Connecting to server...")
    //await ctx.connect("localhost:8989", 'user-' + String(Math.trunc(Math.random() * 1000)), '', true);
    //console.log("Connected as", ctx.__user._nickname, ctx.__user._admin ? "admin" : "user", "access", Array.from(ctx.__user._blockAccess))
}
fireglueTest();


// Close the application when all windows are closed
app.on("window-all-closed", () => {
    // If a game is chosen, save the window layout
    if (globals.gameName) {
        fileSystem.saveWindowLayout();
        fileSystem.saveGameData();
    }
    fileSystem.saveClientData();
    app.quit();
});

// Mockup, will later get the info from server/files/whatever
let requiredModuleList = {
    tokenium_test: {
        "tokenium": []
    },
    chat_test: {
        "chat": []
    },
    full_test: {
        "chat": ["in_world_chat", "commands"],
        "tokenium": ["rulers"]
    },
    desert: {
        "tokenium": [],
        "chat": ["commands"],
        "calculator": []
    },
    chess: {},
};

// A place to put the main process global variables
const globals = {
    // Current working difrectory
    CWD: path.resolve(),

    // Dictionary with all the game data
    gameData: {},

    // For this dictionary, each key:value pair encodes          str moduleName : str[] extensionNameList
    availableModules: {},           // List of modules and extensions available
    
    // Array of moduleNames that finished loading
    loadedModules: [],              

    // A dictionary of all active window objects. Each key:value pair encodes        str moduleName : BrowserWindow browserWindow
    activeWindows: {},

    // A list of function names with reply values
    functionsWithReplyValue: []
};

// Functions for reading/modifying file system contents
const fileSystem = {
    // Goes through the files and builds a list of all available modules, which is put into globals.availableModules
    async getAvailableModules() {
        var dirPath = path.join(globals.CWD, "modules");

        // Open the modules directory
        try {
            var modulesDir = await fs.opendir(dirPath);
        } catch {
            // If it doesn't exist, create it and abort the function
            fs.mkdir(dirPath);
            return;
        } 

        var moduleList = {};

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
                    // If the module has extensions, cycle through them
                    for await (const extensionDirent of extensionsDir) {
                        let extensionName = extensionDirent.name;

                        // Check if entry is a .js file, else throw error
                        if (extensionDirent.isFile() && (path.extname(extensionName) == ".js")) {
                            // Add name of extension to list
                            extensions.push(path.basename(extensionName, ".js"));
                        }
                        else {
                            throw new Error("The folder 'extensions' of the module '" + moduleName + "' should contain only .js files.");
                        }
                    }
                }
                
                // Add the module to the globals
                moduleList[moduleName] = extensions;

            }
            else {
                throw new Error("The folder 'modules' should contain only folders.");
            }
        }

        return moduleList;
    },

    // Goes through the files and builds a list of existing games, which is returned
    async getExistingGames() {
        var dirPath = path.join(globals.CWD, "games");
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

    // Goes through the files and builds a list of available profile pictures, which is returned
    async getAvailableProfilePictures() {
        var dirPath = path.join(globals.CWD, "profile_pics");
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

    // Goes through the asset folder of the currently selected game and builds a list of available assets, which is returned
    async getAvailableAssets() {
        if (!globals.gameName) throw new Error("Tried to run a function dependent on the game name while no game was selected.");
        
        var assetList = [];
        var rootPath = path.join(globals.CWD, "games", globals.gameName, "assets");

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

    // Adds a profile picture to the profile_pics folder
    async addProfilePicture(playerName, data) {
        let pfpPath = path.join(globals.CWD, "profile_pics", playerName + ".png");

        try {
            // Try writing the file
            await fs.writeFile(pfpPath, data);
        } catch {
            // If the profile_pics dir doesn't exist, create it and write again
            await fs.mkdir(path.join(globals.CWD, "profile_pics"));
            await fs.writeFile(pfpPath, data);
        }
    },

    // Adds an asset to the specified local path within the selected game's asset folder
    async addAsset(localPath, data) {
        if (!globals.gameName) throw new Error("Tried to run a function dependent on the game name while no game was selected.");

        var assetPath = path.join(globals.CWD, "games", globals.gameName, "assets", localPath);
        
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

    // Removes an asset from the specified local path within the selected game's asset folder
    async removeAsset(localPath) {
        if (!window.gameName) throw new Error("Tried to run a function dependent on the game name while no game was selected.");

        let assetPath = path.join(globals.CWD, "games", window.gameName, "assets", localPath);
        
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

    // Reads the window_layout.json file of the selected game and returns the window layout specified within
    async getWindowLayout() {
        if (!globals.gameName) throw new Error("Tried to run a function dependent on the game name while no game was selected.");

        let filePath = path.join(globals.CWD, "games", globals.gameName, "window_layout.json");

        try {
            // Read, parse and return the data
            let rawData = await fs.readFile(filePath, {encoding: "utf-8"});
            return JSON.parse(rawData);
        }
        catch {
            // Return an empty object if the file doesn't exist
            return {};
        }
        
    },

    // Writes the current window layout from globals into the window_layout.json file of the selected game
    async saveWindowLayout() {
        if (!globals.gameName) throw new Error("Tried to run a function dependent on the game name while no game was selected.");

        let filePath = path.join(globals.CWD, "games", globals.gameName, "window_layout.json");

        try {
            await fs.writeFile(filePath, JSON.stringify(globals.windowLayout, null, 4), {encoding: "utf8"});
        } catch {
            // If the layout saving fails, it's because there is no layout to be saved. Ignore.
        }
    },

    // Reads client-wide login data
    async readClientData() {
        let filePath = path.join(globals.CWD, "client_data", "client_data.json");

        try {
            // Read, parse and return the data
            let rawData = await fs.readFile(filePath, {encoding: "utf-8"});
            return JSON.parse(rawData);
        }
        catch {
            // Return an empty object if the file doesn't exist
            return {};
        }
    },

    // Saves client-wide login data
    async saveClientData() {
        let filePath = path.join(globals.CWD, "client_data", "client_data.json");

        try {
            await fs.writeFile(filePath, JSON.stringify(globals.clientData, null, 4), {encoding: "utf8"});
        } catch {
            // If the data write fails, it's because there is no layout to be saved. Ignore.
        }
    },

    // Reads data about the currently chosen game
    async readGameData() {
        if (!globals.gameName) throw new Error("Tried to run a function dependent on the game name while no game was selected.");

        let filePath = path.join(globals.CWD, "games", globals.gameName, "game_data.json");

        try {
            // Read, parse and return the data
            let rawData = await fs.readFile(filePath, {encoding: "utf-8"});
            return JSON.parse(rawData);
        }
        catch {
            // Return an empty object if the file doesn't exist
            return {};
        }
    },

    // Saves data about the currently chosen game
    async saveGameData() {
        if (!globals.gameName) throw new Error("Tried to run a function dependent on the game name while no game was selected.");

        let filePath = path.join(globals.CWD, "games", globals.gameName, "game_data.json");

        try {
            await fs.writeFile(filePath, JSON.stringify(globals.gameData, null, 4), {encoding: "utf8"});
        } catch {
            // If the data write fails, it's because there is no data to be saved. Ignore.
        }
    },
}


// Menu handlers
ipcMain.handle("getGameList", async () => await fileSystem.getExistingGames());
ipcMain.handle("getAvailableModules", async () => fileSystem.getAvailableModules());
ipcMain.handle("setGameData", (_, gameData) => globals.gameData.header = gameData);

ipcMain.handle("obtainGameName", () => globals.gameData.header.gameName);
ipcMain.handle("obtainGameColor", () => globals.gameData.header.color);

// Functions for opening menus
function openMainMenu() {
    // Close previous menu and submenu
    try { globals.currentMenu.close(); } catch {}
    try { globals.currentSubMenu.close(); } catch {}

    // Open the main menu
    globals.currentMenu = new BrowserWindow({
        // To do - security stuff
        width: 800,
        height: 650,
        x: 25,
        y: 50,
        webPreferences: {
            preload: path.join(globals.CWD, "menus", "preload.js")
        }
    });

    // Load the .html
    globals.currentMenu.loadFile(path.join(globals.CWD, "menus", "main_menu", "index.html"));
    
    /*
    // Handler for the module selector window
    globals.currentMenu.webContents.setWindowOpenHandler(() => {
        // To do - security stuff
        return {
            action: "allow",
            overrideBrowserWindowOptions: {
                width: 400,
                height: 500,

                // Will be edited once new main menu gets integrated
                frame: true,
                resizable: true,
                
                modal: true,
                parent: globals.mainMenu,

                webPreferences: {
                    preload: path.join(globals.CWD, "module_selector", "preload.js")
                }
            }
        }
    });
    */
}

function openPlayerSettingsMenu() {
    // Close previous menu and submenu
    try { globals.currentMenu.close(); } catch {}
    try { globals.currentSubMenu.close(); } catch {}

    // Prepare data for the window
    ipcMain.handleOnce("getData", () => globals.gameData.header);

    // Open the player settings menu
    globals.currentMenu = new BrowserWindow({
        // To do - security stuff
        width: 850,
        height: 650,
        x: 25,
        y: 50,
        webPreferences: {
            preload: path.join(globals.CWD, "menus", "preload.js")
        }
    });

    // Load the .html
    globals.currentMenu.loadFile(path.join(globals.CWD, "menus", "player_settings", "index.html"));
}

function openOwnerSettingsMenu() {
    // Close previous menu and submenu
    try { globals.currentMenu.close(); } catch {}
    try { globals.currentSubMenu.close(); } catch {}

    // Prepare data for the window
    ipcMain.handleOnce("getData", () => globals.gameData.header);

    // Close main menu
    globals.currentMenu.close();

    // Open the owner settings menu
    globals.currentMenu = new BrowserWindow({
        // To do - security stuff
        width: 1000,
        height: 850,
        x: 25,
        y: 50,
        webPreferences: {
            preload: path.join(globals.CWD, "menus", "preload.js")
        }
    });

    // Load the .html
    globals.currentMenu.loadFile(path.join(globals.CWD, "menus", "owner_settings", "index.html"));
}

function openRequiredSelectorSubMenu() {
    // Don't close previous menu; do close previous submenu
    try { globals.currentSubMenu.close(); } catch {}

    // Prepare data for the window
    ipcMain.handleOnce("getRequiredModules", () => {return {}});
    ipcMain.handleOnce("getSelectedModules", () => globals.gameData.requiredModules);

    // Prepare handler for the returned data
    ipcMain.handleOnce("returnModuleList", (_, moduleData) => {globals.gameData.requiredModules = moduleData});

    // Open the player settings menu
    globals.currentSubMenu = new BrowserWindow({
        // To do - security stuff
        width: 400,
        height: 500,
        x: 25,
        y: 50,

        //modal: true,
        //parent: globals.currentMenu,

        webPreferences: {
            preload: path.join(globals.CWD, "menus", "module_selector", "preload.js")
        }
    });

    // Assign a cleanup handler to remove the handler for the returned data in case it's not used.
    globals.currentSubMenu.on("close", () => {
        ipcMain.removeHandler("returnModuleList");
    });

    // Load the .html
    globals.currentSubMenu.loadFile(path.join(globals.CWD, "menus", "module_selector", "index.html"));
}

function openModuleSelectorSubMenu() {
    // Don't close previous menu; do close previous submenu
    try { globals.currentSubMenu.close(); } catch {}

    // Prepare data for the window
    ipcMain.handleOnce("getRequiredModules", () => globals.gameData.requiredModules);
    ipcMain.handleOnce("getSelectedModules", () => globals.gameData.selectedModules);

    // Prepare handler for the returned data
    ipcMain.handleOnce("returnModuleList", (_, moduleData) => {globals.gameData.selectedModules = moduleData});

    // Open the player settings menu
    globals.currentSubMenu = new BrowserWindow({
        // To do - security stuff
        width: 400,
        height: 500,
        x: 25,
        y: 50,

        //modal: true,
        //parent: globals.currentMenu,

        webPreferences: {
            preload: path.join(globals.CWD, "menus", "module_selector", "preload.js")
        }
    });

    // Assign a cleanup handler to remove the handler for the returned data in case it's not used.
    globals.currentSubMenu.on("close", () => {
        ipcMain.removeHandler("returnModuleList");
    });

    // Load the .html
    globals.currentSubMenu.loadFile(path.join(globals.CWD, "menus", "module_selector", "index.html"));
}

// Function that loads all modules along with extensions
async function loadGame() {
    // Get the main display width and height
    globals.workAreaSize = screen.getPrimaryDisplay().workAreaSize;
    
    // Obtain the window layout
    // First try getting the local layout from the window_layout.json file
    globals.windowLayout = await fileSystem.getWindowLayout();

    // If the dict is empty (= file doesn't exist or it doesn't specify anything), get the default layout from server
    if ((Object.keys(globals.windowLayout)).length == 0) {
        // coming soon :tm:
        
        // for now, use a mockup for this case
        console.log("Getting layout from server");
        globals.windowLayout = {
            "tokenium": {
                "x": 0.283203125,
                "y": 0,
                "width": 0.5006510416666666,
                "height": 0.6299019607843137
            },
            "chat": {
                "x": 0.7838541666666666,
                "y": 0.18627450980392157,
                "width": 0.21614583333333334,
                "height": 0.8137254901960784
            },
            "button_panel": {
                "x": 0.7838541666666666,
                "y": 0,
                "width": 0.21614583333333334,
                "height": 0.1875
            }
        }
    }
    
    // A function that loads a script
    function loadScript(moduleWindow, moduleName, scriptName, isPostload=false) {
        // Create a promise that resolves once the script has finished loading
        return new Promise((resolve, reject) => {
            // Create a handler for the message about the script loading or failing
            ipcMain.handleOnce("LOAD-SCRIPT-" + moduleName + ":" + scriptName, (_, didScriptLoad) => {
                if (didScriptLoad) resolve();
                reject("Script failed to load: " + scriptName);
            });

            // Execute the code to add the script
            if (isPostload) {    
                // If the script is a postload, the path to the script doesn't include the extensions folder.
                moduleWindow.webContents.executeJavaScript("window.s = document.createElement('script'); window.s.src = '" + scriptName + ".js'; window.s.onload = () => window.announceScriptLoad('" + moduleName + "', '" + scriptName + "', true); window.s.onerror = () => window.announceScriptLoad('" + moduleName + "', '" + scriptName + "', false); document.body.appendChild(window.s); delete window.s;");
                    /*
                    window.s = document.createElement('script');
                    window.s.src = '" + scriptName + ".js';
                    window.s.onload = () => window.announceScriptLoad('" + moduleName + "', '" + scriptName + "', true);
                    window.s.onerror = () => window.announceScriptLoad('" + moduleName + "', '" + scriptName + "', false);
                    document.body.appendChild(window.s);
                    delete window.s;         
                    */
            }
            else {
                moduleWindow.webContents.executeJavaScript("window.s = document.createElement('script'); window.s.src = 'extensions\\" + path.sep + scriptName + ".js'; window.s.onload = () => window.announceScriptLoad('" + moduleName + "', '" + scriptName + "', true); window.s.onerror = () => window.announceScriptLoad('" + moduleName + "', '" + scriptName + "', false); document.body.appendChild(window.s); delete window.s;");
                    /*
                    window.s = document.createElement('script');
                    window.s.src = 'extensions" + path.sep + scriptName + ".js';
                    window.s.onload = () => window.announceScriptLoad('" + moduleName + "', '" + scriptName + "', true);
                    window.s.onerror = () => window.announceScriptLoad('" + moduleName + "', '" + scriptName + "', false);
                    document.body.appendChild(window.s);
                    delete window.s;         
                    */
            }
        });
    }

    // Module name distribution system
    let moduleNameFIFO = [];
    // Create an event handler for a request to obtain the module name - will immediately be triggered by the preload script
    // Modules will call this event in the order they are declared
    ipcMain.handle("obtainName", () => moduleNameFIFO.shift());

    // Keeping track of displayed windows
    var windowCount = 0;

    // For every module needed to be loaded...
    for (let moduleName of Object.keys(globals.gameData.selectedModules).concat(["button_panel"])) {
        // Get the module window information
        let windowInfo = globals.windowLayout[moduleName];   // The keys of globals.selectedModules represent module names

        // If the info about the window exists, convert relative screen value to px
        if (windowInfo) {
            var width = Math.round(windowInfo.width * globals.workAreaSize.width);
            var height = Math.round(windowInfo.height * globals.workAreaSize.height);
            var x = Math.round(windowInfo.x * globals.workAreaSize.width);
            var y = Math.round(windowInfo.y * globals.workAreaSize.height);
        }
        else {      // If the info about the window doesn't exist, use default values in px
            var width = 800;
            var height = 600;
            var x = 50 + 60 * windowCount;
            var y = 50 + 60 * windowCount;
            windowCount++;
        }

        // Put the module name in moduleNameFIFO
        moduleNameFIFO.push(moduleName);

        // Create the module window
        let moduleWindow = new BrowserWindow({
            // to do - security stuff
            width: width,
            height: height,
            x: x,
            y: y,
            frame: isDebugMode,
            resizable: isDebugMode,
            movable: isDebugMode,
            webPreferences: {
                preload: path.join(globals.CWD, (moduleName == "button_panel") ? "button_panel" : ".", "preload.js"),
            }
        });
        
        // Put the browser window into the active list
        globals.activeWindows[moduleName] = moduleWindow;

        // Assign the html file
        moduleWindow.loadFile(path.join(globals.CWD, (moduleName == "button_panel") ? "." : "modules", moduleName, "index.html"));

        // Create the event handler for loading the extensions and postprocess script
        moduleWindow.webContents.once("did-finish-load", () => {
            // Once the main module has finished loading...

            // Run the extension adding functions and collect the promises in extensionLoadPromises
            let extensionLoadPromises = [];

            if (moduleName != "button_panel") {
                for (let extensionName of globals.gameData.selectedModules[moduleName]) {     // The values of globals.selectedModules are lists of extension names
                    extensionLoadPromises.push(loadScript(moduleWindow, moduleName, extensionName));    
                }
            }

            Promise.all(extensionLoadPromises)
            .then(
                // After all the extensions succesfully load, load the postload script and return the associated promise to the next .then
                () => loadScript(moduleWindow, moduleName, "postload", true),

                // If one of the extensions failed to load, pass the error forward
                (message) => new Promise((resolve, reject) => reject(message) )
            )
            .then(
                // After the postload script successfully loads, pass the success forward
                () => new Promise((resolve, reject) => resolve() ),

                // If one of the extensions or the preload script failed to load...
                (message) => {
                    // If one of the extensions failed to load, pass the error forward
                    if (message != "Script failed to load: postload") return new Promise((resolve, reject) => reject(message) );

                    // Otherwise it's the postload script which failed to load. In this case, return a success to the next .then()
                    return new Promise((resolve, reject) => resolve() );
                }
            )
            .then(
                // If the previous .then returns a success, declare the module as loaded
                () => {
                    // Add the module into the list of loaded modules
                    globals.loadedModules.push(moduleName);

                    // Broadcast the load event
                    for (let windowName in globals.activeWindows) {
                        try {
                            globals.activeWindows[windowName].webContents.send("LOAD-" + moduleName);
                        }
                        catch {
                            // If the event sending fails, the window was probably closed
                            // Remove the destroyed window object from the list of active windows
                            delete globals.activeWindows[windowName];

                            // Delete the module from loadedModules if it is there
                            let index = globals.loadedModules.indexOf(windowName);
                            if (index != -1) globals.loadedModules.splice(index, 1);
                        }
                    }
                }
                // If the previous promise fails, let it be thrown as an error
            );
        });
    }

    // Close previous menu
    globals.currentMenu.close();
}


// Handle main menu transfer
ipcMain.handle("menuTransfer", async (_, action, gameName) => {
    if (action == "launch" || typeof action == "number") {             //  action == "launch" || action == "settings"
        // If the game is being switched, save data, disconnect from the server, load new data, connect to new server...
        // If the argument gameName is undefined, ignore this
        if (globals.gameName != gameName && gameName != undefined) {
            // Only save data and disconnect when the previous game wasn't undefined
            if (globals.gameName != undefined) {
                // Save the data for the previous game
                await fileSystem.saveGameData();

                // Here, the code would disconnect from the server.
            }

            // Set the selected game into global variables
            globals.gameName = gameName;

            // Load game data
            globals.gameData = await fileSystem.readGameData();
            if (Object.keys(globals.gameData).length == 0) {
                globals.gameData.header = {};
                globals.gameData.selectedModules = {};
                globals.gameData.requiredModules = {};
            }

            /*
                Here, code would attempt to connect to the server if not already connected.
                            a) launch directly      b) open settings
                If the server connection is not successfull, display error message and    a) don't close main menu   b) open settings menu in offline mode.
                If the server connection is successful, then     a) launch the game    b) determine if the user is owner and open the apropriate menu
            */

            // Data from server would be compared with local data; name and color from server always replaces local data.
            // Alternative: If this client is owner of the game, local data replaces server data; don't disable name and color fields when server is offline.
        }

        // For now, open the menu determined by the button clicked for debugging reasons
        if (action == "launch") loadGame(); // == true prevents loading of the game when button number is provided; in finished product, code will pass "false" when opening settings menu.
        
        else if (action == 0) {     // Which menu should be opened will be determined by data from server.
            openPlayerSettingsMenu();
        } else {
            openOwnerSettingsMenu();
        }
    }
    // The other options won't connect to the server
    else if (action == "main menu") openMainMenu();
    else if (action == "select modules") openModuleSelectorSubMenu();
    else if (action == "required modules") openRequiredSelectorSubMenu();
    
});

// Open the main menu at app start
app.whenReady().then(openMainMenu);



// Communication system

// Handles requests to call API functions
ipcMain.handle("callFunction", async (_, moduleName, functionName, args, callerName) => {
    // Empty module name => broadcast   currently not utilised, may be removed
    if (moduleName == "") {
        for (let windowName in globals.activeWindows) {
            try {
                // Send the event to all windows, no reply is expected
                await globals.activeWindows[windowName].webContents.send("API-" + functionName, args, callerName);
                // Last argument will always be the name of module that called the function
            }
            catch {
                // If the event sending fails, the window was probably closed
                // Remove the destroyed window object from the list of active windows
                delete globals.activeWindows[windowName];

                // Delete the module from loadedModules if it is there
                let index = globals.loadedModules.indexOf(windowName);
                if (index != -1) globals.loadedModules.splice(index, 1);
            }
            
        }
    }
    else {
        // If the module isn't supposed to be loaded, ignore the call
        if (globals.gameData.selectedModules.hasOwnProperty(moduleName) || moduleName == "button_panel") {
            try {
                if (globals.functionsWithReplyValue.includes(moduleName + "-" + functionName)) {
                    // If the function has a return value...
                    // Create a promise for the reply, inside the promise, set the reply handler
                    let reply = new Promise((resolve, reject) => {
                        ipcMain.handleOnce("API-reply-" + moduleName + "-" + functionName, (ev, reply) => {
                            resolve(reply);
                        });
                    });
                    
                    // Call the function
                    globals.activeWindows[moduleName].webContents.send("API-" + functionName, args, callerName);
                    // Last argument will always be the name of module that called the function
                    
                    // Wait for the reply and return it
                    return await reply;
                } else {
                    // If it doesn't have a return value, simply call it
                    globals.activeWindows[moduleName].webContents.send("API-" + functionName, args, callerName);
                    // Last argument will always be the name of module that called the function
                }
            }
            catch {
                // If the event sending fails, the window was probably closed
                // Remove the destroyed window object from the list of active windows
                delete globals.activeWindows[moduleName];

                // Delete the module from loadedModules if it is there
                let index = globals.loadedModules.indexOf(moduleName);
                if (index != -1) globals.loadedModules.splice(index, 1);

                // Remove the reply handler
                ipcMain.removeHandler("API-reply-" + moduleName + "-" + functionName);
            }
        }
    }
});

// Handler requests to register a function with a return value
ipcMain.handle("registerFunctionWithReplyValue", (_, moduleName, functionName) => globals.functionsWithReplyValue.push(moduleName + "-" + functionName) );

// Handles questions about loaded modules or extensions
ipcMain.handle("moduleLoadEnquiry", (_, moduleName, extensionName) => {
    // This function returns two boolean values in the format [shouldSpecifiedThingBeLoaded, isModuleLoaded]

    // Check if the module should be loaded
    let shouldModuleBeLoaded = globals.gameData.selectedModules.hasOwnProperty(moduleName) || moduleName == "button_panel";
    if (!shouldModuleBeLoaded) return [false, false];       // If it shouldn't be loaded, the awnsers are known
    
    // If the extension is not specified, return the awnser for the module, otherwise return the awnser for an extension
    if (extensionName == undefined) return [shouldModuleBeLoaded, globals.loadedModules.includes(moduleName)];
    return [globals.gameData.selectedModules[moduleName].includes(extensionName), globals.loadedModules.includes(moduleName)];
});


// Button panel API

// Layout mode
ipcMain.handle("setLayoutMode", (_, enabled) => {
    for (let i in globals.activeWindows) {
        try {
            // When the mode gets disabled, force a resize event fire and save the layout
            if (!enabled) {
                // Save the bounds
                globals.windowLayout[i] = globals.activeWindows[i].getBounds();

                // Force a resize event
                globals.activeWindows[i].setBounds(globals.windowLayout[i]);

                // Convert the bound units from px to relative size
                globals.windowLayout[i].width /= globals.workAreaSize.width;
                globals.windowLayout[i].height /= globals.workAreaSize.height;
                globals.windowLayout[i].x /= globals.workAreaSize.width;
                globals.windowLayout[i].y /= globals.workAreaSize.height;
            }

            // Set all windows to be (un)movable, (un)resizable, and tell them to enable/disable their input area.
            globals.activeWindows[i].setMovable(enabled);
            globals.activeWindows[i].setResizable(enabled);
            globals.activeWindows[i].webContents.send("setDragAreaMode", enabled);
        }
        catch {
            // If the window mode change fails, the window was probably closed
            // Remove the destroyed window object from the list of active windows
            delete globals.activeWindows[i];

            // Delete the module from loadedModules if it is there
            let index = globals.loadedModules.indexOf(i);
            if (index != -1) globals.loadedModules.splice(index, 1);
        }
    }
});

// API to quit the app
ipcMain.handle("shutdownGame", (_, restart=false) => {
    // Save data
    if (globals.gameName) {
        fileSystem.saveWindowLayout();
        fileSystem.saveGameData();
    }
    fileSystem.saveClientData();

    if (restart) app.relaunch();
    app.quit();
});
