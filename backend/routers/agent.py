from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from models.database import get_db, Interaction
from models.schemas import AgentRequest, AgentResponse, InteractionCreate
from agents.crm_agent import run_agent

router = APIRouter()

@router.post("/chat", response_model=AgentResponse)
async def agent_chat(request: AgentRequest, db: Session = Depends(get_db)):
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
                interaction = Interaction(
                    hcp_name=data.get("hcp_name", ""),
                    date=data.get("date", ""),
                    topics_discussed=data.get("topics_discussed", ""),
                    materials_shared=data.get("materials_shared", ""),
                    samples_distributed=data.get("samples_distributed", ""),
                    sentiment=data.get("sentiment", "Neutral") if data.get("sentiment") in ["Positive", "Neutral", "Negative"] else "Neutral",
                    outcomes=data.get("outcomes", ""),
                    follow_up_actions=data.get("follow_up_actions", ""),
                )
                db.add(interaction)
                db.commit()
                db.refresh(interaction)
                result["interaction_id"] = interaction.id

        # Auto-update if editing existing interaction
        if result.get("action") == "edit" and request.interaction_id and result.get("extracted_data"):
            interaction = db.query(Interaction).filter(Interaction.id == request.interaction_id).first()
            if interaction:
                for key, value in result["extracted_data"].items():
                    if hasattr(interaction, key) and value:
                        setattr(interaction, key, value)
                db.commit()
                db.refresh(interaction)

        return AgentResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
