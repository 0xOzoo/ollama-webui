// Notification System
const NotificationSystem = {
    container: null,
    init() {
        this.container = document.getElementById('notificationContainer');
        if (!this.container) {
            console.error('Notification container not found');
        }
    },
    show(type, title, message, duration = 5000) {
        if (!this.container) this.init();
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        // Icon SVG based on type
        const icons = {
            success: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
            error: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
            info: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>',
            warning: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>'
        };
        notification.innerHTML = `
            <div class="notification-icon">${icons[type] || icons.info}</div>
            <div class="notification-content">
                <div class="notification-title">${title}</div>
                ${message ? `<div class="notification-message">${message}</div>` : ''}
            </div>
            <button class="notification-close">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        `;
        // Close button handler
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => this.hide(notification));
        // Add to container
        this.container.appendChild(notification);
        // Auto-dismiss
        if (duration > 0) {
            setTimeout(() => this.hide(notification), duration);
        }
        return notification;
    },
    hide(notification) {
        notification.classList.add('hiding');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    },
    success(title, message, duration) {
        return this.show('success', title, message, duration);
    },
    error(title, message, duration) {
        return this.show('error', title, message, duration);
    },
    info(title, message, duration) {
        return this.show('info', title, message, duration);
    },
    warning(title, message, duration) {
        return this.show('warning', title, message, duration);
    }
};
// Configure Marked.js with Highlight.js and Custom Renderer
const renderer = new marked.Renderer();

renderer.code = function (code, language) {
    // Handle both old and new marked.js API
    let codeText = '';
    let lang = '';

    if (typeof code === 'object' && code !== null) {
        codeText = code.text || code.raw || '';
        lang = code.lang || language || '';
    } else {
        codeText = String(code || '');
        lang = language || '';
    }

    let validLanguage = 'plaintext';
    let highlightedCode = codeText;

    // Check if hljs is available
    if (typeof hljs !== 'undefined') {
        validLanguage = hljs.getLanguage(lang) ? lang : 'plaintext';
        try {
            highlightedCode = hljs.highlight(codeText, { language: validLanguage }).value;
        } catch (e) {
            console.error('Highlight.js error:', e);
            // Fallback to simple escaping
            highlightedCode = codeText.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
        }
    } else {
        // Fallback if hljs is not loaded
        highlightedCode = codeText.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
    }

    // Split lines for line numbering
    const lines = highlightedCode.split('\n');
    const lineNumbers = lines.map((_, i) => `<span class="line-number">${i + 1}</span>`).join('\n');

    // Generate a unique ID for the copy button
    const uniqueId = 'code-' + Math.random().toString(36).substr(2, 9);

    return `
    <div class="code-block-container">
        <div class="code-block-header">
            <span class="code-language">${validLanguage}</span>
            <button class="copy-code-btn" onclick="window.copyCode('${uniqueId}', this)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                Copy
            </button>
        </div>
        <div class="code-block-content">
            <div class="line-numbers" aria-hidden="true">${lineNumbers}</div>
            <pre><code id="${uniqueId}" class="hljs language-${validLanguage}">${highlightedCode}</code></pre>
        </div>
    </div>
    `;
};

marked.setOptions({
    renderer: renderer,
    highlight: function (code, lang) {
        if (typeof hljs !== 'undefined') {
            const language = hljs.getLanguage(lang) ? lang : 'plaintext';
            return hljs.highlight(code, { language }).value;
        }
        return code;
    },
    langPrefix: 'hljs language-',
    breaks: true,
    gfm: true
});

// Global Copy Code Function
window.copyCode = function (elementId, button) {
    const codeElement = document.getElementById(elementId);
    if (!codeElement) return;

    const code = codeElement.innerText;
    navigator.clipboard.writeText(code).then(() => {
        // Visual feedback
        const originalHtml = button.innerHTML;
        button.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            Copied!
        `;
        button.classList.add('active');

        setTimeout(() => {
            button.innerHTML = originalHtml;
            button.classList.remove('active');
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy code:', err);
        button.innerText = 'Error';
    });
};

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    NotificationSystem.init();
    init();
    initTTSSettings();
});
// Example usage for model operations:
/*
// Model download success
NotificationSystem.success(
    'Model Downloaded',
    'llama2:7b has been successfully downloaded and is ready to use.'
);
// Model download error
NotificationSystem.error(
    'Download Failed',
    'Failed to download llama2:7b. Please check your connection and try again.'
);
// Model switched
NotificationSystem.info(
    'Model Switched',
    'Now using gemma3:4b for conversations.'
);
// Model loading
NotificationSystem.info(
    'Loading Model',
    'Please wait while we load the selected model...',
    0  // No auto-dismiss
);
// Model error during use
NotificationSystem.error(
    'Model Error',
    'The model encountered an error. Please try again or switch to a different model.'
);
*/


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
    webSearchEnabled: false,
    ollamaApiKey: '8c09136495174857951075d1f4e9fa09.YUehTySxFxVGvDt_2XQSsar4'
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
    inputRow: null, // New
    recordingUI: null,
    stopRecordingButton: null, // New
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

    // New Input Row
    elements.inputRow = document.querySelector('.input-row');

    // Voice UI Elements
    elements.recordingUI = document.getElementById('recordingUI');
    elements.stopRecordingButton = document.getElementById('stopRecordingButton');
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

    // Initialize Settings
    initSettings();

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
    elements.voiceButton.addEventListener('click', startVoiceRecording);
    if (elements.stopRecordingButton) {
        elements.stopRecordingButton.addEventListener('click', stopVoiceRecording);
    }

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
        if (elements.inputRow) elements.inputRow.style.display = 'none';
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
        elements.recordingUI.style.display = 'none';
        // Note: We don't show inputRow yet, because we transition to preview mode
        // The 'stop' event listener on mediaRecorder handles showing the preview
        // If we wanted to go straight back to input, we'd do it here, but preview is better.

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

    if (elements.inputRow) {
        elements.inputRow.style.display = 'flex';
    } else {
        // Fallback for safety
        elements.messageInput.style.display = 'block';
        elements.voiceButton.style.display = 'flex';
    }

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



function loadMessages() {
    const saved = localStorage.getItem('ollama_chat_history');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) {
                state.messages = parsed;
                state.messages.forEach(msg => renderMessage(msg));
            } else {
                console.warn('Saved messages format invalid, resetting.');
                localStorage.removeItem('ollama_chat_history');
            }
        } catch (e) {
            console.error('Failed to load messages:', e);
            localStorage.removeItem('ollama_chat_history');
        }
    }
}

function saveMessagesToStorage() {
    localStorage.setItem('ollama_chat_history', JSON.stringify(state.messages));
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
    try {
        addMessage({
            role: 'user',
            content: message,
        });
    } catch (e) {
        console.error("Error adding message:", e);
        alert("Error sending message: " + e.message);
        return;
    }

    // Perform web search if enabled
    let searchResults = null;
    if (CONFIG.webSearchEnabled && typeof performWebSearch === 'function') {
        try {
            searchResults = await performWebSearch(message);
            if (searchResults && searchResults.results && searchResults.results.length > 0) {
                if (typeof displaySearchResults === 'function') {
                    displaySearchResults(searchResults);
                }
            }
        } catch (error) {
            console.error('Web search failed:', error);
        }
    }

    // Detect and display cryptocurrency charts
    if (typeof detectCrypto === 'function') {
        const cryptoData = detectCrypto(message);
        if (cryptoData.detected && cryptoData.tradingViewSymbols.length > 0) {
            displayCryptoCharts(cryptoData);
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

    // Avatar
    const avatarEl = document.createElement('div');
    avatarEl.className = 'message-avatar';

    if (message.role === 'assistant') {
        avatarEl.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z" fill="white" fill-opacity="0.9"/>
            </svg>
        `;
    } else {
        avatarEl.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-user">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
            </svg>
        `;
        avatarEl.style.color = '#a0a0b0';
    }

    // Content Container
    const contentEl = document.createElement('div');
    contentEl.className = 'message-content';

    // Text Content
    const textContentEl = document.createElement('div');
    textContentEl.className = 'message-text';
    contentEl.appendChild(textContentEl);

    // Process message for media embeds
    if (typeof processMessageWithMedia === 'function') {
        const processed = processMessageWithMedia(message.content);

        // Add text content if present
        if (processed.text && processed.text.trim()) {
            const textDiv = document.createElement('div');
            if (typeof marked !== 'undefined') {
                textDiv.innerHTML = marked.parse(processed.text);
            } else {
                textDiv.textContent = processed.text;
                console.warn('Marked library not found, using plain text');
            }
            textContentEl.appendChild(textDiv);
        }

        // Add media embeds
        if (processed.embeds && processed.embeds.length > 0) {
            processed.embeds.forEach(embedHTML => {
                const embedContainer = document.createElement('div');
                embedContainer.innerHTML = embedHTML;
                textContentEl.appendChild(embedContainer.firstChild);
            });
        }
    } else {
        // Fallback if media-embeds.js not loaded
        if (typeof marked !== 'undefined') {
            textContentEl.innerHTML = marked.parse(message.content);
        } else {
            textContentEl.textContent = message.content;
            console.warn('Marked library not found, using plain text');
        }
    }

    // Message Actions (Assistant Only)
    if (message.role === 'assistant') {
        const actionsEl = document.createElement('div');
        actionsEl.className = 'message-actions';

        // Copy Button
        const copyButton = document.createElement('button');
        copyButton.className = 'btn-action btn-copy';
        copyButton.title = 'Copy text';
        copyButton.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
        `;

        copyButton.addEventListener('click', () => {
            const currentText = message.content || textContentEl.innerText;
            navigator.clipboard.writeText(currentText).then(() => {
                const originalIcon = copyButton.innerHTML;
                copyButton.innerHTML = `
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                `;
                copyButton.classList.add('active');
                setTimeout(() => {
                    copyButton.innerHTML = originalIcon;
                    copyButton.classList.remove('active');
                }, 2000);
            });
        });
        actionsEl.appendChild(copyButton);

        // TTS Button
        const ttsButton = document.createElement('button');
        ttsButton.className = 'btn-action btn-tts';
        ttsButton.title = 'Read aloud';
        ttsButton.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
            </svg>
        `;

        ttsButton.addEventListener('click', () => {
            const currentText = message.content || textContentEl.innerText;
            speakMessage(currentText, ttsButton);
        });
        actionsEl.appendChild(ttsButton);

        // Append actions to content bubble
        contentEl.appendChild(actionsEl);
    }

    // Assemble Message
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

    // Replace loading indicator with empty message
    removeLoadingIndicator(loadingElement);

    const assistantMessage = {
        role: 'assistant',
        content: ''
    };
    addMessage(assistantMessage);

    // Get the last message element (the one we just added)
    const messageEls = elements.chatMessages.querySelectorAll('.message.assistant');
    const lastMessageEl = messageEls[messageEls.length - 1];
    const textContentEl = lastMessageEl.querySelector('.message-text');

    try {
        const response = await fetch(`${CONFIG.ollamaHost}/api/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: CONFIG.model,
                prompt: fullPrompt,
                stream: true
            }),
        });

        if (!response.ok) throw new Error('Ollama API error');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

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
                        // Update the message in state.messages
                        const lastMessage = state.messages[state.messages.length - 1];
                        if (lastMessage && lastMessage.role === 'assistant') {
                            lastMessage.content = assistantMessage.content;
                        }

                        // Use marked if available, otherwise plain text
                        if (typeof marked !== 'undefined') {
                            textContentEl.innerHTML = marked.parse(assistantMessage.content);
                        } else {
                            textContentEl.textContent = assistantMessage.content;
                        }

                        elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
                    }
                } catch (e) {
                    console.error('Error parsing JSON chunk', e);
                }
            }
        }

        // Save messages after streaming is complete
        saveMessagesToStorage();
        console.log('Message streaming complete, saved to storage');

    } catch (error) {
        console.error('Error in sendToOllama:', error);
        showErrorMessage('Failed to communicate with Ollama. Please ensure it is running.');
        updateConnectionStatus(false);
    }
}

function clearChat() {
    console.log('clearChat function called');

    // Clear immediately without confirmation (browser was blocking the dialog)
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

    console.log('Chat cleared successfully');
}

// ============================================
// Cryptocurrency Chart Display
// ============================================

/**
 * Display cryptocurrency charts for detected symbols
 * @param {Object} cryptoData - Crypto detection data from detectCrypto()
 */
function displayCryptoCharts(cryptoData) {
    console.log('Displaying crypto charts for:', cryptoData);

    // Create container for all charts
    const chartsContainer = document.createElement('div');
    chartsContainer.className = 'crypto-charts-wrapper';

    // Display each detected symbol
    cryptoData.tradingViewSymbols.forEach((symbol, index) => {
        if (index >= 3) return; // Limit to 3 charts max

        // Create chart container
        const chartContainer = document.createElement('div');
        chartContainer.className = 'crypto-chart-container';

        // Create header
        const header = document.createElement('div');
        header.className = 'crypto-chart-header';
        header.innerHTML = `
            <span class="crypto-symbol">${symbol}</span>
            <span class="crypto-source">TradingView</span>
        `;
        chartContainer.appendChild(header);

        // Create widget container with unique ID
        const widgetId = `tradingview_${symbol}_${Date.now()}_${index}`;
        const widgetContainer = document.createElement('div');
        widgetContainer.id = widgetId;
        widgetContainer.className = 'tradingview-widget-container';
        widgetContainer.style.height = '400px';
        chartContainer.appendChild(widgetContainer);

        chartsContainer.appendChild(chartContainer);

        // Initialize TradingView widget after a short delay to ensure DOM is ready
        setTimeout(() => {
            if (typeof TradingView !== 'undefined') {
                new TradingView.widget({
                    "autosize": true,
                    "symbol": `BINANCE:${symbol}`,
                    "interval": "D",
                    "timezone": "Etc/UTC",
                    "theme": "dark",
                    "style": "1",
                    "locale": "en",
                    "toolbar_bg": "#1e1e28",
                    "enable_publishing": false,
                    "allow_symbol_change": true,
                    "container_id": widgetId,
                    "height": 400,
                    "width": "100%"
                });
            } else {
                console.error('TradingView library not loaded');
                widgetContainer.innerHTML = '<p style="color: #ef4444; padding: 20px; text-align: center;">TradingView library failed to load. Please refresh the page.</p>';
            }
        }, 100);
    });

    // Append to chat messages
    elements.chatMessages.appendChild(chartsContainer);
    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
}

// ============================================
// Text-to-Speech
// ============================================

let currentSpeech = null;
let currentTTSButton = null;
// TTS Configuration object
const TTSConfig = {
    speed: 1.0,
    volume: 0.8,
    voiceURI: null,

    load() {
        const saved = localStorage.getItem('ttsSettings');
        if (saved) {
            const settings = JSON.parse(saved);
            this.speed = settings.speed || 1.0;
            this.volume = settings.volume || 0.8;
            this.voiceURI = settings.voiceURI || null;
        }
    },

    save() {
        localStorage.setItem('ttsSettings', JSON.stringify({
            speed: this.speed,
            volume: this.volume,
            voiceURI: this.voiceURI
        }));
    }
};

function initTTSSettings() {
    TTSConfig.load();

    const ttsSpeedSlider = document.getElementById('ttsSpeed');
    const ttsSpeedValue = document.getElementById('ttsSpeedValue');
    const ttsVolumeSlider = document.getElementById('ttsVolume');
    const ttsVolumeValue = document.getElementById('ttsVolumeValue');
    const ttsVoiceSelect = document.getElementById('ttsVoice');
    const previewButton = document.getElementById('previewVoice');

    if (!ttsSpeedSlider || !ttsVolumeSlider || !ttsVoiceSelect) {
        console.warn('TTS controls not found in DOM');
        return;
    }

    // Initialize values
    ttsSpeedSlider.value = TTSConfig.speed;
    ttsSpeedValue.textContent = TTSConfig.speed.toFixed(1) + 'x';
    ttsVolumeSlider.value = TTSConfig.volume * 100;
    ttsVolumeValue.textContent = Math.round(TTSConfig.volume * 100) + '%';

    // Populate voices
    function populateVoices() {
        const voices = window.speechSynthesis.getVoices();
        ttsVoiceSelect.innerHTML = '';

        if (voices.length === 0) {
            const option = document.createElement('option');
            option.textContent = "Aucune voix disponible";
            ttsVoiceSelect.appendChild(option);
            return;
        }

        voices.forEach(voice => {
            const option = document.createElement('option');
            option.value = voice.voiceURI;
            option.textContent = `${voice.name} (${voice.lang})`;
            if (voice.voiceURI === TTSConfig.voiceURI) {
                option.selected = true;
            }
            ttsVoiceSelect.appendChild(option);
        });

        // If no voice selected or saved voice not found, select the first one
        if (!TTSConfig.voiceURI || !voices.find(v => v.voiceURI === TTSConfig.voiceURI)) {
            if (voices.length > 0) {
                TTSConfig.voiceURI = voices[0].voiceURI;
                ttsVoiceSelect.value = voices[0].voiceURI;
                TTSConfig.save();
            }
        }
    }

    populateVoices();
    if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = populateVoices;
    }

    // Event Listeners
    ttsSpeedSlider.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        TTSConfig.speed = value;
        ttsSpeedValue.textContent = value.toFixed(1) + 'x';
        TTSConfig.save();
    });

    ttsVolumeSlider.addEventListener('input', (e) => {
        const value = parseInt(e.target.value) / 100;
        TTSConfig.volume = value;
        ttsVolumeValue.textContent = Math.round(value * 100) + '%';
        TTSConfig.save();
    });

    ttsVoiceSelect.addEventListener('change', (e) => {
        TTSConfig.voiceURI = e.target.value;
        TTSConfig.save();
    });

    if (previewButton) {
        previewButton.style.display = 'flex'; // Show the button
        previewButton.addEventListener('click', () => {
            const text = "Ceci est un test de voix pour l'assistant Ollama.";
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = TTSConfig.speed;
            utterance.volume = TTSConfig.volume;

            const voices = window.speechSynthesis.getVoices();
            const selectedVoice = voices.find(v => v.voiceURI === TTSConfig.voiceURI);
            if (selectedVoice) {
                utterance.voice = selectedVoice;
            }

            window.speechSynthesis.cancel(); // Stop any current speech
            window.speechSynthesis.speak(utterance);
        });
    }

    console.log('TTS settings initialized:', TTSConfig);
}

/**
 * Speak a message using Web Speech API
 * @param {string} text - Text to speak
 * @param {HTMLElement} button - The TTS button element
 */
function speakMessage(text, button) {
    // Check if speech synthesis is supported
    if (!('speechSynthesis' in window)) {
        alert('Text-to-speech is not supported in your browser.');
        return;
    }

    // If currently speaking, stop
    if (currentSpeech && window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        if (currentTTSButton) {
            currentTTSButton.classList.remove('speaking');
        }
        currentSpeech = null;
        currentTTSButton = null;
        return;
    }

    // Strip markdown, HTML, and Emojis from text
    const cleanText = text
        .replace(/```[\s\S]*?```/g, '') // Remove code blocks
        .replace(/`[^`]+`/g, '') // Remove inline code
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links, keep text
        .replace(/<[^>]+>/g, '') // Remove HTML tags
        .replace(/[#*_~]/g, '') // Remove markdown formatting
        .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '') // Remove Emojis
        .trim();

    if (!cleanText) {
        console.warn('No text to speak');
        return;
    }

    // Create speech utterance
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = TTSConfig.speed;
    utterance.volume = TTSConfig.volume;
    utterance.pitch = 1.0;

    // Use preferred voice based on selection
    const voices = window.speechSynthesis.getVoices();
    const selectedVoice = voices.find(v => v.voiceURI === TTSConfig.voiceURI);
    if (selectedVoice) {
        utterance.voice = selectedVoice;
        console.log('Using voice:', selectedVoice.name);
    }

    // Update button state
    button.classList.add('speaking');
    currentTTSButton = button;
    currentSpeech = utterance;

    // Handle speech end
    utterance.onend = () => {
        button.classList.remove('speaking');
        currentSpeech = null;
        currentTTSButton = null;
    };

    // Handle errors
    utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        button.classList.remove('speaking');
        currentSpeech = null;
        currentTTSButton = null;
    };

    // Speak
    window.speechSynthesis.speak(utterance);
}

// ============================================
// Settings & Translations
// ============================================

const translations = {
    en: {
        settingsTitle: "Settings",
        displayTitle: "Display",
        languageLabel: "Language",
        themeLabel: "Theme",
        darkLabel: "Dark",
        lightLabel: "Light",
        voiceTitle: "Voice Recognition",
        micLabel: "Microphone",
        voiceLangLabel: "Recognition Language",
        ollamaTitle: "Ollama",
        modelLabel: "Model",
        pullModelLabel: "Pull New Model",
        pullBtn: "Pull",
        pulling: "Pulling...",
        success: "Success!",
        error: "Error",
        welcomeTitle: "Welcome to Ollama WebUI",
        welcomeText: "Start a conversation with your AI assistant. I'm running locally on your machine using the",
        example1: "👋 Introduce yourself",
        example2: "🤖 Your capabilities",
        example3: "✨ Creative story",
        example4: "🔬 Explain a concept",
        inputPlaceholder: "Message Gemma...",
        webSearchOn: "Web Search: On",
        webSearchOff: "Web Search: Off",
        clearChat: "Clear chat",
        attachFile: "Attach file",
        voiceMessage: "Voice message",
        sendMessage: "Send message",
        stopRecording: "Stop Recording",
        playPause: "Play/Pause",
        discard: "Discard",
        send: "Send"
    },
    fr: {
        settingsTitle: "Paramètres",
        displayTitle: "Affichage",
        languageLabel: "Langue",
        themeLabel: "Thème",
        darkLabel: "Sombre",
        lightLabel: "Clair",
        voiceTitle: "Reconnaissance Vocale",
        micLabel: "Microphone",
        voiceLangLabel: "Langue de reconnaissance",
        ollamaTitle: "Ollama",
        modelLabel: "Modèle",
        pullModelLabel: "Télécharger un modèle",
        pullBtn: "Télécharger",
        pulling: "Téléchargement...",
        success: "Succès !",
        error: "Erreur",
        welcomeTitle: "Bienvenue sur Ollama WebUI",
        welcomeText: "Commencez une conversation avec votre assistant IA. Je fonctionne localement sur votre machine avec le modèle",
        example1: "👋 Présente-toi",
        example2: "🤖 Tes capacités",
        example3: "✨ Histoire créative",
        example4: "🔬 Explique un concept",
        inputPlaceholder: "Envoyez un message...",
        webSearchOn: "Recherche Web : Activée",
        webSearchOff: "Recherche Web : Désactivée",
        clearChat: "Effacer la discussion",
        attachFile: "Joindre un fichier",
        voiceMessage: "Message vocal",
        sendMessage: "Envoyer",
        stopRecording: "Arrêter l'enregistrement",
        playPause: "Lecture/Pause",
        discard: "Annuler",
        send: "Envoyer"
    }
};

function initSettings() {
    // State
    state.settings = {
        language: localStorage.getItem('ollama_lang') || 'en',
        theme: localStorage.getItem('ollama_theme') || 'dark',
        voiceLang: localStorage.getItem('ollama_voice_lang') || 'en-US'
    };

    // Elements
    elements.settingsButton = document.getElementById('settingsButton');
    elements.settingsModal = document.getElementById('settingsModal');
    elements.closeSettings = document.getElementById('closeSettings');
    elements.appLanguage = document.getElementById('appLanguage');
    elements.themeDark = document.getElementById('themeDark');
    elements.themeLight = document.getElementById('themeLight');
    elements.settingsMicSelect = document.getElementById('settingsMicSelect');
    elements.settingsVoiceLang = document.getElementById('settingsVoiceLang');
    elements.settingsModelSelect = document.getElementById('settingsModelSelect');
    elements.refreshModels = document.getElementById('refreshModels');
    elements.pullModelSelect = document.getElementById('pullModelSelect');
    elements.pullModelBtn = document.getElementById('pullModelBtn');
    elements.pullProgress = document.getElementById('pullProgress');

    // Initialize UI
    applyTheme(state.settings.theme);
    applyLanguage(state.settings.language);
    elements.appLanguage.value = state.settings.language;
    elements.settingsVoiceLang.value = state.settings.voiceLang;

    // Event Listeners
    elements.settingsButton.addEventListener('click', () => {
        elements.settingsModal.style.display = 'flex';
        setTimeout(() => elements.settingsModal.classList.add('active'), 10);
        loadOllamaModels();
        loadAvailableModels();
        populateMicSelect();
    });

    elements.closeSettings.addEventListener('click', () => {
        elements.settingsModal.classList.remove('active');
        setTimeout(() => elements.settingsModal.style.display = 'none', 300);
    });

    elements.settingsModal.addEventListener('click', (e) => {
        if (e.target === elements.settingsModal) {
            elements.closeSettings.click();
        }
    });

    elements.appLanguage.addEventListener('change', (e) => {
        const lang = e.target.value;
        state.settings.language = lang;
        localStorage.setItem('ollama_lang', lang);
        applyLanguage(lang);
    });

    elements.themeDark.addEventListener('click', () => applyTheme('dark'));
    elements.themeLight.addEventListener('click', () => applyTheme('light'));

    elements.settingsVoiceLang.addEventListener('change', (e) => {
        state.settings.voiceLang = e.target.value;
        localStorage.setItem('ollama_voice_lang', e.target.value);
        if (voiceState.recognition) {
            voiceState.recognition.lang = state.settings.voiceLang;
        }
    });

    elements.settingsMicSelect.addEventListener('change', (e) => {
        // Just update the main mic select which handles the logic
        const mainMicSelect = document.getElementById('micSelect');
        if (mainMicSelect) {
            mainMicSelect.value = e.target.value;
            // Trigger change event if needed, but usually just setting value is enough for next recording
        }
    });

    elements.refreshModels.addEventListener('click', loadOllamaModels);

    elements.settingsModelSelect.addEventListener('change', async (e) => {
        const selectedValue = e.target.value;

        // Check if this is a library model that needs to be pulled
        if (selectedValue.startsWith('pull:')) {
            const modelName = selectedValue.replace('pull:', '');

            // Confirm with user
            if (!confirm(`Do you want to download and install "${modelName}"? This may take several minutes depending on the model size.`)) {
                // Reset selection
                e.target.value = CONFIG.model;
                return;
            }

            // Trigger pull
            elements.pullModelSelect.value = modelName;
            elements.pullModelBtn.click();

            // Reset selection to current model
            e.target.value = CONFIG.model;
            return;
        }

        // Regular model selection
        CONFIG.model = selectedValue;
        document.querySelector('.model-name').textContent = CONFIG.model;
        // Update welcome message model name
        const welcomeP = document.querySelector('.welcome-message p strong');
        if (welcomeP) welcomeP.textContent = CONFIG.model;
    });

    elements.pullModelBtn.addEventListener('click', async () => {
        const modelName = elements.pullModelSelect.value.trim();
        if (!modelName) {
            alert('Please select a model to download');
            return;
        }

        elements.pullModelBtn.disabled = true;
        elements.pullModelBtn.textContent = translations[state.settings.language].pulling;
        elements.pullProgress.style.display = 'block';
        const progressFill = elements.pullProgress.querySelector('.progress-fill');
        const progressText = elements.pullProgress.querySelector('.progress-text');

        try {
            const response = await fetch(`${CONFIG.ollamaHost}/api/pull`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: modelName, stream: true })
            });

            if (!response.ok) throw new Error('Pull failed');

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (!line) continue;
                    try {
                        const json = JSON.parse(line);
                        if (json.total && json.completed) {
                            const percent = Math.round((json.completed / json.total) * 100);
                            progressFill.style.width = `${percent}%`;
                            progressText.textContent = `${percent}%`;
                        }
                    } catch (e) { }
                }
            }

            elements.pullModelBtn.textContent = translations[state.settings.language].success;
            setTimeout(() => {
                elements.pullModelBtn.textContent = translations[state.settings.language].pullBtn;
                elements.pullModelBtn.disabled = false;
                elements.pullProgress.style.display = 'none';
                elements.pullModelSelect.value = '';
                loadOllamaModels(); // Refresh list
                loadAvailableModels(); // Refresh available models
            }, 2000);

        } catch (error) {
            console.error('Pull error:', error);
            elements.pullModelBtn.textContent = translations[state.settings.language].error;
            setTimeout(() => {
                elements.pullModelBtn.textContent = translations[state.settings.language].pullBtn;
                elements.pullModelBtn.disabled = false;
            }, 2000);
        }
    });
}

function applyTheme(theme) {
    state.settings.theme = theme;
    localStorage.setItem('ollama_theme', theme);

    if (theme === 'light') {
        document.body.classList.add('light-mode');
        if (elements.themeLight) elements.themeLight.classList.add('active');
        if (elements.themeDark) elements.themeDark.classList.remove('active');
    } else {
        document.body.classList.remove('light-mode');
        if (elements.themeDark) elements.themeDark.classList.add('active');
        if (elements.themeLight) elements.themeLight.classList.remove('active');
    }
}

function applyLanguage(lang) {
    const t = translations[lang];
    if (!t) return;

    // Update text content for elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (t[key]) el.textContent = t[key];
    });

    // Update placeholders and titles
    if (elements.messageInput) elements.messageInput.placeholder = t.inputPlaceholder;
    if (elements.webSearchToggle) elements.webSearchToggle.title = CONFIG.webSearchEnabled ? t.webSearchOn : t.webSearchOff;
    if (elements.clearChatButton) elements.clearChatButton.title = t.clearChat;
    if (elements.fileButton) elements.fileButton.title = t.attachFile;
    if (elements.voiceButton) elements.voiceButton.title = t.voiceMessage;
    if (elements.sendButton) elements.sendButton.title = t.sendMessage;

    // Update example prompts if welcome message is visible
    const examples = document.querySelectorAll('.example-prompt');
    if (examples.length >= 4) {
        examples[0].textContent = t.example1;
        examples[1].textContent = t.example2;
        examples[2].textContent = t.example3;
        examples[3].textContent = t.example4;
    }
}


async function loadOllamaModels() {
    try {
        if (!elements.settingsModelSelect) return;

        elements.settingsModelSelect.innerHTML = '<option value="">Loading...</option>';

        // Fetch local models
        const localResponse = await fetch(`${CONFIG.ollamaHost}/api/tags`);
        const localModels = localResponse.ok ? (await localResponse.json()).models || [] : [];

        // Fetch library models from Ollama
        let libraryModels = [];
        try {
            const libraryResponse = await fetch('https://ollama.com/api/models');
            if (libraryResponse.ok) {
                const libraryData = await libraryResponse.json();
                libraryModels = libraryData.models || [];
            }
        } catch (error) {
            console.warn('Could not fetch Ollama library models:', error);
        }

        // Clear select
        elements.settingsModelSelect.innerHTML = '';

        // Add local models section
        if (localModels.length > 0) {
            const localGroup = document.createElement('optgroup');
            localGroup.label = '📦 Installed Models';
            localModels.forEach(model => {
                const option = document.createElement('option');
                option.value = model.name;
                option.textContent = model.name;
                if (model.name === CONFIG.model) option.selected = true;
                localGroup.appendChild(option);
            });
            elements.settingsModelSelect.appendChild(localGroup);
        }

        // Add library models section
        if (libraryModels.length > 0) {
            const libraryGroup = document.createElement('optgroup');
            libraryGroup.label = '🌐 Available Models (Pull to Install)';

            // Filter out already installed models and limit to popular ones
            const installedNames = localModels.map(m => m.name.split(':')[0]);
            const popularModels = libraryModels
                .filter(m => !installedNames.includes(m.name))
                .slice(0, 20); // Limit to 20 most popular

            popularModels.forEach(model => {
                const option = document.createElement('option');
                option.value = `pull:${model.name}`;
                option.textContent = `${model.name} (${model.size || 'unknown size'})`;
                option.setAttribute('data-pull', 'true');
                libraryGroup.appendChild(option);
            });

            if (popularModels.length > 0) {
                elements.settingsModelSelect.appendChild(libraryGroup);
            }
        }

        // If no models at all
        if (localModels.length === 0 && libraryModels.length === 0) {
            elements.settingsModelSelect.innerHTML = '<option value="">No models available</option>';
        }

    } catch (error) {
        console.error('Failed to load models:', error);
        if (elements.settingsModelSelect) {
            elements.settingsModelSelect.innerHTML = '<option value="">Error loading models</option>';
        }
    }
}

async function populateMicSelect() {
    try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return;

        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices.filter(device => device.kind === 'audioinput');

        if (!elements.settingsMicSelect) return;

        // Clear and populate
        elements.settingsMicSelect.innerHTML = '';

        audioInputs.forEach((device, index) => {
            const option = document.createElement('option');
            option.value = device.deviceId;
            option.textContent = device.label || `Microphone ${index + 1}`;
            elements.settingsMicSelect.appendChild(option);
        });

        // Set current selection from main mic select if it exists
        const mainMicSelect = document.getElementById('micSelect');
        if (mainMicSelect && mainMicSelect.value) {
            elements.settingsMicSelect.value = mainMicSelect.value;
        }
    } catch (error) {
        console.error('Error enumerating microphones:', error);
    }
}

async function loadAvailableModels() {
    try {
        if (!elements.pullModelSelect) return;

        elements.pullModelSelect.innerHTML = '<option value="">Loading...</option>';

        // Static list of popular Ollama models
        const popularModels = [
            { name: 'llama3.2', size: '2GB', description: 'Latest Llama 3.2' },
            { name: 'llama3.2:1b', size: '1.3GB', description: 'Llama 3.2 1B' },
            { name: 'llama3.1', size: '4.7GB', description: 'Llama 3.1 8B' },
            { name: 'llama3.1:70b', size: '40GB', description: 'Llama 3.1 70B' },
            { name: 'llama3.1:405b', size: '231GB', description: 'Llama 3.1 405B' },
            { name: 'phi3', size: '2.3GB', description: 'Microsoft Phi-3' },
            { name: 'phi3:medium', size: '7.9GB', description: 'Phi-3 Medium' },
            { name: 'gemma2', size: '5.4GB', description: 'Google Gemma 2' },
            { name: 'gemma2:2b', size: '1.6GB', description: 'Gemma 2 2B' },
            { name: 'gemma2:27b', size: '16GB', description: 'Gemma 2 27B' },
            { name: 'mistral', size: '4.1GB', description: 'Mistral 7B' },
            { name: 'mistral-nemo', size: '7.1GB', description: 'Mistral Nemo' },
            { name: 'mixtral', size: '26GB', description: 'Mixtral 8x7B' },
            { name: 'mixtral:8x22b', size: '80GB', description: 'Mixtral 8x22B' },
            { name: 'qwen2.5', size: '4.7GB', description: 'Qwen 2.5' },
            { name: 'qwen2.5:72b', size: '41GB', description: 'Qwen 2.5 72B' },
            { name: 'codellama', size: '3.8GB', description: 'Code Llama' },
            { name: 'codellama:70b', size: '39GB', description: 'Code Llama 70B' },
            { name: 'deepseek-coder-v2', size: '8.9GB', description: 'DeepSeek Coder V2' },
            { name: 'command-r', size: '20GB', description: 'Cohere Command R' },
            { name: 'command-r-plus', size: '52GB', description: 'Cohere Command R+' },
            { name: 'llava', size: '4.7GB', description: 'LLaVA (Vision)' },
            { name: 'llava:34b', size: '20GB', description: 'LLaVA 34B' },
            { name: 'nomic-embed-text', size: '274MB', description: 'Nomic Embeddings' },
            { name: 'mxbai-embed-large', size: '669MB', description: 'MixedBread Embeddings' },
            { name: 'all-minilm', size: '46MB', description: 'All-MiniLM Embeddings' }
        ];

        // Fetch local models to filter them out
        let installedModels = [];
        try {
            const localResponse = await fetch(`${CONFIG.ollamaHost}/api/tags`);
            if (localResponse.ok) {
                const data = await localResponse.json();
                installedModels = data.models.map(m => m.name);
            }
        } catch (error) {
            console.warn('Could not fetch installed models:', error);
        }

        // Clear and populate
        elements.pullModelSelect.innerHTML = '<option value="">Select a model to download...</option>';

        // Filter out installed models
        const modelsToShow = popularModels.filter(model =>
            !installedModels.some(installed =>
                installed === model.name || installed.startsWith(model.name + ':')
            )
        );

        modelsToShow.forEach(model => {
            const option = document.createElement('option');
            option.value = model.name;
            option.textContent = `${model.name} - ${model.description} (${model.size})`;
            elements.pullModelSelect.appendChild(option);
        });

        if (modelsToShow.length === 0) {
            elements.pullModelSelect.innerHTML = '<option value="">All popular models are already installed</option>';
        }

    } catch (error) {
        console.error('Failed to load available models:', error);
        if (elements.pullModelSelect) {
            elements.pullModelSelect.innerHTML = '<option value="">Error loading models</option>';
        }
    }
}

// Initialize on DOM load


