// Register a description
window.callFunctionOnLoaded(["chat", "commands"], "registerDescription", ["chat", "inWorldChat"], 
    "This extension adds the in world chat. Players can send messages as their characters. This chat is intended to hold all interactions within the game world, while the player chat is for 'meta' communication."
);

// Alter starting html
// HTML Structure generated by ChatGPT, edited

// Add tab buttons
let tabDiv = document.createElement("div");
tabDiv.setAttribute("class", "tab-container");
tabDiv.innerHTML = `<button class="tab-button active" onclick="openTab('playerChat')">Player chat</button><button class="tab-button" onclick="openTab('inWorldChat')">In-world chat</button>`
/*
    <div class="tab-container">
        <button class="tab-button active" onclick="openTab('playerChat')">Player chat</button>
        <button class="tab-button" onclick="openTab('inWorldChat')">In-world chat</button>
    </div>
*/
document.body.insertBefore(tabDiv, document.getElementById("playerChat"));

// Add in-world chat divs
let chatTabDiv = document.createElement("div");
chatTabDiv.id = "inWorldChat";
chatTabDiv.setAttribute("class", "tab-content");
chatTabDiv.style = "display:none;"
chatTabDiv.innerHTML = '<div class="chat-container"><div class="chat-messages" id="inWorldChatMessages"><div class="scroll-anchor" id="inWorldChatScrollAnchor"></div></div></div><div class="chat-input-container"><input type="text" id="inWorldChatInput" class="chat-input" placeholder="Type your message..."></input><div class="dropdown-and-button"><select id="characterSelect" class="character-select"></select><button class="send-button" onclick="inWorldChat.confirm()">Send</button></div></div>'
/*
    <div class="tab-content" id="inWorldChat" style="display:none;"">
        <div class="chat-container">
            <div class="chat-messages" id="inWorldChatMessages">
                <div class="scroll-anchor" id="inWorldChatScrollAnchor"></div>
            </div>
        </div>
        <div class="chat-input-container">
            <input type="text" id="inWorldChatInput" class="chat-input" placeholder="Type your message..."></input>
            <div class="dropdown-and-button">
                <select id="characterSelect" class="character-select"></select>
                <button class="send-button" onclick="inWorldChat.confirm()">Send</button>
            </div>
        </div>
    </div>
*/
document.body.appendChild(chatTabDiv);


// Tab functionality
// Generated by ChatGPT, edited
function openTab(tabId) {
    // Hide all tab content
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => content.style.display = 'none');

    // Remove active class from all tab buttons
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => button.classList.remove('active'));

    // Show the selected tab content
    document.getElementById(tabId).style.display = 'flex';

    // Add active class to the clicked tab button
    document.querySelector(`.tab-button[onclick="openTab('${tabId}')"]`).classList.add('active');
}

// Mockup of the chat synchronised document - contains the data for the chat that will be synchronised between all players
const inWorldChatDocumentMockup = {
    chatMessages: [
        new chatComponent("system", "In world chat exists!"),
        new chatComponent("header", "Martha"),
        new chatComponent("message", "Kdy-už-tam-bu-dem!"),
        new chatComponent("header", "Dave"),
        new chatComponent("message", "Proboha nezačínej s tím, Martho."),

        new chatComponent("system", "Objevili se vlci."),

        new chatComponent("header", "Martha"),
        new chatComponent("message", "A-a-a-le ne-e-e! V-v-vl-ci!"),
        new chatComponent("header", "Dave"),
        new chatComponent("message", "Klid, jen klid. Aven to zvládne. Ž-že, Avene? Avene!"),

        new chatComponent("system", "Souboj zahájen.")
    ],
    lastMessageSender: "",
}


const inWorldChat = {
    internal: {
        // HTML components
        textInput: document.getElementById("inWorldChatInput"),
        characterInput: document.getElementById("characterSelect"),
        messageArea: document.getElementById("inWorldChatMessages"),
        anchor: document.getElementById("inWorldChatScrollAnchor"),
        
        // Helper functions that add the chat components into DOM
        displaySystemMessage(text) {
            // Create the system message
            const message = document.createElement('div');
            message.className = 'system-message';
            message.textContent = text;
            
            // Add it to DOM
            this.messageArea.insertBefore(message, this.anchor);
        },
        displayCharacterHeader(characterName) {
            // Create the header
            const header = document.createElement('div');
            header.className = 'user-header';

            // Create the character picture
            const img = document.createElement('img');
            img.src = pfpDictionary[characterName];
            img.alt = characterName;
            img.className = 'user-image';

            // Create the name
            const name = document.createElement('span');
            name.className = 'user-name';
            name.textContent = characterName;

            // Assemble and add to DOM
            header.appendChild(img);
            header.appendChild(name);
            this.messageArea.insertBefore(header, this.anchor);
        },
        displayCharacterMessage(text) {
            // Create the character message
            const message = document.createElement('div');
            message.className = 'user-message';
            message.textContent = text;

            // Add it to DOM
            this.messageArea.insertBefore(message, this.anchor);
        },

        // Function to display any component
        addChatComponent(component) {
            if (component.type == "system") {
                this.displaySystemMessage(component.data);
                inWorldChatDocumentMockup.lastMessageSender = "";       // Always insert a header after a system message
            }
            else if (component.type == "header") {
                this.displayCharacterHeader(component.data);
                inWorldChatDocumentMockup.lastMessageSender = component.data;
            }
            else {
                this.displayCharacterMessage(component.data);
            }
        }
    },

    // Send the contents of the text area
    confirm() {
        // Only do anything if there is text that can be sent
        if (this.internal.textInput.value != "") {
            // Get the name of the selected character
            let selectedCharacter = this.internal.characterInput.value;
            
            // Add a user header unless the last message was sent by the selected character
            if (inWorldChatDocumentMockup.lastMessageSender != selectedCharacter) {    
                let header = new chatComponent("header", selectedCharacter);

                this.internal.addChatComponent(header);
                inWorldChatDocumentMockup.chatMessages.push(header);
            }

            let message = new chatComponent("message", this.internal.textInput.value);
            
            // Add the message to DOM and scroll the chat
            this.internal.addChatComponent(message);
            this.internal.anchor.scrollIntoView({ behavior: 'smooth' });

            // Add the message to Document
            inWorldChatDocumentMockup.chatMessages.push(message);

            // Clear the text area
            this.internal.textInput.value = "";
        }
    },

    // Send a system message
    sendSystemMessage(text) {
        let systemMessage = new chatComponent("system", text);

        // Add the system message to DOM and scroll the chat
        this.internal.addChatComponent(systemMessage);
        this.internal.anchor.scrollIntoView({ behavior: 'smooth' });

        // Add the system message to Document
        inWorldChatDocumentMockup.chatMessages.push(systemMessage);
    },

    // Add a character to the dropdown menu
    addCharacter(name) {
        character = document.createElement("option");
        character.value = character.innerHTML = character.id = name;
        this.internal.characterInput.add(character);
    },
}

// Set a keybind to send a message
inWorldChat.internal.textInput.addEventListener("keydown", (ev) => {
    if (ev.key == "Enter") {
        ev.preventDefault();    // Prevent the enter key from being entered into the text area
        inWorldChat.confirm();
    }
});

// API to let other modules send system messages.
window.defineAPI("inWorldChatSystemMessage", (message) => {
    inWorldChat.sendSystemMessage(message);
});

// Initialize chat on module load
for (i of inWorldChatDocumentMockup.chatMessages) {
    inWorldChat.internal.addChatComponent(i);
}

// Scroll the chat
inWorldChat.internal.anchor.scrollIntoView({ behavior: 'smooth' });

// test
inWorldChat.addCharacter("Fred");
inWorldChat.addCharacter("Bertha");

