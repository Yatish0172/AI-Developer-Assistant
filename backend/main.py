import json
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import requests


app = FastAPI(title ="AI Developer Assistant", version="1.0")

class CodeRequest(BaseModel):
    code: str 

@app.get("/")
def home():
    return {"message": "Backend running with Ollama "}


@app.post("/explain")
async def explain_code(req : CodeRequest):
            try:

                prompt = (f"Explain this code in simple words\n\n{req.code}")
    
    
                response = requests.post(
                "http://localhost:11434/api/generate",
                json = {"model": "llama3" ,"prompt": prompt},
                stream = True,
                  )
    
                def streamresponse():
                
                    for line in response.iter_lines():
                        if line:
                            try:
                             data = json.loads(line)
                             if "response" in data:
                                yield data["response"] + ""
                             elif data.get("done"):
                                yield "\n\n✅ Done!"
                            except json.JSONDecodeError:
                                continue
                            
               
                return StreamingResponse(streamresponse(),media_type="text/plain")
            except Exception as e:
                    return {"error": str(e)}
 
