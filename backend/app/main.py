from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import attire, rakaat, visitor

app = FastAPI(
    title="Ihsan.id Detection Services",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(attire.router, prefix="/detect", tags=["Attire"])
app.include_router(rakaat.router, prefix="/detect", tags=["Rakaat"])
app.include_router(visitor.router, prefix="/count", tags=["Visitor"])

@app.get("/health")
def health():
    return {"status": "ok"}
