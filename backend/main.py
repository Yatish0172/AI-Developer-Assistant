import json
from fastapi import FastAPI , File , UploadFile , Form , Depends , Header
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
import speech_recognition as sr
import tempfile
from pydub import AudioSegment
from pydub.utils import which
from dotenv import load_dotenv
import os , subprocess
load_dotenv()
API_KEY = os.getenv("API_KEY")

# OLLAMA CONFIG
CODE_MODEL = "qwen2.5-coder"          # Best for explaining, debugging, optimizing
DIAGRAM_MODEL = "deepseek-coder-v2"   # Fastest + best for Mermaid flowcharts
OLLAMA_URL = "http://localhost:11434/api/generate"

#Database setup

username = os.getenv("MONGO_USER")
password = quote_plus(os.getenv("MONGO_PASS") or "")
cluster = os.getenv("MONGO_CLUSTER")

if username and cluster:    
    uri = f"mongodb+srv://{username}:{password}@{cluster}/"
    client = AsyncIOMotorClient(uri)
    db = client["Developer_Assistant"]
    history_collection = db["conversations"]
else:
    client = None
    db = None
    history_collection = None
#///////////////////////////////////////////////////////////////////////////////////////////////////////////////
#Audio_setup
ffmpeg_path = which("ffmpeg") or r"C:\Program Files (x86)\ffmpeg-8.0-essentials_build\bin\ffmpeg.exe"
ffprobe_path = which("ffprobe") or r"C:\Program Files (x86)\ffmpeg-8.0-essentials_build\bin\ffprobe.exe"
AudioSegment.converter = ffmpeg_path
AudioSegment.ffprobe = ffprobe_path
os.environ["PATH"] += os.pathsep + os.path.dirname(ffmpeg_path)
try:
    subprocess.run([ffmpeg_path, "-version"], capture_output=True, text=True, check=True)
    print("✅ FFmpeg is working correctly!\n")
except Exception as e:
    print("❌ FFmpeg check failed:", e, "\n")

#//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
app = FastAPI(title ="AI Developer Assistant", version="1.0")

class CodeRequest(BaseModel):
    code: str 
    language : str | None = None    
#///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
async def verify_api_key(x_api_key: str = Header(None)):
    if x_api_key != API_KEY:
        raise HTTPException(status_code=403, detail="Invalid or Missing API Key")
#///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
def detect_language(code:str ):
    try:
       return guess_lexer(code).name
    except:
        return "Unknown"
#////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
async def save_conversation(task:str,code:str,language:str,response:str):
    '''Save conversation in mongoDb database if configured'''
    if history_collection is None:
        return
    doc = {
        "task": task,
        "code": code,
        "language": language,
        "response": response,
        "created_at": datetime.datetime.utcnow()
    }
    try:
        await history_collection.insert_one(doc)
    except Exception as e:
        print("Warning: failed to save conversation:", e)
#///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
async def llm_run(model : str , prompt : str , stream = True, max_retries: int = 3):
    payload = {"model" : model ,"prompt" : prompt , "stream" : stream }
    attempt = 0
    while attempt < max_retries:
        attempt +=1
        try:
            async with httpx.AsyncClient(timeout=None) as client:
        
                if stream:
                    async with client.stream("POST",OLLAMA_URL,json=payload) as response:
                        async for line in response.aiter_lines():
                                    if not line.strip():
                                        continue
                                    try:
                                        yield json.loads(line)
                                    except:
                                        continue
                        return
                else:
                    resp = await client.post(OLLAMA_URL , json=payload)
                    try:
                        yield resp.json()
                    except:
                        yield {"response":resp.text}
                    return
        except Exception as e:
            if attempt < max_retries:
                await asyncio.sleep(1)
                continue
            else:
                yield{"response":f"[ERROR] Model request failed after {max_retries}retries: {str(e)}"}
                return    
#///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////    
async def Process_code(task:str , req : "CodeRequest",background_tasks: BackgroundTasks):
    task = task.lower()
    language = req.language or detect_language(req.code)
    model = CODE_MODEL 
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
       raise HTTPException(400, f"Unknown task '{task}'")

    collected_output = ""
    async def generate():
        nonlocal collected_output
        try:
            
            async for data in llm_run(model,base_prompt,stream=True):
                if not data:
                    continue
                if isinstance(data, dict) and data.get("response", "").startswith("[ERROR]"):
                    yield f"\n{data['response']}\n"
                    break

                if isinstance(data, dict) and data.get("error"):
                    yield f"\n[Error] {data.get('error')}\n"
                    break
                if isinstance(data,dict) and data.get("response"):
                    chunk = data["response"]
                    collected_output += chunk
                    yield chunk
                else:
                    text = ""
                    if isinstance (data,dict):
                        for k in ("response","text","content"):
                            if data.get(k):
                                text = data.get(k)
                                break
                    elif isinstance(data,str):
                        text = data
                    if text:
                        collected_output += text
                        yield text
                
        finally:
            try:
                background_tasks.add_task(
                    save_conversation, task, req.code, language, collected_output)
            except Exception:
                pass  
    return StreamingResponse(generate(), media_type="text/plain")
#/////////////////////////////////////////////////////////////////////////a/////////////////////////////////
async def Process_diagram(req: CodeRequest, background_tasks: BackgroundTasks):
    task = "diagram"
    language = req.language or detect_language(req.code)

    prompt = f"""
Convert the following {language} code into a Mermaid flowchart.

Rules:
- Use 'flowchart TD'
- Keep node labels short but meaningful
- Include functions, loops, conditions, returns
- Do NOT include ``` or markdown formatting
- ONLY return Mermaid code

Code:{req.code}
"""

    diagram_text = ""

    async for data in llm_run(DIAGRAM_MODEL, prompt, stream=False):
        if not data:
            continue

        if isinstance(data, dict) and data.get("response", "").startswith("[ERROR]"):
            return data["response"]

        if isinstance(data, dict) and data.get("response"):
            diagram_text += data["response"]

    # Save in DB
    if diagram_text.strip():
        try:
            background_tasks.add_task(
                save_conversation, task, req.code, language, diagram_text
            )
        except:
            pass

    return diagram_text.strip()
#//////////////////////////////////////////////////////////////////////////////////////////////////////////
@app.post("/explain",dependencies= [Depends(verify_api_key)])
async def explain_code(req : CodeRequest, background_tasks : BackgroundTasks):
    return await Process_code("Explain",req,background_tasks )
                            
@app.post("/debug", dependencies=[Depends(verify_api_key)])
async def Debug_code(req : CodeRequest, background_tasks : BackgroundTasks):
    return await Process_code("Debug",req,background_tasks)

@app.post("/optimize", dependencies=[Depends(verify_api_key)])
async def optimize_code(req:CodeRequest, background_tasks : BackgroundTasks):
    return await Process_code("Optimize",req,background_tasks)

@app.post("/voice-command", dependencies=[Depends(verify_api_key)])
async def process_voice_commands(
    background_tasks : BackgroundTasks,   
    file : UploadFile = File(...),
    code:str = Form(...)
        ):
    try:    
        with tempfile.NamedTemporaryFile(delete=False,suffix=".wav") as temp_file:
            contents = await file.read()
            temp_file.write(contents)
            temp_file_path = temp_file.name
        
        if file.filename.endswith(".mp3"):
            sound = AudioSegment.from_mp3(temp_file_path)
            wav_path = temp_file_path.replace(".mp3",".wav")
            sound.export(wav_path, format="wav")
            temp_file_path= wav_path
        
        recognizer = sr.Recognizer()
        with sr.AudioFile(temp_file_path) as source:
            audio = recognizer.record(source)
        
        voice_text = recognizer.recognize_google(audio).lower()
        print (f"Voice command detected: {voice_text}")


    # Task intect   
        if "explain" in voice_text:
            task = "Explain"
        elif "debug" in voice_text:
            task = "Debug"
        elif "optimize" in voice_text or "improve" in voice_text:
            task = "Optimize"
        else :
            raise HTTPException(status_code=404 ,detail=f"Unrecognized intent in voice: {voice_text}")
        req = CodeRequest(code=code)
        return await Process_code(task , req , background_tasks)
    except sr.UnknownValueError:
        raise HTTPException(status_code=400, detail="Could not understand audio")
    finally:
        try:
            if temp_file_path:
                os.remove(temp_file_path)
        except:
            pass
#/////////////////////////////////////////////////////////////////////////////////////////////////////
@app.post("/diagram", dependencies=[Depends(verify_api_key)])
async def diagram(req: CodeRequest, background_tasks: BackgroundTasks):
    result = await Process_diagram(req, background_tasks)
    return {"diagram": result}

#////////////////////////////////////////////////////////////////////////////////////////////////////          
@app.get("/history", dependencies=[Depends(verify_api_key)])
async def get_history():
    """Fetch all stored conversations from MongoDB Atlas."""
    if history_collection is None:
        return {"error": "MongoDB not configured"}
    records = []
    async for doc in history_collection.find().sort("created_at",-1):
        doc["_id"] = str(doc["_id"])
        doc["created_at"] = doc["created_at"].strftime("%Y-%m-%d %H:%M:%S")
        records.append(doc)
    return records

@app.delete ("/history/{conversation_id}", dependencies=[Depends(verify_api_key)])
async def delete_conversation(conversation_id:str):
    """delete one convo from database"""
    if history_collection is None:
        return {"error": "MongoDB not configured"}
    result = await history_collection.delete_one({"_id" : ObjectId(conversation_id)})
    if result.deleted_count == 0:
        raise HTTPException (status_code = 404 , detail = "Conversation not found")
    return {"message":f"Conversation {conversation_id} deleted successfully!"}
  
@app.delete ("/history/deleteall", dependencies=[Depends(verify_api_key)])
async def clear_history():
    if history_collection is None:
        return {"error": "MongoDB not configured"}
    """Clear all conversation history"""
    await history_collection.delete_many({})
    return {"message":"All conversations have been cleared!"}

@app.get("/")
def home():
    return {"message": "Backend running with Ollama "}
