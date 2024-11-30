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


// A class for command entries
class command {
    constructor(callback, syntaxInfo, description, maxArgumentCount=0) {
        this.callback = callback;
        this.syntaxInfo = syntaxInfo;
        this.description = description;
        this.maxArgumentCount = maxArgumentCount;
    }
}

const commandDatabase = {
    help: new command(
        (commandName) => {
            if (commandName == undefined) {
                playerChat.internal.addChatComponent(new chatComponent("command local", "To get into command mode, press / when the text field is empty. The character / won't appear in the text area. To cancel command mode, press packspace when the input field is empty."));
                playerChat.internal.addChatComponent(new chatComponent("command local", "The blue box is a local command output that other players won't see and that will not persist between sessions."));
                playerChat.internal.addChatComponent(new chatComponent("command public", "The green box is a public command output that other players will see and that persists between sessions."));
                playerChat.internal.addChatComponent(new chatComponent("command error", "The red box is a local command output that signifies an error."));
                
                // Generate the list of commands
                let commandListStr = "";
                for (i in commandDatabase) {
                    commandListStr += i + "; ";
                }
                commandListStr = commandListStr.slice(0, -2);        //Remove the last "; " characters from the string

                playerChat.internal.addChatComponent(new chatComponent("command local", "List of available commands: " + commandListStr));
            }
            else if (commandDatabase.hasOwnProperty(commandName)) {
                playerChat.internal.addChatComponent(new chatComponent("command local", commandDatabase[commandName].syntaxInfo));
                playerChat.internal.addChatComponent(new chatComponent("command local", commandDatabase[commandName].description));

            }
            else {
                playerChat.internal.addChatComponent(new chatComponent("command error", "The specified command does not exist."));
            }
        },
        "help [commandName]",
        "Shows the syntax and description of the specified command. If commandName is ommited, shows a manual to use the command system and list of all available commands instead.",
    )
}


// Init
playerChat.internal.button = document.getElementById("playerSendButton");
playerChat.mode = "normal";


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
            
            // If the command exists, execute it's callback
            if (commandDatabase.hasOwnProperty(commandName)) {
                commandDatabase[commandName].callback(...commandArguments);
            }
            else {
                playerChat.internal.addChatComponent(new chatComponent("command error", "This command does not exist."));
            }

            commandModeOff();
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
});
