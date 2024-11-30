// Mockup - will be replaced by server
class chatComponent {
    constructor(type, data) {
        this.type = type,
        this.data = data
    }
}

// will not be needed, will generate file name from player name
let pfpDictionary = {
    "Dave": "../../profile_pics/Dave.png",
    "Fred": "../../profile_pics/placeholder_1.png",
    "Anna": "../../profile_pics/placeholder_2.png",
    "Steve": "../../profile_pics/placeholder_3.png"
}
let localPlayerName = "Dave"

// Mockup of the chat synchronised document - contains the data for the chat that will be synchronised between all players
const chatDocumentMockup = {
    chatMessages: [
        new chatComponent("system", "Chat welcomes you!"),
        new chatComponent("header", "Fred"),
        new chatComponent("message", "Hi guys!"),
        new chatComponent("header", "Steve"),
        new chatComponent("message", "Hello Frederick!"),
        new chatComponent("header", "Anna"),
        new chatComponent("message", "Hi!"),
        new chatComponent("system", "Chat shuts down!"),
    ],
    lastMessageSender: "",
}



const playerChat = {
    internal: {
        // HTML components
        textInput: document.getElementById("playerChatInput"),
        messageArea: document.getElementById("playerChatMessages"),
        
        // Helper functions that add the chat components into DOM
        displaySystemMessage(text) {
            const message = document.createElement('div');
            message.className = 'system-message';
            message.textContent = text;
            this.messageArea.appendChild(message);
        },
        displayUserHeader(userName) {
            // Create the header
            const header = document.createElement('div');
            header.className = 'user-header';

            // Create the profile picture image
            const img = document.createElement('img');
            img.src = pfpDictionary[userName];
            img.alt = userName;
            img.className = 'user-image';

            // Create the name
            const name = document.createElement('span');
            name.className = 'user-name';
            name.textContent = userName;

            // Assemble and add to DOM
            header.appendChild(img);
            header.appendChild(name);
            this.messageArea.appendChild(header);
        },
        displayUserMessage(text) {
            const message = document.createElement('div');
            message.className = 'user-message';
            message.textContent = text;
            this.messageArea.appendChild(message);
        },

        // Function to display any component
        addChatComponent(component) {
            if (component.type == "system") {
                this.displaySystemMessage(component.data);
                chatDocumentMockup.lastMessageSender = "";      // Always insert a header after a system message
            }
            else if (component.type == "header") {
                this.displayUserHeader(component.data);
                chatDocumentMockup.lastMessageSender = component.data;
            }
            else {
                this.displayUserMessage(component.data);
            }
        }
    },

    // Send the contents of the text area
    confirm() {
        if (this.internal.textInput.value != "") {
            // Add a user header unless the last message was sent by the local player
            if (chatDocumentMockup.lastMessageSender != localPlayerName) {
                let header = new chatComponent("header", localPlayerName);

                playerChat.internal.addChatComponent(header);
                chatDocumentMockup.chatMessages.push(header);
            }

            // Add the message
            let message = new chatComponent("message", this.internal.textInput.value);

            this.internal.addChatComponent(message);
            chatDocumentMockup.chatMessages.push(message);

            // Clear the text area
            this.internal.textInput.value = "";
        }
    },

    // Send a system message
    sendSystemMessage(text) {
        let systemMessage = new chatComponent("system", text);

        this.internal.addChatComponent(systemMessage);
        chatDocumentMockup.chatMessages.push(systemMessage);
    },
}

// Set a keybind to send a message
playerChat.internal.textInput.addEventListener("keydown", (ev) => {
    if (ev.key == "Enter") {
        ev.preventDefault();    // Prevent the enter key from being entered into the text area
        playerChat.confirm();    
    }
});

// API to let other modules send system messages.
window.defineAPI("player chat system message", (args) => {
    playerChat.sendSystemMessage(args[0]);
});


// Initialize chat on module load
for (i of chatDocumentMockup.chatMessages) {
    playerChat.internal.addChatComponent(i);
}

window.declareAsLoaded("chat");