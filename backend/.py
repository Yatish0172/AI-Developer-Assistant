import os
import json
import datetime
import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, Header, HTTPException, Depends, BackgroundTasks
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from pygments.lexers import guess_lexer
from pygments.util import ClassNotFound
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
API_KEY = os.getenv("API_KEY")

client = AsyncIOMotorClient(MONGO_URI)
db = client["Developer_Assistant"]
history_collection = db["conversations"]

app = FastAPI()

class CodeRequest(BaseModel):
    code: str
    language: str | None = None

def detect_language(code: str):
    try:
        return guess_lexer(code).name
    except ClassNotFound:
        return "Unknown"

async def save_conversation(task, code, language, response_text):
    await history_collection.insert_one({
        "task": task,
        "code": code,
        "language": language,
        "response": response_text,
        "created_at": datetime.datetime.utcnow()
    })

async def verify_api_key(x_api_key: str = Header(None)):
    if x_api_key != API_KEY:
        raise HTTPException(status_code=403, detail="Invalid or Missing API Key")

async def process_code(task, req: CodeRequest, background_tasks: BackgroundTasks):
    language = req.language or detect_language(req.code)
    prompt = f"You are an expert {language} developer.\n"

    if task == "explain":
        prompt += f"Explain this code:\n{req.code}"
    elif task == "debug":
        prompt += f"Find and fix bugs:\n{req.code}"
    elif task == "optimize":
        prompt += f"Optimize this code:\n{req.code}"

    collected_output = ""

    async def stream_ollama():
        nonlocal collected_output
        async with httpx.AsyncClient() as client:
            async with client.stream(
                "POST",
                "http://localhost:11434/api/generate",
                json={"model": "llama3", "prompt": prompt},
                timeout=None
            ) as response:
                async for line in response.aiter_lines():
                    if line.strip():
                        data = json.loads(line)
                        if "response" in data:
                            collected_output += data["response"]
                            yield data["response"]
                        if data.get("done"):
                            background_tasks.add_task(save_conversation, task, req.code, language, collected_output)

    return StreamingResponse(stream_ollama(), media_type="text/plain")


@app.post("/explain", dependencies=[Depends(verify_api_key)])
async def explain_code(req: CodeRequest, bg: BackgroundTasks):
    return await process_code("explain", req, bg)

@app.post("/debug", dependencies=[Depends(verify_api_key)])
async def debug_code(req: CodeRequest, bg: BackgroundTasks):
    return await process_code("debug", req, bg)

@app.post("/optimize", dependencies=[Depends(verify_api_key)])
async def optimize_code(req: CodeRequest, bg: BackgroundTasks):
    return await process_code("optimize", req, bg)

@app.get("/history", dependencies=[Depends(verify_api_key)])
async def get_history():
    data = []
    async for doc in history_collection.find().sort("created_at", -1):
        doc["_id"] = str(doc["_id"])
        doc["created_at"] = str(doc["created_at"])
        data.append(doc)
    return data

@app.delete("/history/{conversation_id}", dependencies=[Depends(verify_api_key)])
async def delete_convo(conversation_id: str):
    await history_collection.delete_one({"_id": ObjectId(conversation_id)})
    return {"message": "Deleted"}

@app.delete("/history/deleteall", dependencies=[Depends(verify_api_key)])
async def clear_history():
    await history_collection.delete_many({})
    return {"message": "Cleared"}

@app.get("/")
async def home():
    return {"status": "running"}