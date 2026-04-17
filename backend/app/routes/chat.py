from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class ChatMessage(BaseModel):
    message: str


@router.post("/")
def send_message(payload: ChatMessage):
    return {
        "reply": "The agentic operating layer is not yet connected. Coming soon!",
        "echo": payload.message,
    }
