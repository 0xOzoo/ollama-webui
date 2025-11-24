# Ollama WebUI

A modern, beautiful chat interface for interacting with your local Ollama AI models.

## 🚀 Quick Start

1. **Make sure Ollama is running:**
   ```bash
   ollama serve
   ```

2. **Start the web server:**
   
   Double-click `start.bat` or run in terminal:
   ```bash
   start.bat
   ```

3. **Open in browser:**
   
   Navigate to: `http://localhost:8080`

## 🎨 Features

- **Modern UI**: Beautiful dark mode with glassmorphism effects
- **Real-time Streaming**: See AI responses as they're generated
- **Conversation History**: Your chats are saved locally
- **Markdown Support**: Formatted text, code blocks, and more
- **Responsive Design**: Works on desktop, tablet, and mobile

## ⚙️ Configuration

The default configuration in `app.js`:
- **Ollama URL**: `http://localhost:11434`
- **Model**: `gemma3:12B`
- **Streaming**: Enabled

To change the model or settings, edit the `CONFIG` object in `app.js`.

## 🔧 Troubleshooting

**"Disconnected" status:**
- Make sure Ollama is running with `ollama serve`
- Check that Ollama is on port 11434 (default)

**No response from AI:**
- Verify the model is downloaded: `ollama list`
- Check browser console for errors (F12)

**CORS errors:**
- Use the local server (`start.bat`) instead of opening HTML directly

## 📝 Model Information

Currently using: **gemma3:12b**

To use a different model, update the `model` field in `app.js` CONFIG section.

Available models: `ollama list`

## 💡 Tips

- Press **Enter** to send a message
- Press **Shift+Enter** for a new line
- Click example prompts to get started
- Use the clear button to start a fresh conversation
