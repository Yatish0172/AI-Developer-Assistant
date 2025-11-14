# 📌 **AI Developer Assistant**
An intelligent backend-powered assistant that helps developers **explain**, **debug**, and **optimize code** using natural language or voice commands.  
Now upgraded with **multi-model LLM support**, including **Qwen2.5-Coder** for code reasoning and **DeepSeek-Coder-V2** for diagram generation.

Built with **FastAPI, MongoDB Atlas, Local LLM Inference, and Speech Recognition**.

---

## 🚀 Features

### ✔ Code Understanding  
- Explain code line-by-line  
- High-level logic breakdown  
- Detect code intent and flow  

### ✔ Debugging & Optimization  
- Identify errors and incorrect logic  
- Suggest corrected versions  
- Improve performance and readability

### ✔ Multi-Model AI Engine  
Uses two specialized local AI models internally:  
- **Qwen2.5-Coder** → explanation, debugging, optimization  
- **DeepSeek-Coder-V2** → structured reasoning (future: diagrams/flowcharts)

Backend intelligently selects the model based on the task.

### ✔ Voice Command Support  
Upload an audio clip such as:  
> “Explain this code”  
> “Debug this”  
> “Optimize this function”

Speech is converted to text and automatically processed.

### ✔ Secure API Key Protection  
All endpoints are protected through a custom API-key authentication middleware.

### ✔ MongoDB Conversation History  
Stores:  
- Task (explain / debug / optimize)  
- Original code snippet  
- Detected language  
- Full AI response  
- Timestamp  

Supports:  
- Fetch entire history  
- Delete individual logs  
- Clear all logs

### ✔ Streaming Responses  
Outputs token-by-token responses using **httpx streaming**, giving smooth real-time feedback.

### ✔ Future: Real-Time Flowchart Generation  
Upcoming capability where the backend:  
- Converts code to flowcharts  
- Generates Mermaid diagrams  
- Updates diagrams on file save  
- Integrates with VS Code Extension UI

---

## 🏗 Tech Stack

| Component | Technology |
|----------|------------|
| Backend | FastAPI |
| Code AI Model | Qwen2.5-Coder |
| Diagram/Structure Model | DeepSeek-Coder-V2 |
| LLM Engine | Local inference engine (Ollama-compatible) |
| Speech Recognition | pydub, SpeechRecognition |
| Database | MongoDB Atlas |
| Authentication | Custom API Key |
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

Ensure local LLM models are available:

```
ollama pull qwen2.5-coder
ollama pull deepseek-coder-v2
```

---

## ▶ Running the Server

```
uvicorn main:app --reload --port 9912
```

Swagger Docs → http://127.0.0.1:9912/docs

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

## 📂 Project Structure

```
AI-Developer-Assistant/
│── main.py
│── requirements.txt
│── .env
│── README.md
│── /models (optional future)
```

---

## 👨‍💻 Author

**Yatish Sharma**  
AI & Full-Stack Developer  
UPES Dehradun  
