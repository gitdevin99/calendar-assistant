let mediaRecorder;
let audioChunks = [];

const startRecordingButton = document.getElementById('start-recording');
const stopRecordingButton = document.getElementById('stop-recording');
const chatMessages = document.getElementById('chat-messages');

// Initialize speech recognition
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.continuous = true;
recognition.interimResults = true;

startRecordingButton.addEventListener('click', startRecording);
stopRecordingButton.addEventListener('click', stopRecording);

function startRecording() {
    recognition.start();
    startRecordingButton.disabled = true;
    stopRecordingButton.disabled = false;
    addMessage('Listening...', 'assistant');
}

function stopRecording() {
    recognition.stop();
    startRecordingButton.disabled = false;
    stopRecordingButton.disabled = true;
}

recognition.onresult = (event) => {
    const current = event.resultIndex;
    const transcript = event.results[current][0].transcript;
    
    if (event.results[current].isFinal) {
        addMessage(transcript, 'user');
        sendToServer(transcript);
    }
};

async function sendToServer(input) {
    try {
        const response = await fetch('/api/conversation/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ input })
        });

        const data = await response.json();
        
        if (data.error) {
            addMessage('Sorry, there was an error processing your request.', 'assistant');
            return;
        }

        // Add the text response
        addMessage(data.text, 'assistant');

        // Play the audio response
        const audio = new Audio(URL.createObjectURL(
            new Blob([data.audio], { type: 'audio/mpeg' })
        ));
        await audio.play();
    } catch (error) {
        console.error('Error:', error);
        addMessage('Sorry, there was an error processing your request.', 'assistant');
    }
}

function addMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    messageDiv.textContent = text;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}
