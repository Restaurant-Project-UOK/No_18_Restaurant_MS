# main.py
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from agent import ask_question, reload_vector_store
from dotenv import load_dotenv
from sync_menu import sync_menu_data
from apscheduler.schedulers.background import BackgroundScheduler
import logging

load_dotenv()
app = FastAPI()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Scheduler for hourly sync
scheduler = BackgroundScheduler()

def scheduled_sync():
    """Wrapper function for the scheduled task with better error handling."""
    try:
        logger.info("Starting automated menu synchronization...")
        if sync_menu_data():
            reload_vector_store()
            logger.info("Automated menu synchronization and vector store reload completed.")
        else:
            logger.error("Automated menu synchronization failed.")
    except Exception as e:
        logger.error(f"Unexpected error during scheduled sync: {e}")

# Start scheduler
@app.on_event("startup")
async def startup_event():
    # Trigger an initial sync immediately on startup
    logger.info("Triggering initial menu sync on startup...")
    # Run sync in background so it doesn't block the health check
    try:
        scheduled_sync()
    except Exception as e:
        logger.error(f"Initial sync failed: {e}")
    
    # Schedule subsequent syncs every hour
    scheduler.add_job(scheduled_sync, 'interval', hours=1)
    scheduler.start()
    logger.info("Menu sync scheduler started (interval: 1 hour).")

@app.on_event("shutdown")
async def shutdown_event():
    if scheduler.running:
        scheduler.shutdown()
        logger.info("Menu sync scheduler shut down.")

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
# JSON API endpoint to get answers
@app.post("/ask")
async def ask(request: Request):
    try:
        data = await request.json()
        question = data.get("question", "")
        if not question:
            return JSONResponse({"error": "Missing question"}, status_code=400)
        
        # Run blocking ask_question in a separate thread so it doesn't block FastAPI
        from fastapi.concurrency import run_in_threadpool
        answer = await run_in_threadpool(ask_question, question)
        
        return {"answer": answer}
    except Exception as e:
        logger.error(f"Error in /ask endpoint: {e}", exc_info=True)
        return JSONResponse({"error": str(e)}, status_code=500)

# Manual sync endpoint
@app.post("/sync-now")
async def sync_now():
    logger.info("Manual synchronization triggered.")
    if sync_menu_data():
        reload_vector_store()
        return {"status": "success", "message": "Menu data synchronized and vector store reloaded."}
    else:
        return JSONResponse({"status": "error", "message": "Synchronization failed. Check logs."}, status_code=500)
