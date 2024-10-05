// Function to fetch and load the responses.json file
async function loadIntents() {
    try {
        const response = await fetch('responses.json');
        const data = await response.json();
        return data.intents;
    } catch (error) {
        console.error("Error loading intents:", error);
        return [];
    }
}

// Levenshtein Distance Function for Fuzzy Matching
function levenshteinDistance(s1, s2) {
    const len1 = s1.length;
    const len2 = s2.length;
    const matrix = [];

    for (let i = 0; i <= len1; i++) {
        matrix[i] = [i];
    }

    for (let j = 0; j <= len2; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= len1; i++) {
        for (let j = 1; j <= len2; j++) {
            const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,   // Deletion
                matrix[i][j - 1] + 1,   // Insertion
                matrix[i - 1][j - 1] + cost  // Substitution
            );
        }
    }

    return matrix[len1][len2];
}

// Function to get response with fuzzy matching
async function getBestResponse(userInput) {
    const intents = await loadIntents(); // Load the intents dynamically
    let bestMatch = null;
    let minDistance = Infinity;

    // Loop over intents and calculate distance
    intents.forEach(intent => {
        intent.patterns.forEach(pattern => {
            const distance = levenshteinDistance(userInput, pattern);
            if (distance < minDistance) {
                minDistance = distance;
                bestMatch = intent;
            }
        });
    });

    // If we have a good match (within a certain threshold), return a random response
    if (bestMatch && minDistance < 3) { // Adjust threshold for matching
        const responses = bestMatch.responses;
        return responses[Math.floor(Math.random() * responses.length)];
    }

    return "I don't understand that.";
}

// Function to speak text
function speak(text) {
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = 'en-US'; // Set the language (change if necessary)
    window.speechSynthesis.speak(speech); // Speak the text
}

// Function to display chat message
function displayMessage(message, isUser) {
    const messagesDiv = document.getElementById('messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = isUser ? 'user-message' : 'bot-message';
    messageDiv.innerText = message;
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight; // Scroll to bottom
}

// Function to handle message sending
async function sendMessage() {
    const userInput = document.getElementById('userInput').value.trim().toLowerCase();
    if (userInput) {
        displayMessage(userInput, true);  // Display user message
        const botResponse = await getBestResponse(userInput);  // Get bot response
        displayMessage(botResponse, false);  // Display bot message
        speak(botResponse); // Make the bot speak the response
        document.getElementById('userInput').value = '';  // Clear input
    }
}

// Event listener for sending message with the send button
document.getElementById('sendButton').addEventListener('click', sendMessage);

// Event listener for sending message with the Enter key
document.getElementById('userInput').addEventListener('keypress', function (event) {
    if (event.key === 'Enter') {
        sendMessage(); // Call the send message function
        event.preventDefault(); // Prevent the default action of Enter key
    }
});

// Speech Recognition
const micBtn = document.getElementById('voiceButton');
const userInputField = document.getElementById('userInput');

if ('webkitSpeechRecognition' in window) {
    const recognition = new webkitSpeechRecognition();
    recognition.continuous = false; // Stops automatically after detecting speech
    recognition.interimResults = false; // Do not show interim results

    recognition.onstart = function () {
        console.log('Voice recognition started. Speak into the microphone.');
    };

    recognition.onresult = function (event) {
        const transcript = event.results[0][0].transcript; // Get the recognized text
        userInputField.value = transcript; // Set the input value to the recognized text
        displayMessage(transcript, true); // Display user message
        getBestResponse(transcript).then(botResponse => {
            displayMessage(botResponse, false); // Display bot response
            speak(botResponse); // Make the bot speak the response
        });
    };

    recognition.onerror = function (event) {
        console.error('Speech recognition error:', event.error);
    };

    micBtn.addEventListener('click', function () {
        recognition.start(); // Start recognition on microphone button click
    });
} else {
    console.error('Speech recognition not supported in this browser.');
}
