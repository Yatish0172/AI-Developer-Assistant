# 📌 **AI Developer Assistant**
An intelligent backend-powered assistant that helps developers **explain**, **debug**, **optimize**, and now **visualize code with flowcharts** — using natural language, voice commands, or full-file analysis.  
Built with **FastAPI, MongoDB Atlas, Ollama (Qwen & DeepSeek), and Speech Recognition**.

---

## 🚀 Features

### ✔ Code Understanding  
- Explain code line-by-line  
- Debug with detailed fixes  
- Optimize code for performance and readability 

### 📝 AI-Powered Code Commenting
- New "Comment" button in editor  
- Automatically inserts inline comments & function descriptions into the code  
- Helps explain complex logic without leaving the code file  

### 🔁 💻 Multi-Language Code Conversion (NEW)
Convert existing code into another programming language using the `/convert` endpoint.

- Supports multiple languages (Python, JavaScript, Java, C++, Go, etc.)
- Maintains original logic and structure
- Follows best coding practices of the target language

**Example Request:**
```json
POST /convert
{
  "code": "your original code here",
  "language": "Python"
}
```

**Response:**
```json
{
  "converted_code": "Equivalent code in selected language..."
}
```

### ⚡ Real-Time Flowchart Rendering (Live Preview in Editor)

Your AI Developer Assistant supports live diagram updates directly in the code editor through frontend integration (coming soon).

🔹 As the developer writes code, your extension triggers /diagram in the backend
🔹 The backend generates Mermaid syntax
🔹 The frontend renders it above the code in real time (like AI-powered “Explain” panels in VS Code)

#📌 Example workflow:

1. User types code in the editor

2. The extension sends periodic updates or triggers on save

3. Backend responds with Mermaid flowchart

4. UI displays the diagram above the code block

5. Diagram auto-refreshes with every code update


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

##📍 Why It’s Powerful

#Before	 Now

Manually creating flowcharts	Auto-generated
Only on-demand	Live & continuous
Static documentation	Dynamic visual code understanding

---

Uses **DeepSeek Coder V2** (fast + structured) for diagram generation.

### ✔ 🎤 Voice Command Support  
Upload an audio clip like:  
> “Explain this code”  
> “Debug this”  
> “Optimize this”  

The backend uses **speech-to-text** to detect your intent automatically.

### ✔ 🔐 Secure API Key System  
All routes include custom API-key protection.

### ✔ 🗂 MongoDB Conversation History  
Stores:  
- Task type (explain/debug/optimize/diagram)  
- Code snippet  
- Language detected  
- AI output  
- Timestamp  

Supports:  
- Fetch full history  
- Delete one entry  
- Clear entire history  

### ✔ ⚡ Streaming Responses  
Uses async **httpx streaming** for real-time model responses (like ChatGPT typing).

---

## 🧠 Auto Model Selection  
The system smartly uses the right model for the right task:
- **Qwen2.5-Coder** → Explain / Debug / Optimize  
- **DeepSeek-Coder-V2** → Flowcharts & Mermaid diagrams  

No manual switching required.

---

## 🏗 Tech Stack

| Component | Technology |
|----------|------------|
| Backend | FastAPI |
| Code AI Model | Qwen2.5-Coder (Ollama) |
| Diagram Model | DeepSeek-Coder-V2 (Ollama) |
| Speech Recognition | pydub, SpeechRecognition |
| Database | MongoDB Atlas |
| Auth | Custom API Key |
| Streaming | httpx Async Streaming |

---

## 🔧 Environment Setup

Create a `.env` file:

```
MONGO_USER=your_mongodb_user
MONGO_PASS=your_mongodb_password
MONGO_CLUSTER=your_cluster.mongodb.net
API_KEY=YourCustomAPIKey123
```

---

## ▶ Running the Server

```
uvicorn main:app --reload
```

Swagger Docs → http://127.0.0.1:8000/docs

---

## 🧪 Voice Command Test (Postman)

Form Data:
- `file`: audio file (.wav / .mp3)  
- `code`: your code snippet

Headers:
```
x-api-key: YourCustomAPIKey123
```

---

## 🧩 Diagram API Example

**POST:** `/diagram`  
**Body:**
```json
{
  "code": "your full source code here"
}
```

**Returns:**
```json
{
  "diagram": "flowchart TD; A-->B; ..."
}
```

---

## 📂 Project Structure

```
AI-Developer-Assistant/
│── backend/
│   ├── main.py
│   ├── requirements.txt
│   ├── .env
│── README.md
```

---

## 👨‍💻 Author  
**Yatish Sharma**  
AI & Full-Stack Developer  
UPES Dehradun
