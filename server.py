import os
from fastapi import FastAPI, APIRouter
from api.database_access.sql_model.sql_model_database_service import SQLModelDatabaseService
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from api.websocket_api import WebsocketGameAPI
from api.rest_api import RestAPI

# Make sure DATABASE_URL is set in your environment
DATABASE_URL = os.environ["DATABASE_URL"]

# Initialize database service
database_service = SQLModelDatabaseService(DATABASE_URL)

# Create FastAPI app
app = FastAPI()
router = APIRouter()

origins = [
    "http://localhost:5173",  # Vite dev server
    "http://127.0.0.1:5173",  # Sometimes it uses this
    "https://moth-large-yearly.ngrok-free.app"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Attach the API endpoints
RestAPI(database_service, router)
WebsocketGameAPI(database_service, router)

# Include the router
app.include_router(router)

# FOR REACT SERVICE ONCE I HAVE IT
# frontend_dir = os.path.join(os.path.dirname(__file__), "./react_ui/dist")
# app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dir, "assets")), name="assets")

# @app.get("/{full_path:path}")
# async def serve_react_app(full_path: str) -> FileResponse:
#     return FileResponse(os.path.join(frontend_dir, "index.html"))

if __name__ == "__main__":
    import uvicorn
    print("Booting up...")
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level='info')
