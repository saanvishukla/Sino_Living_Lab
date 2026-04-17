from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.llm.client import chat_completion

router = APIRouter()


class ChatMessage(BaseModel):
    message: str
    history: list[dict] | None = None


@router.post("/")
async def send_message(payload: ChatMessage):
    try:
        reply = await chat_completion(payload.message, payload.history)
        return {"reply": reply}
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"LLM error: {exc}")
