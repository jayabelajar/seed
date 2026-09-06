from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from app.api.routes import router as api_router
from app.web.routes import router as web_router


app = FastAPI(title="Sistem Monitoring Pembibitan Padi", version="1.0.0")
app.mount("/static", StaticFiles(directory="app/static"), name="static")
app.include_router(web_router)
app.include_router(api_router)
