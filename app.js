// Application State
const state = {
    messages: [],
    isGenerating: false,
    controller: null
};

// Voice Recording State
const voiceState = {
    isRecording: false,
    mediaRecorder: null,
    audioChunks: [],
    startTime: null,
    timerInterval: null,
    audioMotion: null,
    currentAudioBlob: null,
    currentAudioUrl: null,
    previewAudio: null,
    mimeType: 'audio/webm', // Default, will be detected
    recognition: null,
    transcript: ''
};

// Configuration
const CONFIG = {
    ollamaHost: 'http://localhost:11434',
    model: 'gemma3:4b',
    webSearchEnabled: false
};

// DOM Elements
const elements = {
    chatMessages: null,
    messageInput: null,
    sendButton: null,
    fileInput: null,
    fileButton: null,
    voiceButton: null,
    webSearchToggle: null,
    clearChatButton: null,
    connectionStatus: null,
    loadingTemplate: null,
    recordingUI: null,
    visualizerContainer: null,
    recordingTimer: null,
    voicePreview: null,
    previewPlayButton: null,
    previewDiscard: null,
    previewConfirm: null,
    previewTranscript: null
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    init();
});

function init() {
    // Cache DOM elements
    elements.chatMessages = document.getElementById('chatMessages');
    elements.messageInput = document.getElementById('messageInput');
    elements.sendButton = document.getElementById('sendButton');
    elements.fileInput = document.getElementById('fileInput');
    elements.fileButton = document.getElementById('fileButton');
    elements.voiceButton = document.getElementById('voiceButton');
    elements.webSearchToggle = document.getElementById('webSearchToggle');
    elements.clearChatButton = document.getElementById('clearChat');
    elements.connectionStatus = document.getElementById('connectionStatus');
    elements.loadingTemplate = document.getElementById('loadingTemplate');

    // Voice UI Elements
    elements.recordingUI = document.getElementById('recordingUI');
    elements.visualizerContainer = document.getElementById('visualizerContainer');
    elements.recordingTimer = document.getElementById('recordingTimer');

    // Voice Preview Elements
    elements.voicePreview = document.getElementById('voicePreview');
    elements.previewPlayButton = document.getElementById('previewPlayButton');
    elements.previewDiscard = document.getElementById('previewDiscard');
    elements.previewConfirm = document.getElementById('previewConfirm');
    elements.previewTranscript = document.getElementById('previewTranscript');

    // Setup Event Listeners
    setupEventListeners();

    // Check connection
    checkConnection();

    // Load history
    loadMessages();

    // Focus input
    elements.messageInput.focus();
}

function setupEventListeners() {
    // Message Input
    elements.messageInput.addEventListener('keydown', handleInputKeydown);
    elements.messageInput.addEventListener('input', autoResizeTextarea);
    elements.sendButton.addEventListener('click', handleSendMessage);

    // File Upload
    elements.fileButton.addEventListener('click', () => elements.fileInput.click());
    elements.fileInput.addEventListener('change', handleFileSelect);

    // Web Search Toggle
    elements.webSearchToggle.addEventListener('click', toggleWebSearch);

    // Clear Chat
    elements.clearChatButton.addEventListener('click', clearChat);

    // Voice Recording
    elements.voiceButton.addEventListener('click', toggleVoiceRecording);

    // Voice preview controls
    if (elements.previewPlayButton) elements.previewPlayButton.addEventListener('click', playPreview);
    if (elements.previewDiscard) elements.previewDiscard.addEventListener('click', discardRecording);
    if (elements.previewConfirm) elements.previewConfirm.addEventListener('click', confirmRecording);

    // Example prompts
    document.querySelectorAll('.example-prompt').forEach(button => {
        button.addEventListener('click', () => {
            const prompt = button.getAttribute('data-prompt');
            elements.messageInput.value = prompt;
            elements.messageInput.focus();
            handleSendMessage();
        });
    });
}

function toggleWebSearch() {
    CONFIG.webSearchEnabled = !CONFIG.webSearchEnabled;
    elements.webSearchToggle.classList.toggle('active');
    elements.webSearchToggle.title = `Web Search: ${CONFIG.webSearchEnabled ? 'On' : 'Off'}`;
}

function handleInputKeydown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
    }
}

function autoResizeTextarea() {
    const textarea = elements.messageInput;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
}

// ============================================
// File Upload Functionality
// ============================================
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        const fileInfo = `📎 File attached: ${file.name} (${formatFileSize(file.size)})`;
        elements.messageInput.value = (elements.messageInput.value ? elements.messageInput.value + '\n' : '') + fileInfo;
        elements.messageInput.focus();
        autoResizeTextarea();
    };
    reader.readAsDataURL(file);

    // Reset file input
    event.target.value = '';
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// ============================================
// Voice Recording Functionality
// ============================================
async function populateMicSelect() {
    try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return;

        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices.filter(device => device.kind === 'audioinput');
        const micSelect = document.getElementById('micSelect');

        if (!micSelect) return;

        // Save current selection
        const currentSelection = micSelect.value;

        micSelect.innerHTML = '';

        audioInputs.forEach(device => {
            const option = document.createElement('option');
            option.value = device.deviceId;
            option.text = device.label || `Microphone ${micSelect.length + 1}`;
            micSelect.appendChild(option);
        });

        // Restore selection or select default
        if (currentSelection && Array.from(micSelect.options).some(opt => opt.value === currentSelection)) {
            micSelect.value = currentSelection;
        }

        // Show only if multiple devices
        if (audioInputs.length > 1) {
            micSelect.style.display = 'block';
        } else {
            micSelect.style.display = 'none';
        }

        // Add change listener if not already added
        if (!micSelect.hasAttribute('data-listener-added')) {
            micSelect.addEventListener('change', async () => {
                if (voiceState.isRecording) {
                    // Restart recording with new device
                    stopVoiceRecording();
                    // Small delay to ensure cleanup
                    setTimeout(() => startVoiceRecording(), 100);
                }
            });
            micSelect.setAttribute('data-listener-added', 'true');
        }

    } catch (e) {
        console.error("Error enumerating devices:", e);
    }
}

async function toggleVoiceRecording() {
    console.log("Toggle voice recording clicked");
    if (voiceState.isRecording) {
        stopVoiceRecording();
    } else {
        await startVoiceRecording();
    }
}

async function startVoiceRecording() {
    console.log("Starting voice recording...");

    // Check API support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Error: Your browser does not support audio recording. Please ensure you are using a modern browser (Chrome/Edge/Firefox) and accessing the site via localhost or HTTPS.");
        return;
    }

    try {
        console.log("Requesting microphone permission...");

        const micSelect = document.getElementById('micSelect');
        const constraints = { audio: true };

        if (micSelect && micSelect.value) {
            constraints.audio = { deviceId: { exact: micSelect.value } };
        }

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        console.log("Microphone access granted");

        // Detect supported MIME type
        const mimeTypes = [
            'audio/webm;codecs=opus',
            'audio/webm',
            'audio/mp4',
            'audio/ogg;codecs=opus'
        ];

        voiceState.mimeType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type)) || 'audio/webm';
        console.log(`Using MIME type: ${voiceState.mimeType}`);

        // Setup MediaRecorder
        voiceState.mediaRecorder = new MediaRecorder(stream, { mimeType: voiceState.mimeType });
        voiceState.audioChunks = [];

        voiceState.mediaRecorder.addEventListener('dataavailable', event => {
            if (event.data.size > 0) {
                voiceState.audioChunks.push(event.data);
            }
        });

        voiceState.mediaRecorder.addEventListener('stop', () => {
            const audioBlob = new Blob(voiceState.audioChunks, { type: voiceState.mimeType });
            voiceState.currentAudioBlob = audioBlob;

            // Create audio URL for preview
            if (voiceState.currentAudioUrl) {
                URL.revokeObjectURL(voiceState.currentAudioUrl);
            }
            voiceState.currentAudioUrl = URL.createObjectURL(audioBlob);

            // Setup preview audio
            if (!voiceState.previewAudio) {
                voiceState.previewAudio = new Audio();
                voiceState.previewAudio.onended = () => {
                    elements.voicePreview.classList.remove('playing');
                    elements.previewPlayButton.innerHTML = `
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polygon points="5 3 19 12 5 21 5 3"></polygon>
                        </svg>
                    `;
                };
            }
            voiceState.previewAudio.src = voiceState.currentAudioUrl;

            // Show Preview UI
            elements.recordingUI.style.display = 'none';
            elements.voicePreview.style.display = 'flex';
            elements.voiceButton.style.display = 'none'; // Hide voice button during preview

            // Stop all tracks
            stream.getTracks().forEach(track => track.stop());
        });

        voiceState.mediaRecorder.start();
        voiceState.isRecording = true;
        voiceState.transcript = ''; // Reset transcript

        // Setup Speech Recognition
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            voiceState.recognition = new SpeechRecognition();
            voiceState.recognition.continuous = true;
            voiceState.recognition.interimResults = true;

            // Set language based on selection
            const langSelect = document.getElementById('langSelect');
            voiceState.recognition.lang = langSelect ? langSelect.value : 'en-US';
            console.log("Speech Recognition Language:", voiceState.recognition.lang);

            voiceState.recognition.onstart = () => {
                console.log("Speech Recognition Started");
            };

            voiceState.recognition.onaudiostart = () => {
                console.log("Speech Recognition Audio Started");
            };

            voiceState.recognition.onspeechstart = () => {
                console.log("Speech Recognition Speech Detected");
            };

            voiceState.recognition.onresult = (event) => {
                let interimTranscript = '';
                let finalTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }

                if (finalTranscript) {
                    voiceState.transcript += finalTranscript + ' ';
                    console.log("Final Transcript:", finalTranscript);
                }

                if (elements.previewTranscript) {
                    elements.previewTranscript.textContent = voiceState.transcript + interimTranscript;
                }
            };

            voiceState.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                if (event.error === 'no-speech') {
                    console.warn('No speech detected by recognition service');
                }
            };

            voiceState.recognition.onend = () => {
                console.log("Speech Recognition Ended");
            };

            voiceState.recognition.start();
        } else {
            console.warn('Speech recognition not supported');
        }

        // UI Updates
        elements.voiceButton.classList.add('recording');
        elements.voiceButton.title = 'Stop recording';
        // Change icon to stop square
        elements.voiceButton.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
        `;

        elements.messageInput.style.display = 'none';
        elements.recordingUI.style.display = 'flex';
        if (elements.previewTranscript) elements.previewTranscript.textContent = 'Listening...';

        // Populate microphone select
        await populateMicSelect();

        // Setup Audio Visualizer with AudioMotion Analyzer
        if (typeof AudioMotionAnalyzer !== 'undefined') {
            // Clean up previous instance if exists
            if (voiceState.audioMotion) {
                voiceState.audioMotion.destroy();
            }

            const container = elements.visualizerContainer;
            container.innerHTML = ''; // Clear container

            try {
                voiceState.audioMotion = new AudioMotionAnalyzer(
                    container,
                    {
                        source: stream,
                        height: 40,
                        mode: 3,
                        barSpace: 0.2,
                        ledBars: false,
                        showScaleX: false,
                        showScaleY: false,
                        spinSpeed: 0,
                        showPeaks: false,
                        overlay: true,
                        bgAlpha: 0,
                        alphaBars: false,
                        ansiBands: false,
                        channelLayout: 'single',
                        frequencyScale: 'log',
                        fftSize: 2048,
                        smoothing: 0.5,
                        maxFreq: 12000,
                        minFreq: 30,
                        reflexRatio: 0,
                        fillAlpha: 1,
                        lineWidth: 0,
                    }
                );

                // Register custom gradient
                voiceState.audioMotion.registerGradient('neonPink', {
                    bgColor: 'rgba(0,0,0,0)',
                    dir: 'v',
                    colorStops: [
                        { pos: 0, color: '#ff00ff' },
                        { pos: 1, color: '#667eea' }
                    ]
                });

                voiceState.audioMotion.setOptions({ gradient: 'neonPink' });
            } catch (e) {
                console.error('Failed to initialize AudioMotionAnalyzer:', e);
                container.textContent = 'Recording... (Visualizer failed)';
                container.style.color = '#ff00ff';
                container.style.fontSize = '0.8rem';
            }
        } else {
            console.warn('AudioMotionAnalyzer not loaded');
            elements.visualizerContainer.textContent = 'Recording...';
            elements.visualizerContainer.style.color = '#ff00ff';
            elements.visualizerContainer.style.fontSize = '0.8rem';
            elements.visualizerContainer.style.display = 'flex';
            elements.visualizerContainer.style.alignItems = 'center';
            elements.visualizerContainer.style.justifyContent = 'center';
        }

        // Setup Timer
        voiceState.startTime = Date.now();
        voiceState.timerInterval = setInterval(updateTimer, 1000);
        updateTimer(); // Initial call

    } catch (error) {
        console.error('Error accessing microphone:', error);
        alert('Could not access microphone. Please check permissions.');
    }
}

function stopVoiceRecording() {
    if (voiceState.mediaRecorder && voiceState.isRecording) {
        voiceState.mediaRecorder.stop();
        voiceState.isRecording = false;

        // Stop Speech Recognition
        if (voiceState.recognition) {
            voiceState.recognition.stop();
        }

        // UI Updates
        elements.voiceButton.classList.remove('recording');
        elements.voiceButton.title = 'Voice message';
        // Restore microphone icon
        elements.voiceButton.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                <path d="M19 10v2a7 7 0 01-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
        `;

        elements.recordingUI.style.display = 'none';

        // Update transcript preview
        if (elements.previewTranscript) {
            elements.previewTranscript.textContent = voiceState.transcript.trim() || '(No speech detected)';
        }

        // Stop Visualizer
        if (voiceState.audioMotion) {
            voiceState.audioMotion.disconnectInput();
            // Don't destroy immediately to avoid errors if it's still processing
        }

        // Stop Timer
        if (voiceState.timerInterval) {
            clearInterval(voiceState.timerInterval);
        }
        elements.recordingTimer.textContent = "00:00";
    }
}

function updateTimer() {
    const elapsed = Math.floor((Date.now() - voiceState.startTime) / 1000);
    const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
    const seconds = (elapsed % 60).toString().padStart(2, '0');
    elements.recordingTimer.textContent = `🔴 ${minutes}:${seconds}`;
}

// Voice Preview Functions
function playPreview() {
    if (!voiceState.previewAudio) return;

    if (voiceState.previewAudio.paused) {
        voiceState.previewAudio.play().catch(e => console.error("Playback failed:", e));
        elements.voicePreview.classList.add('playing');
        elements.previewPlayButton.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="6" y="4" width="4" height="16"></rect>
                <rect x="14" y="4" width="4" height="16"></rect>
            </svg>
        `;
    } else {
        voiceState.previewAudio.pause();
        elements.voicePreview.classList.remove('playing');
        elements.previewPlayButton.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
        `;
    }
}

function discardRecording() {
    if (voiceState.previewAudio) {
        voiceState.previewAudio.pause();
        voiceState.previewAudio.currentTime = 0;
    }

    // Reset UI
    elements.voicePreview.classList.remove('playing');
    elements.voicePreview.style.display = 'none';
    elements.messageInput.style.display = 'block';
    elements.voiceButton.style.display = 'flex';

    // Reset play button icon
    elements.previewPlayButton.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
        </svg>
    `;

    // Clear data
    voiceState.currentAudioBlob = null;
    voiceState.transcript = '';
    if (voiceState.currentAudioUrl) {
        URL.revokeObjectURL(voiceState.currentAudioUrl);
        voiceState.currentAudioUrl = null;
    }
}

function confirmRecording() {
    // Use the transcribed text if available
    const transcript = voiceState.transcript.trim();
    console.log("Confirming recording with transcript:", transcript);

    if (transcript) {
        elements.messageInput.value = (elements.messageInput.value ? elements.messageInput.value + ' ' : '') + transcript;

        // Reset UI
        discardRecording();

        // Focus input so user can edit or send
        elements.messageInput.focus();
        autoResizeTextarea();
    } else {
        // Fallback if no speech was detected
        alert("No speech was detected. Please try speaking clearly into the microphone.");
        // Do not discard automatically so they can try to play it back to verify
    }
}

// ============================================
// Message Handling
// ============================================
async function handleSendMessage() {
    const message = elements.messageInput.value.trim();

    if (!message || state.isGenerating) return;

    // Clear input
    elements.messageInput.value = '';
    autoResizeTextarea();

    // Hide welcome message
    const welcomeMessage = document.querySelector('.welcome-message');
    if (welcomeMessage) {
        welcomeMessage.remove();
    }

    // Add user message
    addMessage({
        role: 'user',
        content: message,
    });

    // Perform web search if enabled
    let searchResults = null;
    if (CONFIG.webSearchEnabled) {
        try {
            searchResults = await performWebSearch(message);
            if (searchResults && searchResults.results && searchResults.results.length > 0) {
                displaySearchResults(searchResults);
            }
        } catch (error) {
            console.error('Web search failed:', error);
        }
    }

    // Show loading indicator
    const loadingElement = showLoadingIndicator();

    // Set generating state
    state.isGenerating = true;
    elements.sendButton.disabled = true;

    try {
        await sendToOllama(message, loadingElement, searchResults);
    } catch (error) {
        console.error('Error sending message:', error);
        removeLoadingIndicator(loadingElement);
        showErrorMessage('Failed to get response from Ollama. Please check if Ollama is running.');
        updateConnectionStatus(false);
    } finally {
        state.isGenerating = false;
        elements.sendButton.disabled = false;
    }
}

function addMessage(message) {
    state.messages.push(message);
    saveMessagesToStorage();
    renderMessage(message);
}

function renderMessage(message) {
    const messageEl = document.createElement('div');
    messageEl.className = `message ${message.role}`;

    const avatarEl = document.createElement('div');
    avatarEl.className = 'message-avatar';

    if (message.role === 'assistant') {
        avatarEl.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" fill="url(#avatarGradient)"/>
                <defs>
                    <linearGradient id="avatarGradient" x1="4" y1="4" x2="20" y2="20">
                        <stop offset="0%" stop-color="#667eea" />
                        <stop offset="100%" stop-color="#764ba2" />
                    </linearGradient>
                </defs>
            </svg>
        `;
    } else {
        avatarEl.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" fill="#e2e8f0"/>
                <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="#64748b"/>
            </svg>
        `;
    }

    const contentEl = document.createElement('div');
    contentEl.className = 'message-content';

    // Parse markdown
    contentEl.innerHTML = marked.parse(message.content);

    messageEl.appendChild(avatarEl);
    messageEl.appendChild(contentEl);

    elements.chatMessages.appendChild(messageEl);
    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
}

function showLoadingIndicator() {
    const template = elements.loadingTemplate.content.cloneNode(true);
    const loadingElement = template.querySelector('.message');
    elements.chatMessages.appendChild(loadingElement);
    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
    return loadingElement;
}

function removeLoadingIndicator(element) {
    if (element && element.parentNode) {
        element.remove();
    }
}

function showErrorMessage(text) {
    const errorEl = document.createElement('div');
    errorEl.className = 'error-message';
    errorEl.textContent = text;
    elements.chatMessages.appendChild(errorEl);
    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;

    setTimeout(() => {
        errorEl.remove();
    }, 5000);
}

// ============================================
// Ollama API Integration
// ============================================
async function checkConnection() {
    try {
        const response = await fetch(`${CONFIG.ollamaHost}/api/tags`);
        if (response.ok) {
            updateConnectionStatus(true);
        } else {
            updateConnectionStatus(false);
        }
    } catch (error) {
        updateConnectionStatus(false);
    }
}

function updateConnectionStatus(isConnected) {
    const dot = elements.connectionStatus.querySelector('.status-dot');
    const text = elements.connectionStatus.querySelector('.status-text');

    if (isConnected) {
        dot.style.backgroundColor = '#10b981';
        text.textContent = 'Connected';
    } else {
        dot.style.backgroundColor = '#ef4444';
        text.textContent = 'Disconnected';
    }
}

async function sendToOllama(prompt, loadingElement, searchResults = null) {
    let fullPrompt = prompt;

    // Append search results to prompt if available
    if (searchResults && searchResults.results && searchResults.results.length > 0) {
        const context = searchResults.results.map(r => `Title: ${r.title}\nSnippet: ${r.body}\nURL: ${r.href}`).join('\n\n');
        fullPrompt = `Context from web search:\n${context}\n\nUser Query: ${prompt}\n\nPlease answer the user's query using the provided context if relevant.`;
    }

    const response = await fetch(`${CONFIG.ollamaHost}/api/generate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: CONFIG.model,
            prompt: fullPrompt,
            stream: true
        })
    });

    if (!response.ok) {
        throw new Error('Network response was not ok');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let assistantMessage = { role: 'assistant', content: '' };

    // Replace loading indicator with empty message
    removeLoadingIndicator(loadingElement);
    addMessage(assistantMessage);

    // Get the last message element (the one we just added)
    const messageEls = elements.chatMessages.querySelectorAll('.message.assistant');
    const lastMessageEl = messageEls[messageEls.length - 1];
    const contentEl = lastMessageEl.querySelector('.message-content');

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
            if (!line) continue;
            try {
                const json = JSON.parse(line);
                if (json.response) {
                    assistantMessage.content += json.response;
                    contentEl.innerHTML = marked.parse(assistantMessage.content);
                    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
                }
            } catch (e) {
                console.error('Error parsing JSON chunk', e);
            }
        }
    }

    // Save updated history
    saveMessagesToStorage();
}

// ============================================
// Web Search Mock (Replace with actual API)
// ============================================
async function performWebSearch(query) {
    console.log(`Searching web for: ${query}`);
    // In a real app, you would call a search API here (e.g., DuckDuckGo, Google, Bing)
    // For this demo, we'll return mock results or use a free API if available

    // Mock results for demonstration
    return {
        results: [
            {
                title: `Search result for ${query}`,
                body: `This is a simulated search result for "${query}". In a production environment, you would integrate with a real search API like DuckDuckGo, Bing, or Google Custom Search.`,
                href: 'https://example.com'
            }
        ]
    };
}

function displaySearchResults(results) {
    const searchInfo = document.createElement('div');
    searchInfo.className = 'search-results-info';
    searchInfo.innerHTML = `
        <div class="search-header">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="M21 21l-4.35-4.35"></path>
            </svg>
            <span>Used ${results.results.length} search results</span>
        </div>
    `;
    elements.chatMessages.appendChild(searchInfo);
}

// ============================================
// Storage
// ============================================
function saveMessagesToStorage() {
    localStorage.setItem('ollama_chat_history', JSON.stringify(state.messages));
}

function loadMessages() {
    const saved = localStorage.getItem('ollama_chat_history');
    if (saved) {
        try {
            state.messages = JSON.parse(saved);
            state.messages.forEach(msg => renderMessage(msg));
        } catch (e) {
            console.error('Error loading history', e);
        }
    }
}

function clearChat() {
    if (confirm('Are you sure you want to clear the chat history?')) {
        state.messages = [];
        localStorage.removeItem('ollama_chat_history');
        elements.chatMessages.innerHTML = '';

        // Show welcome message again
        const welcomeHTML = `
            <div class="welcome-message">
                <div class="welcome-icon">
                    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="32" cy="32" r="28" fill="url(#welcomeGradient)" opacity="0.1" />
                        <path d="M32 16L40 24L32 32L24 24L32 16Z" fill="url(#welcomeGradient)" />
                        <path d="M32 32L40 40L32 48L24 40L32 32Z" fill="url(#welcomeGradient)" opacity="0.7" />
                        <defs>
                            <linearGradient id="welcomeGradient" x1="16" y1="16" x2="48" y2="48">
                                <stop offset="0%" stop-color="#667eea" />
                                <stop offset="100%" stop-color="#764ba2" />
                            </linearGradient>
                        </defs>
                    </svg>
                </div>
                <h2>Welcome to Ollama WebUI</h2>
                <p>Start a conversation with your AI assistant. I'm running locally on your machine using the <strong>gemma3:4b</strong> model.</p>
                <div class="example-prompts">
                    <button class="example-prompt" data-prompt="Hello! Can you introduce yourself?">👋 Introduce yourself</button>
                    <button class="example-prompt" data-prompt="What are your capabilities as an AI assistant?">🤖 Your capabilities</button>
                    <button class="example-prompt" data-prompt="Write a creative story about space exploration">✨ Creative story</button>
                    <button class="example-prompt" data-prompt="Explain quantum computing in simple terms">🔬 Explain a concept</button>
                </div>
            </div>
        `;
        elements.chatMessages.innerHTML = welcomeHTML;

        // Re-attach listeners to new example prompts
        document.querySelectorAll('.example-prompt').forEach(button => {
            button.addEventListener('click', () => {
                const prompt = button.getAttribute('data-prompt');
                elements.messageInput.value = prompt;
                elements.messageInput.focus();
                handleSendMessage();
            });
        });
    }
}
