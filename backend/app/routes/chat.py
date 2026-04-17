from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.llm.client import chat_completion
from app.services.activity import log_activity

router = APIRouter()


class ChatMessage(BaseModel):
    message: str
    history: list[dict] | None = None


@router.post("/")
async def send_message(payload: ChatMessage):
    try:
        result = await chat_completion(payload.message, payload.history)
        await log_activity(
            actor_type="user",
            action="chat.message",
            details={
                "message": payload.message[:200],
                "tool_calls": [tc["name"] for tc in result.get("tool_calls", [])],
            },
        )
        return result
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"LLM error: {exc}")
