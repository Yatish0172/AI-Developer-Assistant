# 📌 **AI Developer Assistant**
An intelligent backend-powered assistant that helps developers **explain**, **debug**, and **optimize code** using natural language or voice commands.  
Built with **FastAPI, MongoDB Atlas, Ollama (Llama 3), and Speech Recognition**.

---

## 🚀 Features

### ✔ Code Understanding  
- Explain code line-by-line  
- Debug with detailed fixes  
- Optimize code for performance and readability  

### ✔ Voice Command Support  
Upload an audio clip like:  
> “Explain this code”  
> “Debug this”  
> “Optimize this code”

The backend detects your intent using **speech-to-text** and processes your code automatically.

### ✔ Secure API Key System  
All routes are protected with a custom API key middleware.

### ✔ MongoDB Conversation History  
Stores:  
- Task (explain / debug / optimize)  
- Code snippet  
- Language (detected automatically)  
- Full AI response  
- Timestamp  

Provides:  
- Fetch history  
- Delete one conversation  
- Clear all conversations  

### ✔ Streaming Responses  
Uses **httpx streaming** for real-time AI responses (like ChatGPT typing effect).

---

## 🏗 Tech Stack

| Component | Technology |
|----------|------------|
| Backend | FastAPI |
| AI Model | Ollama (Llama 3) |
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
FFMPEG_PATH=C:\Program Files (x86)\ffmpeg-8.0-essentials_build\bin\ffmpeg.exe
FFPROBE_PATH=C:\Program Files (x86)\ffmpeg-8.0-essentials_build\bin\ffprobe.exe
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
