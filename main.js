const { app, BrowserWindow, ipcMain, MessageChannelMain } = require('electron');
const fs = require("fs/promises")
const path = require("path")

app.on("window-all-closed", () => {
    if (process.platform != "darwin") app.quit();
});

class moduleInfo {
    constructor(name, extentions) {
        this.name = name;
        this.extentions = extentions;
    }
}

async function createModuleList() {
    var moduleList = [];

    // open the modules directory
    try {
        var modulesDir = await fs.opendir(path.join(__dirname, "modules"));
    } catch {
        fs.mkdir(path.join(__dirname, "modules"));
        return moduleList;
    } 

    // iterate over entries
    for await (const moduleDirent of modulesDir) {

        // check if entry is a directory, if not, throw error
        if (moduleDirent.isDirectory()) {
            let moduleName = moduleDirent.name;
            
            // check and generate list of extention names
            let extensions = [];

            //open the extentions dir
            try {
                var extentionsDir = await fs.opendir(path.join(__dirname, "modules", moduleName, "extentions"));

                // cycle through the extentions
                for await (const extentionDirent of extentionsDir) {
                    console.log("processing extention")
                    console.log(path.extname(extentionDirent.name))
                    // check if entry is a .js file, else throw error
                    if (extentionDirent.isFile() && (path.extname(extentionDirent.name) == ".js")) {
                        // add name of extension to list
                        extensions.push(extentionDirent.name);
                    }
                    else {
                        throw new Error("ERROR: The folder 'extentions' of the module '" + moduleName + "'should contain only .js files.")
                    }
                }
            }
            catch {

            }
            finally {
                moduleList.push(new moduleInfo(moduleName, extensions));
            }

        }
        else {
            throw new Error("ERROR: The folder 'modules' should contain only folders.");
        }
    }
    
    return moduleList;
}

createModuleList().then((value) => {
    console.log(value);
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
    
    const {port1, port2} = new MessageChannelMain();
    
    window1.webContents.postMessage("port", "", [port1]);
    window2.webContents.postMessage("port", "", [port2]);
});

/*
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
*/