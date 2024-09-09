// Example JavaScript to add chat components

// Function to add a system message
function addSystemMessage(text) {
    const message = document.createElement('div');
    message.className = 'system-message';
    message.textContent = text;
    document.getElementById('playerChatMessages').appendChild(message);
}

// Function to add a user header
function addUserHeader(userName, userImage) {
    const header = document.createElement('div');
    header.className = 'user-header';

    const img = document.createElement('img');
    img.src = userImage;
    img.alt = userName;
    img.className = 'user-image';

    const name = document.createElement('span');
    name.className = 'user-name';
    name.textContent = userName;

    header.appendChild(img);
    header.appendChild(name);

    document.getElementById('playerChatMessages').appendChild(header);
}

// Function to add a user message
function addUserMessage(text) {
    const message = document.createElement('div');
    message.className = 'user-message';
    message.textContent = text;
    document.getElementById('playerChatMessages').appendChild(message);
}

// Example usage:
addSystemMessage("Welcome to the chat!");
addUserHeader("Alice", "../tokenium/images/Dave.png");
addUserMessage("Hi there!");
addUserMessage("How are you?");
addUserHeader("Bob", "../tokenium/images/Dave.png");
addUserMessage("I'm good, thanks!");
addSystemMessage("Server will shut up!");
addUserHeader("Bob", "../tokenium/images/Dave.png");
addUserMessage("Noooooooooooo!");
addSystemMessage("Welcome to the chat!");
addUserHeader("Alice", "../tokenium/images/Dave.png");
addUserMessage("Hi there!");
addUserMessage("How are you?");
addUserHeader("Bob", "../tokenium/images/Dave.png");
addUserMessage("I'm good, thanks!");
addSystemMessage("Server will shut up!");
