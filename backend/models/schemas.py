from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class InteractionBase(BaseModel):
    hcp_name: Optional[str] = None
    date: Optional[str] = None
    topics_discussed: Optional[str] = None
    materials_shared: Optional[str] = None
    samples_distributed: Optional[str] = None
    sentiment: Optional[str] = "Neutral"
    outcomes: Optional[str] = None
    follow_up_actions: Optional[str] = None

class InteractionCreate(InteractionBase):
    pass

class InteractionUpdate(InteractionBase):
    pass

class InteractionResponse(InteractionBase):
    id: int
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    class Config:
        from_attributes = True

class AgentRequest(BaseModel):
    message: str
    interaction_id: Optional[int] = None
    current_form_data: Optional[dict] = None

class AgentResponse(BaseModel):
    message: str
    extracted_data: Optional[dict] = None
    action: Optional[str] = None
    interaction_id: Optional[int] = None
