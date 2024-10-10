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

    async getAvailableAssets(gameName) {
        var assetList = [];
        var rootPath = path.join(__dirname, "games", gameName, "assets");

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
        let pfpPath = path.join(__dirname, "profile_pics", playerName + ".png")

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
        var assetPath = path.join(__dirname, "games", "desert", "assets", localPath);
        
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
        let assetPath = path.join(__dirname, "games", "desert", "assets", localPath);
        
        // Returns the path to be deleted
        async function checkParentFolder(filePath) {
            let parentPath = path.dirname(filePath);

            //if (path.fi)
            
            try {
                var fileAmount = await fs.readdir(parentPath).lenght;
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
        
        try {
            fs.rm(await checkParentFolder(assetPath), {recursive: true});
        }
        catch {
            console.log("Failure")
        }
    }

}

async function bob() {
    await fileSystem.addAsset("knedle/test/test.txt", "kk");
    await fileSystem.removeAsset("knedle/test/test.txt");
}

bob();

// Main menu handlers
ipcMain.handle("getGameList", async () => await fileSystem.getExistingGames());
ipcMain.handle("getModuleList", async () => await fileSystem.getAvailableModules());
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