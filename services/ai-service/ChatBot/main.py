# main.py
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from agent import ask_question
from dotenv import load_dotenv
load_dotenv()
app = FastAPI()

# CORS for iframe usage
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# Mount static and templates
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# Serve chatbot widget as iframe
@app.get("/widget", response_class=HTMLResponse)
async def widget(request: Request):
    return templates.TemplateResponse("widget.html", {"request": request})

# Serve embed.js (script users add to their site)
@app.get("/embed.js")
async def embed():
    return FileResponse("static/embed.js", media_type="application/javascript")

# JSON API endpoint to get answers
@app.post("/ask")
async def ask(request: Request):
    data = await request.json()
    question = data.get("question", "")
    if not question:
        return JSONResponse({"error": "Missing question"}, status_code=400)
    answer = ask_question(question)
    return {"answer": answer}
