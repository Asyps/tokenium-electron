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
    playerChat.internal.messageArea.insertBefore(outerDiv, playerChat.internal.anchor);
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
    playerChat.internal.messageArea.insertBefore(outerDiv, playerChat.internal.anchor);
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
    playerChat.internal.messageArea.insertBefore(outerDiv, playerChat.internal.anchor);
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
    // Add the command output to DOM and scroll the chat, don't include the output in shared document
    playerChat.internal.addChatComponent(new chatComponent("command local", text));
    playerChat.internal.anchor.scrollIntoView({ behavior: 'smooth' });
}
playerChat.commandPublic = (text) => {
    publicOut = new chatComponent("command public", text);
    
    // Add the command output to DOM and scroll the chat
    playerChat.internal.addChatComponent(publicOut);
    playerChat.internal.anchor.scrollIntoView({ behavior: 'smooth' });

    // Do include the output in shared document
    chatDocumentMockup.push(publicOut);
}
playerChat.commandError = (text) => {
    // Add the command output to DOM and scroll the chat, don't include the output in shared document
    playerChat.internal.addChatComponent(new chatComponent("command error", text));
    playerChat.internal.anchor.scrollIntoView({ behavior: 'smooth' });
}


// A class for command entries
class command {
    constructor(moduleName, callString, syntaxInfo, description) {
        this.moduleName = moduleName;
        this.callString = callString;
        this.syntaxInfo = syntaxInfo;
        this.description = description;
    }
}

// The database that stores all commands
const commandDatabase = {
    "": {
        "help": new command(
            "chat",
            "help",
            "help [commandName [groupName] | groupName -g]",
            "Shows the syntax and description of the specified command. If only groupName is provided (one argument with the -g flag), list of commands within the group is shown instead. If no arguments are specified, shows a manual to use the command system and list of all available commands and groups.",
        ),
        "moduleHelp": new command(
            "chat",
            "moduleHelp",
            "moduleHelp [moduleName [extensionName]] [-l]",
            "Shows the description of the specified module. If extensionName is specified, the description of the extension is shown instead. If the -l flag is set, shows the list of modules (or extensions for the specified module) that have registered descriptions."
        ),
    }
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
            
            // First check if the entry is a groupless command
            if (commandDatabase[""].hasOwnProperty(commandName)) {
                // If it's a groupless command, run it
                window.callFunction(commandDatabase[""][commandName].moduleName, "command-" + commandDatabase[""][commandName].callString, flags, ...commandArguments);
            }
            else {
                // If not, it may be a grouped command. Update variables
                let groupName = commandName;
                commandName = commandArguments.shift();

                // Check if the command is a grouped command
                if (commandDatabase.hasOwnProperty(groupName) && commandDatabase[groupName].hasOwnProperty(commandName)) {
                    // If it is a grouped command, run it
                    window.callFunction(commandDatabase[groupName][commandName].moduleName, "command-" + commandDatabase[groupName][commandName].callString, flags, ...commandArguments);
                } else {
                    // Otherwise display error
                    playerChat.commandError("This command does not exist. To see the list of available commands, enter the help command.");
                }
            }

            // Turn off command mode and save the entered command
            commandModeOff();
            playerChat.lastCommandText = playerChat.internal.textInput.value;
        }
        
        // Clear the text area and scroll the chat
        playerChat.internal.textInput.value = "";
        playerChat.internal.anchor.scrollIntoView({ behavior: 'smooth' });
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
window.defineAPI("registerDescription", (moduleExtensionPair, description) => {
    // Process arguments - if moduleExtensionPair is a string, it specifies the moduleName - put it inside an array. Destructure moduleExtentionPair.
    if (typeof moduleExtensionPair == "string") moduleExtensionPair = [moduleExtensionPair];
    [moduleName, extensionName] = moduleExtensionPair;

    // If the extension name is undefined, add the description to the module database
    if (extensionName == undefined) moduleDescriptionDatabase[moduleName] = description;
    // Otherwise add it to the extension database
    else {
        // If the object for the module hasn't been setup yet, create it
        if (!extensionDescriptionDatabase.hasOwnProperty(moduleName)) {
            extensionDescriptionDatabase[moduleName] = {};
        }

        // Add the description
        (extensionDescriptionDatabase[moduleName])[extensionName] = description;
    }  
});

// API for other modules to define their commands
window.defineAPI("registerCommand", function (groupName="", commandName, syntaxInfo, description) {   // Groupless commands have an empty string as groupName and as the key in commandDatabase
    // If the group is specified but doesn't exist yet, create it
    if (commandDatabase[groupName] == undefined) commandDatabase[groupName] = {}

    // Add the command to the group within the database (if the command already exists, it gets replaced)
    commandDatabase[groupName][commandName] = new command(arguments[4], groupName + ((groupName == "") ? "" : "-") + commandName, syntaxInfo, description);
}, false, true);

// API for other modules to display command results
window.defineAPI("showCommandOutput", (type, message) => {
    if (type == "local") playerChat.commandLocal(message);
    else if (type == "public") playerChat.commandPublic(message);
    else playerChat.commandError(message);
});

// Define commands in API
window.defineAPI("command-help", (flags, arg1, arg2) => {
    // Process arguments
    if (arg2 == undefined) {
        // If only one argument is specified...
        if (flags.includes("-g")) {
            // And the group flag is set, it specifies the group name
            var groupName = arg1;
        }
        else {
            // Otherwise it is the command name
            var commandName = arg1;
        }
    }
    else {
        // If both are specified, they are the group name and command name
        var groupName = arg1;
        var commandName = arg2;
    }

    if (commandName == undefined && groupName == undefined) {

        // If no parameter is defined, display a manual to use the command system and a list of available commands and groups
        playerChat.commandLocal("To get into command mode, press / when the text field is empty. The character / won't appear in the text area. To cancel command mode, press packspace when the input field is empty.");
        playerChat.commandLocal("The blue box is a local command output that other players won't see and that will not persist between sessions.");
        // Add the next line directly to chat to not synchronise it between players, because it serves as an example only
        playerChat.internal.addChatComponent(new chatComponent("command public", "The green box is a public command output that other players will see and that persists between sessions."));
        playerChat.commandError("The red box is a local command output that signifies an error.");
        

        // Generate the list of commands
        let commandListStr = "List of available commands: ";
        for (i in commandDatabase[""]) {
            commandListStr += i + "; ";
        }
        commandListStr = commandListStr.slice(0, -2);        // Remove the last "; " characters from the string

        // Show the list of commands
        playerChat.commandLocal(commandListStr);


        // Generate the list of command groups
        commandListStr = "";
        for (i in commandDatabase) {
            commandListStr += i + "; ";                      // The groupless commands will result in an extra "; " added to the beginning of the string since i="" for that case
        }
        commandListStr = commandListStr.slice(2, -2);        // Remove the first and last "; " characters from the string

        // Show the list of command groups
        playerChat.commandLocal("List of available command groups: " + commandListStr);
    }
    else if (groupName == undefined) {
        // If only the command name was specified...
        if (commandDatabase[""].hasOwnProperty(commandName)) {
            // If the specified command exists, show it's syntax info and description
            playerChat.commandLocal(commandDatabase[""][commandName].syntaxInfo);
            playerChat.commandLocal(commandDatabase[""][commandName].description);
            } 
        else {
            // Otherwise show error
            playerChat.commandError("The specified command '" + commandName + "' doesn't exist.");
        }
    }
    else {
        // The group is defined. If it exists...
        if (commandDatabase.hasOwnProperty(groupName)) {
            
            if (commandName == undefined) {
                // If the commandName isn't specified, show list of commands

                // Generate the list of commands
                let commandListStr = "List of available commands in group '" + groupName + "': ";
                for (i in commandDatabase[groupName]) {
                    commandListStr += i + "; ";
                }
                commandListStr = commandListStr.slice(0, -2);        // Remove the last "; " characters from the string

                // Show the list of commands
                playerChat.commandLocal(commandListStr);
            }
            else {
                // If the commandName is specified...
                if (commandDatabase[groupName].hasOwnProperty(commandName)) {
                    // If the specified command exists, show it's syntax info and description
                    playerChat.commandLocal(commandDatabase[groupName][commandName].syntaxInfo);
                    playerChat.commandLocal(commandDatabase[groupName][commandName].description);
                    } 
                else {
                    // Otherwise show error
                    playerChat.commandError("The specified command '" + commandName + "' within group '" + groupName + "' doesn't exist.");
                }
            }
        }
        else {
            // If the group doesn't exist, show error
            playerChat.commandError("The specified group '" + groupName + "' doesn't exist.");
        }
    }
});

window.defineAPI("command-moduleHelp", (flags, moduleName, extensionName) => {
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
            // If the -l flag is set, display list of extensions for the specified module
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
        // If both moduleName and extensionName are defined, show the description of the extension regardless of flags
        if (extensionDescriptionDatabase.hasOwnProperty(moduleName) && extensionDescriptionDatabase[moduleName].hasOwnProperty(extensionName)) {
            // If the description is registered, show it
            playerChat.commandLocal(extensionDescriptionDatabase[moduleName][extensionName]);
        }
        else {
            // If it isn't, show error
            playerChat.commandError("Extension '" + extensionName + "' for module '" + moduleName + "' doesn't exist or it didn't register a description.");
        }
    }
});