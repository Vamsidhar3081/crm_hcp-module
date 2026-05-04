# from fastapi import APIRouter, Depends, HTTPException
# from sqlalchemy.orm import Session
# from models.database import get_db, Interaction
# from models.schemas import AgentRequest, AgentResponse, InteractionCreate
# from agents.crm_agent import run_agent
# import traceback
# import logging

# logging.basicConfig(level=logging.DEBUG)
# logger = logging.getLogger(__name__)

# router = APIRouter()

# @router.post("/chat", response_model=AgentResponse)
# async def agent_chat(request: AgentRequest, db: Session = Depends(get_db)):
#     try:
#         result = await run_agent(
#             message=request.message,
#             interaction_id=request.interaction_id,
#             current_form_data=request.current_form_data
#         )

#         # Auto-save if agent extracted data and action is "log"
#         if result.get("action") == "log" and result.get("extracted_data"):
#             data = result["extracted_data"]
#             if data.get("hcp_name"):
#                 interaction = Interaction(
#                     hcp_name=data.get("hcp_name", ""),
#                     date=data.get("date", ""),
#                     topics_discussed=data.get("topics_discussed", ""),
#                     materials_shared=data.get("materials_shared", ""),
#                     samples_distributed=data.get("samples_distributed", ""),
#                     sentiment=data.get("sentiment", "Neutral") if data.get("sentiment") in ["Positive", "Neutral", "Negative"] else "Neutral",
#                     outcomes=data.get("outcomes", ""),
#                     follow_up_actions=data.get("follow_up_actions", ""),
#                 )
#                 db.add(interaction)
#                 db.commit()
#                 db.refresh(interaction)
#                 result["interaction_id"] = interaction.id

#         # Auto-update if editing existing interaction
#         if result.get("action") == "edit" and request.interaction_id and result.get("extracted_data"):
#             interaction = db.query(Interaction).filter(Interaction.id == request.interaction_id).first()
#             if interaction:
#                 for key, value in result["extracted_data"].items():
#                     if hasattr(interaction, key) and value:
#                         setattr(interaction, key, value)
#                 db.commit()
#                 db.refresh(interaction)

#         return AgentResponse(**result)
#     except Exception as e:
#         logger.error(f"Agent chat error: {traceback.format_exc()}")
#         raise HTTPException(status_code=500, detail=str(e))

from fastapi import APIRouter, HTTPException
from models.database import (
    create_interaction, get_interactions, get_interaction,
    update_interaction, delete_interaction
)
from models.schemas import InteractionCreate, InteractionUpdate, InteractionResponse
from typing import List

router = APIRouter()

@router.post("/", response_model=InteractionResponse)
def create(data: InteractionCreate):
    interaction = create_interaction(data.model_dump(exclude_none=True))
    return interaction

@router.get("/", response_model=List[InteractionResponse])
def list_all():
    interactions = get_interactions()
    return sorted(interactions, key=lambda x: x.get("created_at", ""), reverse=True)

@router.get("/{interaction_id}", response_model=InteractionResponse)
def get_one(interaction_id: int):
    interaction = get_interaction(interaction_id)
    if not interaction:
        raise HTTPException(status_code=404, detail="Interaction not found")
    return interaction

@router.put("/{interaction_id}", response_model=InteractionResponse)
def update(interaction_id: int, data: InteractionUpdate):
    interaction = get_interaction(interaction_id)
    if not interaction:
        raise HTTPException(status_code=404, detail="Interaction not found")
    updated = update_interaction(interaction_id, data.model_dump(exclude_none=True))
    return updated

@router.delete("/{interaction_id}")
def delete(interaction_id: int):
    interaction = get_interaction(interaction_id)
    if not interaction:
        raise HTTPException(status_code=404, detail="Interaction not found")
    delete_interaction(interaction_id)
    return {"message": "Deleted successfully"}