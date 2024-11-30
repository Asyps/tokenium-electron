// Include the css for command output
let css = document.createElement("link");
css.rel = "stylesheet";
css.href = "other/commands.css";
// <link rel="stylesheet" href="other/commands.css">
document.head.appendChild(css);


// Functions to display command output components
playerChat.internal.displayLocalCommandOutput = (data) => {
    // Create the outer div
    let outerDiv = document.createElement("div");
    outerDiv.className = "command-result-container";

    // Create the inner div
    let innerDiv = document.createElement("div");
    innerDiv.className = "command-result local";
    innerDiv.textContent = data;

    // Assemble and display
    outerDiv.appendChild(innerDiv);
    playerChat.internal.messageArea.appendChild(outerDiv);
}
playerChat.internal.displayPublicCommandOutput = (data) => {
    // Create the outer div
    let outerDiv = document.createElement("div");
    outerDiv.className = "command-result-container";

    // Create the inner div
    let innerDiv = document.createElement("div");
    innerDiv.className = "command-result public";
    innerDiv.textContent = data;

    // Assemble and display
    outerDiv.appendChild(innerDiv);
    playerChat.internal.messageArea.appendChild(outerDiv);
}
playerChat.internal.displayErrorCommandOutput = (data) => {
    // Create the outer div
    let outerDiv = document.createElement("div");
    outerDiv.className = "command-result-container";

    // Create the inner div
    let innerDiv = document.createElement("div");
    innerDiv.className = "command-result error";
    innerDiv.textContent = data;

    // Assemble and display
    outerDiv.appendChild(innerDiv);
    playerChat.internal.messageArea.appendChild(outerDiv);
}

// Swap the addChatComponent function for one that supports these types
playerChat.internal.addChatComponent = (component) => {
    if (component.type == "system") {
        playerChat.internal.displaySystemMessage(component.data);
        chatDocumentMockup.lastMessageSender = "";      // Always insert a header after a system message
    }
    else if (component.type == "header") {
        playerChat.internal.displayUserHeader(component.data);
        chatDocumentMockup.lastMessageSender = component.data;
    }
    else if (component.type == "command local") {
        playerChat.internal.displayLocalCommandOutput(component.data);
        chatDocumentMockup.lastMessageSender = "";      // Always insert a header after a command output message
    }
    else if (component.type == "command public") {
        playerChat.internal.displayPublicCommandOutput(component.data);
        chatDocumentMockup.lastMessageSender = "";      // Always insert a header after a command output message
    }
    else if (component.type == "command error") {
        playerChat.internal.displayErrorCommandOutput(component.data);
        chatDocumentMockup.lastMessageSender = "";      // Always insert a header after a command output message
    }
    else {
        playerChat.internal.displayUserMessage(component.data);
    }
}

// Shortcut functions for command outputs
playerChat.commandLocal = (text) => {
    playerChat.internal.addChatComponent(new chatComponent("command local", text));
}
playerChat.commandPublic = (text) => {
    publicOut = new chatComponent("command public", text);
    playerChat.internal.addChatComponent(publicOut);
    chatDocumentMockup.push(publicOut);
}
playerChat.commandError = (text) => {
    playerChat.internal.addChatComponent(new chatComponent("command error", text));
}


// A class for command entries
class command {
    constructor(callback, syntaxInfo, description) {
        this.callback = callback;
        this.syntaxInfo = syntaxInfo;
        this.description = description;
    }
}

const commandDatabase = {
    help: new command(
        (flags, commandName) => {
            if (commandName == undefined) {
                playerChat.commandLocal("To get into command mode, press / when the text field is empty. The character / won't appear in the text area. To cancel command mode, press packspace when the input field is empty.");
                playerChat.commandLocal("The blue box is a local command output that other players won't see and that will not persist between sessions.");

                // Add the next line directly to chat to not synchronise it between players, because it serves as an example only
                playerChat.internal.addChatComponent(new chatComponent("command public", "The green box is a public command output that other players will see and that persists between sessions."));
                playerChat.commandError("The red box is a local command output that signifies an error.");
                
                // Generate the list of commands
                let commandListStr = "List of available commands: ";
                for (i in commandDatabase) {
                    commandListStr += i + "; ";
                }
                commandListStr = commandListStr.slice(0, -2);        // Remove the last "; " characters from the string

                playerChat.commandLocal(commandListStr);
            }
            else if (commandDatabase.hasOwnProperty(commandName)) {
                playerChat.commandLocal(commandDatabase[commandName].syntaxInfo);
                playerChat.commandLocal(commandDatabase[commandName].description);
            }
            else {
                playerChat.commandError("The specified command '" + commandName + "' does not exist.");
            }
        },
        "help [commandName]",
        "Shows the syntax and description of the specified command. If commandName is ommited, shows a manual to use the command system and list of all available commands instead.",
    ),
    moduleHelp: new command(
        (flags, moduleName, extensionName) => {
            if (moduleName == undefined) {
                // If moduleName isn't provided
                if (flags.includes("-l")) {
                    // If the -l flag is set, display list of modules
                    let moduleString = "Modules with available descriptions: ";
                    for (i in moduleDescriptionDatabase) {
                        moduleString += i + "; ";
                    }
                    moduleString = moduleString.slice(0, -2);        // Remove the last "; " characters from the string
                    
                    playerChat.commandLocal(moduleString);
                }
                else {
                    // Otherwise display syntax info
                    playerChat.commandLocal(commandDatabase.moduleHelp.syntaxInfo);
                }
            }
            else if (extensionName == undefined) {
                // If no extensionName is specified
                if (flags.includes("-l")) {
                    // If the -l flag is set, display list of extensions for this module
                    if (extensionDescriptionDatabase.hasOwnProperty(moduleName)) {
                        let extensionString = "Extensions for '" + moduleName + "' with available descriptions: ";
                        for (i in extensionDescriptionDatabase[moduleName]) {
                            extensionString += i + "; ";
                        }
                        extensionString = extensionString.slice(0, -2);        // Remove the last "; " characters from the string
                        
                        playerChat.commandLocal(extensionString);
                    }
                    else {
                        // If the module name isn't included in the description database for extensions, show error
                        playerChat.commandError("Module '" + moduleName + "' doesn't exist or it doesn't have any extensions that registered a description.");
                    }
                }
                else {
                    // Otherwise show the description of the module
                    if (moduleDescriptionDatabase.hasOwnProperty(moduleName)) {
                        // If the description is registered, show it
                        playerChat.commandLocal(moduleDescriptionDatabase[moduleName]);
                    }
                    else {
                        // If it isn't registered, show error
                        playerChat.commandError("Module '" + moduleName + "' doesn't exist or it didn't register a description.");
                    }
                }
            }
            else {
                // Show the description of the extension regardless of flags
                if (extensionDescriptionDatabase.hasOwnProperty(moduleName) && extensionDescriptionDatabase[moduleName].hasOwnProperty(extensionName)) {
                    // If the description is registered, show it
                    playerChat.commandLocal(extensionDescriptionDatabase[moduleName][extensionName]);
                }
                else {
                    // If it isn't, show error
                    playerChat.commandError("Extension '" + extensionName + "' for module '" + moduleName + "' doesn't exist or it didn't register a description.");
                }
            }
        },
        "moduleHelp [moduleName [extensionName]] [-l]",
        "Shows the description of the specified module. If extensionName is specified, the description of the extension is shown instead. If the -l flag is set, shows the list of modules (or extensions for the specified module) that have registered descriptions."
    ),
}




// Init
playerChat.internal.button = document.getElementById("playerSendButton");
playerChat.mode = "normal";
playerChat.lastCommandText = "";


// Swap the confirm function for one that supports command mode
playerChat.confirm = () => {
    if (playerChat.internal.textInput.value != "") {
        if (playerChat.mode == "normal") {
            // Add a user header unless the last message was sent by the local player
            if (chatDocumentMockup.lastMessageSender != localPlayerName) {
                let header = new chatComponent("header", localPlayerName);

                playerChat.internal.addChatComponent(header);
                chatDocumentMockup.chatMessages.push(header);
            }

            // Add the message
            let message = new chatComponent("message", playerChat.internal.textInput.value);

            playerChat.internal.addChatComponent(message);
            chatDocumentMockup.chatMessages.push(message);
        }
        else {
            // Dismantle the inputted string
            let commandArguments = playerChat.internal.textInput.value.split(" ");
            let commandName = commandArguments.shift();
            let flags = [];

            for (i in commandArguments) {
                // If any argument starts with -, put it into flags
                if (commandArguments[i][0] == "-") {
                    flags.push(commandArguments[i]);
                }
            }

            // Remove every flag from the argument list
            for (i of flags) {
                commandArguments.splice(commandArguments.indexOf(i), 1);
            }
            
            // If the command exists, execute it's callback
            if (commandDatabase.hasOwnProperty(commandName)) {
                commandDatabase[commandName].callback(flags=flags, ...commandArguments);
            }
            else {
                playerChat.commandError("This command does not exist. To see the list of available commands, enter the help command");
            }

            commandModeOff();
            playerChat.lastCommandText = playerChat.internal.textInput.value;
        }
        
        // Clear the text area
        playerChat.internal.textInput.value = "";
    }
}


// Turn command mode on or off
function commandModeOn() {
    playerChat.mode = "command";
    playerChat.internal.button.innerHTML = "Execute";
    playerChat.internal.button.style.setProperty("background-color", "#21c0ff");
}
function commandModeOff() {
    playerChat.mode = "normal";
    playerChat.internal.button.innerHTML = "Send";
    playerChat.internal.button.style.setProperty("background-color", "#4CAF50");
}

// Listener to toggle command mode
playerChat.internal.textInput.addEventListener("keydown", (ev) => {
    if (ev.key == "/") {
        if (playerChat.internal.textInput.value == "") {
            // If the first key entered is /, turn command mode on
            ev.preventDefault();
            commandModeOn();
        }
    }
    if (ev.key == "Backspace") {
        if (playerChat.internal.textInput.value == "") {
            // If backspace is pressed while text area is empty, turn off command mode
            commandModeOff();
        }
    }
    if (ev.key == "ArrowUp") {
        // Load the last entered command - useful when you made a mistake when typing a command
        commandModeOn();
        playerChat.internal.textInput.value = playerChat.lastCommandText;
        playerChat.internal.textInput.setSelectionRange(playerChat.lastCommandText.lenght, playerChat.lastCommandText.lenght);
    }
});


// The databases for moduleHelp command
const moduleDescriptionDatabase = {
    chat: "The chat is a module that allows players to communicate via text messages."
}
const extensionDescriptionDatabase = {
    chat: {
        commands: "This extension provides the command functionality to the chat module."
    }
}

// API for other modules to register their descriptions
window.defineAPI("register module description", (args) => {
    [moduleName, description] = args;

    moduleDescriptionDatabase[moduleName] = description;
    console.log(moduleDescriptionDatabase);
});
window.defineAPI("register extension description", (args) => {
    [moduleName, extensionName, description] = args;

    // If the module object hasn't been setup yet, create it
    if (!extensionDescriptionDatabase.hasOwnProperty(moduleName)) {
        extensionDescriptionDatabase[moduleName] = {};
    }

    (extensionDescriptionDatabase[moduleName])[extensionName] = description;
});

window.declareAsLoaded("chat", "commands");
