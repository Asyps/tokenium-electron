// Mockup - will be replaced by server
class chatComponent {
    constructor(type, data) {
        this.type = type,
        this.data = data
    }
}

let pfpDictionary = {
    "Dave": "../../images/Dave.png",
    "Fred": "../../images/placeholder_1.png",
    "Anna": "../../images/placeholder_2.png",
    "Steve": "../../images/placeholder_3.png"
}
let localPlayerName = "Dave"
// end of mockup (hopefully)

const playerChat = {
    lastMessageSender: "",
    messages: [
        new chatComponent("system", "Chat welcomes you!"),
        new chatComponent("header", "Fred"),
        new chatComponent("message", "Hi guys!"),
        new chatComponent("header", "Steve"),
        new chatComponent("message", "Hello Frederick!"),
        new chatComponent("header", "Anna"),
        new chatComponent("message", "Hi!"),
        new chatComponent("system", "Chat shuts down!"),
    ],

    internal: {
        textInput: document.getElementById("playerChatInput"),
        messageArea: document.getElementById("playerChatMessages"),
        
        displaySystemMessage(text) {
            const message = document.createElement('div');
            message.className = 'system-message';
            message.textContent = text;
            this.messageArea.appendChild(message);
        },

        displayUserHeader(userName) {
            const header = document.createElement('div');
            header.className = 'user-header';

            const img = document.createElement('img');
            img.src = pfpDictionary[userName];
            img.alt = userName;
            img.className = 'user-image';

            const name = document.createElement('span');
            name.className = 'user-name';
            name.textContent = userName;

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

        displayChatComponent(component) {
            if (component.type == "system") {
                this.displaySystemMessage(component.data);
                playerChat.lastMessageSender = "";
            }
            else if (component.type == "header") {
                this.displayUserHeader(component.data);
                playerChat.lastMessageSender = component.data;
            }
            else {
                this.displayUserMessage(component.data);
            }
        }
    },

    send() {
        if (this.lastMessageSender != localPlayerName) {
            playerChat.internal.displayUserHeader(localPlayerName);
            playerChat.messages.push(new chatComponent("header", localPlayerName));
        }

        this.internal.displayUserMessage(this.internal.textInput.value);
        playerChat.messages.push(new chatComponent("message", this.internal.textInput.value));

        this.internal.textInput.value = "";
        this.lastMessageSender = localPlayerName;
    },

    sendSystemMessage(text) {
        this.internal.displaySystemMessage(text);
        this.messages.push(new chatComponent("system", text));

        this.lastMessageSender = "";
    },
}

for (i of playerChat.messages) {
    playerChat.internal.displayChatComponent(i);
}
