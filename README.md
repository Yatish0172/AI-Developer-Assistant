# AI Developer Assistant
![License](https://img.shields.io/badge/license-MIT-blue.svg)

An intelligent backend-powered assistant that helps developers **explain**, **debug**, **optimize**, **convert**, and **visualize code with flowcharts** using natural language, voice commands, or full-file analysis.

Built using **FastAPI, Ollama (Qwen2.5 Coder), MongoDB Atlas**, and **Speech Recognition**.

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

###  Real-Time Flowchart Rendering (Live Preview in Editor)

Your AI Developer Assistant supports live diagram updates directly in the code editor through frontend integration (coming soon).

🔹 As the developer writes code, your extension triggers /diagram in the backend
🔹 The backend generates Mermaid syntax
🔹 The frontend renders it above the code in real time (like AI-powered “Explain” panels in VS Code)


╔═════════════════════════════╗
║     Live Diagram Preview     ║
╚═════════════════════════════╝

flowchart TD
    A[Start] --> B{Check Condition}
    B -->|True| C[Execute Function A]
    B -->|False| D[Return Error]
    C --> E[End]
---

🛠 Frontend Integration (Concept Example)

// VS Code Extension (pseudo-logic)
editor.onDidChangeModelContent(() => {
  fetch("/diagram", { code: currentCode })
    .then(res => updateDiagramPanel(res.diagram));
});


---

## Why It’s Powerful

#Before	 Now

Manually creating flowcharts	Auto-generated
Only on-demand	Live & continuous
Static documentation	Dynamic visual code understanding

---
## Workflow Example

1. User writes or pastes code
2. Extension sends request to `/diagram`
3. Backend generates Mermaid code
4. UI renders diagram above the code


### Voice Command Support
Upload an audio file and speak commands like:
- "Explain this code"
- "Debug this"
- "Optimize this"

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
Generates responses in real-time like ChatGPT.

## Technology Stack

| Component | Implementation |
|-----------|----------------|
| Backend | FastAPI |
| AI Model | Qwen2.5-Coder |
| Diagram Model | Qwen2.5-Coder |
| Speech Recognition | pydub, SpeechRecognition |
| Database | MongoDB Atlas |
| Streaming | httpx Async |
| Auth | Custom API Key |

## Environment Setup

Create `.env` file:

```
MONGO_USER=your_mongodb_user
MONGO_PASS=your_mongodb_password
MONGO_CLUSTER=your_cluster.mongodb.net
API_KEY=YourCustomAPIKey123
```

## Running the Server

```
uvicorn main:app --reload
```

Swagger UI is available at:
```
http://127.0.0.1:8000/docs
```

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

## Project Structure

```
AI-Developer-Assistant/
│── main.py
│── requirements.txt
│── .env
│── README.md
```
## Future Plans

The project is being extended into a **VS Code Extension** with the following goals:

- **Real-time AI assistance inside the editor** (explain, debug, optimize without leaving VS Code)
- **Live flowchart rendering above code during typing**
- **Voice-command support integrated directly into VS Code**
- **Automatic code language detection and model selection**
- **Intelligent suggestions and code generation while writing code**
- **Support for multiple file types and frameworks**
- **Shortcut-based interactions** (e.g., `Ctrl + Alt + E` to explain code)
- **Seamless extension-to-backend communication using REST APIs**

The backend developed in this project will power the VS Code extension, ensuring that AI capabilities work efficiently and in real time.

A prototype extension structure will be implemented using:
- `TypeScript` and `VS Code Extension API`
- REST API integration to call backend endpoints
- Local caching and performance optimization

Development will begin after stabilizing the backend APIs.


## Author
**Yatish Sharma**  
AI & Full-Stack Developer  
UPES Dehradun

## © Copyright
AI Developer Assistant (Backend & Future VS Code Extension)  
© 2025 Yatish Sharma. All rights reserved.  
Licensed under the MIT License.
