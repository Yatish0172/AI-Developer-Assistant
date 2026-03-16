# AI Developer Assistant
![License](https://img.shields.io/badge/license-MIT-blue.svg)

An intelligent AI-powered assistant that helps developers **explain**, **debug**, **optimize**, **convert**, **comment**, and **visualize code with flowcharts** — now with a fully-built **VS Code Extension** that connects directly to your local AI backend.

Built using **FastAPI, Ollama (Qwen2.5 Coder), MongoDB Atlas**, **Speech Recognition**, and the **VS Code Extension API**.

## Features

### Code Understanding
- Explain code line by line
- Debug issues with fixes
- Optimize code for performance and readability

### AI-Powered Code Commenting
- Automatically adds professional inline comments and function descriptions

### Multi-Language Code Conversion
Convert code into another programming language using `/convert`.

#### Example Request
```json
POST /convert
{
  "code": "your original code here",
  "language": "Python"
}
```

### Real-Time Flowchart Rendering (Live Preview in Editor)

The VS Code Extension renders Mermaid diagrams in a live side panel — no browser, no copy-paste.

🔹 Select any code in the editor and click **Generate Flowchart**
🔹 The backend generates Mermaid syntax using Qwen2.5-Coder
🔹 The extension renders it instantly in a side panel with copy support

```
╔═════════════════════════════╗
║     Live Diagram Preview     ║
╚═════════════════════════════╝

flowchart TD
    A[Start] --> B{Check Condition}
    B -->|True| C[Execute Function A]
    B -->|False| D[Return Error]
    C --> E[End]
```

---

### 🛠 VS Code Extension — Now Live

The extension is fully built and integrated with the backend.

```typescript
// How it works under the hood
editor.onDidReceiveMessage(() => {
  fetch("/diagram", { code: currentCode })
    .then(res => updateDiagramPanel(res.diagram));
});
```

---

## Why It's Powerful

| Before | Now |
|--------|-----|
| Manually creating flowcharts | Auto-generated from code |
| Switching between browser and editor | Everything inside VS Code |
| Only on-demand via API | Sidebar buttons + keyboard shortcuts |
| Static documentation | Dynamic visual code understanding |

---

## Workflow Example

1. Open any code file in VS Code
2. Select code or leave cursor in the file
3. Click an action in the AI Assistant sidebar (or use a shortcut)
4. Response streams in real time directly in the output panel

---

### Voice Command Support
Record your voice and speak commands like:
- "Explain this code"
- "Debug this"
- "Optimize this"

The backend transcribes the audio and runs the right task on your active file automatically.

### Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Explain | `Ctrl+Alt+E` |
| Debug | `Ctrl+Alt+D` |
| Optimize | `Ctrl+Alt+O` |
| Add Comments | `Ctrl+Alt+C` |
| Generate Flowchart | `Ctrl+Alt+F` |
| Open Panel | `Ctrl+Alt+A` |

### Secure API Key Validation
All routes require a valid `x-api-key` header.

### MongoDB Conversation History
Stores:
- Task type
- Code
- Language
- AI response
- Timestamp

Supports:
- Fetch history
- Delete single history entry
- Clear all history

### Streaming Responses
Generates responses in real-time like ChatGPT — streamed token by token directly into the sidebar.

## Technology Stack

| Component | Implementation |
|-----------|----------------|
| Backend | FastAPI |
| AI Model | Qwen2.5-Coder (Ollama) |
| Diagram Model | Qwen2.5-Coder |
| VS Code Extension | TypeScript + VS Code API |
| Diagram Rendering | Mermaid.js |
| Speech Recognition | pydub, SpeechRecognition |
| Database | MongoDB Atlas |
| Streaming | httpx Async / Node.js http |
| Auth | Custom API Key |

## Project Structure

```
AI-Developer-Assistant/
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   └── .env
├── Frontend/                 ← VS Code Extension
│   ├── Frontend/
│   │   ├── sidebar.html      ← Sidebar webview UI
│   │   └── diagramPanel.html ← Flowchart viewer
│   ├── src/
│   │   ├── extension.ts      ← Entry point & commands
│   │   ├── sidebarProvider.ts← Sidebar logic
│   │   ├── diagramPanel.ts   ← Diagram panel
│   │   └── api.ts            ← HTTP client
│   ├── media/
│   │   └── sidebar-icon.svg
│   ├── package.json
│   └── tsconfig.json
└── README.md
```

## Environment Setup

Create `.env` file inside `backend/`:

```
MONGO_USER=your_mongodb_user
MONGO_PASS=your_mongodb_password
MONGO_CLUSTER=your_cluster.mongodb.net
API_KEY=YourCustomAPIKey123
```

## Running the Server

```bash
cd backend
uvicorn main:app --reload
```

Swagger UI is available at:
```
http://127.0.0.1:8000/docs
```

## Running the VS Code Extension

```bash
cd Frontend
npm install
npm run compile
```

Open the `Frontend/` folder in VS Code and press **F5**. Configure your API URL and key under **Settings → Extensions → AI Developer Assistant**.

## Example: Diagram API

```json
POST /diagram
{
  "code": "your full source code here"
}
```

Response:
```json
{
  "diagram": "flowchart TD; A-->B; ..."
}
```

## Author
**Yatish Sharma**
AI & Full-Stack Developer
UPES Dehradun

## © Copyright
AI Developer Assistant
© 2025 Yatish Sharma. All rights reserved.
Licensed under the MIT License.
