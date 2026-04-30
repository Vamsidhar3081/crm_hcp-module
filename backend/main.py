from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import interactions, agent

app = FastAPI(title="CRM HCP API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(interactions.router, prefix="/api/interactions", tags=["interactions"])
app.include_router(agent.router, prefix="/api/agent", tags=["agent"])

@app.get("/")
def root():
    return {"status": "CRM HCP API running"}
