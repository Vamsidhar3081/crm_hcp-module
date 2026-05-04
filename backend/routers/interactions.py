from fastapi import APIRouter, HTTPException
from models.schemas import AgentRequest, AgentResponse
from agents.crm_agent import run_agent
from models.database import (
    create_interaction, get_interaction, update_interaction
)
import traceback
import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/chat", response_model=AgentResponse)
async def agent_chat(request: AgentRequest):
    try:
        result = await run_agent(
            message=request.message,
            interaction_id=request.interaction_id,
            current_form_data=request.current_form_data
        )

        # Auto-save if agent extracted data and action is "log"
        if result.get("action") == "log" and result.get("extracted_data"):
            data = result["extracted_data"]
            if data.get("hcp_name"):
                interaction = create_interaction({
                    "hcp_name": data.get("hcp_name", ""),
                    "date": data.get("date", ""),
                    "topics_discussed": data.get("topics_discussed", ""),
                    "materials_shared": data.get("materials_shared", ""),
                    "samples_distributed": data.get("samples_distributed", ""),
                    "sentiment": data.get("sentiment", "Neutral") if data.get("sentiment") in ["Positive", "Neutral", "Negative"] else "Neutral",
                    "outcomes": data.get("outcomes", ""),
                    "follow_up_actions": data.get("follow_up_actions", ""),
                })
                result["interaction_id"] = interaction["id"]

        # Auto-update if editing existing interaction
        if result.get("action") == "edit" and request.interaction_id and result.get("extracted_data"):
            existing = get_interaction(request.interaction_id)
            if existing:
                update_interaction(request.interaction_id, result["extracted_data"])

        return AgentResponse(**result)
    except Exception as e:
        logger.error(f"Agent chat error: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))