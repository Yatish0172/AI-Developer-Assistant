import json
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from pygments.lexers import guess_lexer
from pygments.util import ClassNotFound
import httpx
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import datetime
from fastapi import BackgroundTasks , HTTPException
from urllib.parse import quote_plus
import asyncio
username = "yatish0172"
password = quote_plus("Yatish150506")
uri = f"mongodb+srv://{username}:{password}@cluster0.sfwsekx.mongodb.net/"


client = AsyncIOMotorClient(uri)
db = client["Developer_Assistant"]
history_collection = db["conversations"]


app = FastAPI(title ="AI Developer Assistant", version="1.0")

class CodeRequest(BaseModel):
    code: str 
    language : str | None = None    

def detect_language(code:str ):
    try:
        lexer = guess_lexer(code)
        return lexer.name
    except ClassNotFound:
        return "Unknown"

async def save_conversation(task:str,code:str,language:str,response_text:str):
    '''Get all conversations from Mongodb Atlas'''
    doc = {
        "task" : task,
        "code" : code,
        "language" : language,
        "response": response_text,
        "created_at" : datetime.datetime.utcnow()
    }
    await history_collection.insert_one(doc)

      
async def Process_code(task:str , req : "CodeRequest",background_tasks: BackgroundTasks):
    task = task.lower()
    language = req.language or detect_language(req.code)
    
    base_prompt = f"You are an expert {language} developer.\n"
    if task == "explain":
        base_prompt += (
            f"Explain this {language} code step by step in simple language:\n\n{req.code}"
        )
    elif task == "debug":
        base_prompt += (
            f"Find and fix bugs or syntax issues in this {language} code. "
            f"Explain what was wrong and show corrected code:\n\n{req.code}"
        )
    elif task == "optimize":
        base_prompt += (
            f"Optimize this {language} code for performance and readability. "
            f"Explain what changes were made:\n\n{req.code}"
        )
    else:
        return {"error": f"Unknown task '{task}'"}

    collected_output = ""
    max_retries = 3
    delay = 1

    async def attempt_stream():
        nonlocal collected_output
        for attempt in range(max_retries):
            try:
                async with httpx.AsyncClient() as client:
                    async with client.stream(
                        "POST",
                        "http://localhost:11434/api/generate",
                        json={"model": "llama3", "prompt": base_prompt, "stream": True},
                        timeout=None,
                    ) as response:

                        async for line in response.aiter_lines():
                            if not line.strip():
                                continue
                            try:
                                data = json.loads(line)
                                if "response" in data:
                                    collected_output += data["response"]
                                    yield data["response"]
                                elif data.get("done"):
                                    yield "\n\n✅ Done!"
                                    return  # exit normally
                            except json.JSONDecodeError:
                                continue

            except httpx.StreamClosed:
                # ✅ Graceful retry handling
                yield f"\n Stream closed unexpectedly (attempt {attempt+1}/{max_retries}). Retrying...\n"
                if attempt < max_retries - 1:
                    await asyncio.sleep(delay)
                    continue
                else:
                    yield "\n Stream closed permanently after multiple retries.\n"
                    break

            except Exception as e:
                yield f"\nUnexpected error: {str(e)}\n"
                if attempt < max_retries - 1:
                    await asyncio.sleep(delay)
                    continue
                else:
                    break

            finally:
                background_tasks.add_task(
                    save_conversation, task, req.code, language, collected_output
                )

            break  
    return StreamingResponse(attempt_stream(), media_type="text/plain")
@app.post("/explain")
async def explain_code(req : CodeRequest, background_tasks : BackgroundTasks):
    return await Process_code("Explain",req,background_tasks )
                            
@app.post("/debug")
async def Debug_code(req : CodeRequest, background_tasks : BackgroundTasks):
    return await Process_code("Debug",req,background_tasks)

@app.post("/optimize")
async def optimize_code(req:CodeRequest, background_tasks : BackgroundTasks):
    return await Process_code("Optimize",req,background_tasks)
            
@app.get("/history")
async def get_history():
    """Fetch all stored conversations from MongoDB Atlas."""
    records = []
    async for doc in history_collection.find().sort("created_at",-1):
        doc["_id"] = str(doc["_id"])
        doc["created_at"] = doc["created_at"].strftime("%Y-%m-%d %H:%M:%S")

    
        records.append(doc)
    return records

@app.delete ("/history/{conversation_id}")
async def delete_conversation(conversation_id:str):
    """delete one convo from database"""
    result = await history_collection.delete_one({"_id" : ObjectId(conversation_id)})
    if result.deleted_count == 0:
        raise HTTPException (status_code = 404 , detail = "Conversation not found")
    return {"message":f"Conversation {conversation_id} deleted successfully!"}
  
@app.delete ("/history/deleteall")
async def clear_history():
    """Clear all conversation history"""
    await history_collection.delete_many({})
    return ({"message":"All conversations have been cleared!"})  
    
    
@app.get("/")
def home():
    return {"message": "Backend running with Ollama "}
