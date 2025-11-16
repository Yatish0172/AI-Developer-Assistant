# 📌 **AI Developer Assistant**
An intelligent backend-powered assistant that helps developers **explain**, **debug**, **optimize**, and now **visualize code with flowcharts** — using natural language, voice commands, or full-file analysis.  
Built with **FastAPI, MongoDB Atlas, Ollama (Qwen & DeepSeek), and Speech Recognition**.

---

## 🚀 Features

### ✔ Code Understanding  
- Explain code line-by-line  
- Debug with detailed fixes  
- Optimize code for performance and readability  

### ✔ 📊 Auto-Generated Flowcharts (NEW)  
Convert any code file into a **Mermaid flowchart** using the `/diagram` endpoint.  
Perfect for:
- Understanding complex logic  
- Documenting systems  
- Real-time diagram updates in your VS Code extension  

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
