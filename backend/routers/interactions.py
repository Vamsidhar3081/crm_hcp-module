from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from models.database import get_db, Interaction
from models.schemas import InteractionCreate, InteractionUpdate, InteractionResponse
from typing import List

router = APIRouter()

@router.post("/", response_model=InteractionResponse)
def create_interaction(data: InteractionCreate, db: Session = Depends(get_db)):
    interaction = Interaction(**data.model_dump(exclude_none=True))
    db.add(interaction)
    db.commit()
    db.refresh(interaction)
    return interaction

@router.get("/", response_model=List[InteractionResponse])
def list_interactions(db: Session = Depends(get_db)):
    return db.query(Interaction).order_by(Interaction.created_at.desc()).all()

@router.get("/{interaction_id}", response_model=InteractionResponse)
def get_interaction(interaction_id: int, db: Session = Depends(get_db)):
    interaction = db.query(Interaction).filter(Interaction.id == interaction_id).first()
    if not interaction:
        raise HTTPException(status_code=404, detail="Interaction not found")
    return interaction

@router.put("/{interaction_id}", response_model=InteractionResponse)
def update_interaction(interaction_id: int, data: InteractionUpdate, db: Session = Depends(get_db)):
    interaction = db.query(Interaction).filter(Interaction.id == interaction_id).first()
    if not interaction:
        raise HTTPException(status_code=404, detail="Interaction not found")
    for key, value in data.model_dump(exclude_none=True).items():
        setattr(interaction, key, value)
    db.commit()
    db.refresh(interaction)
    return interaction

@router.delete("/{interaction_id}")
def delete_interaction(interaction_id: int, db: Session = Depends(get_db)):
    interaction = db.query(Interaction).filter(Interaction.id == interaction_id).first()
    if not interaction:
        raise HTTPException(status_code=404, detail="Interaction not found")
    db.delete(interaction)
    db.commit()
    return {"message": "Deleted successfully"}
