from openai import AsyncOpenAI

from app.config import settings


SYSTEM_PROMPT = """You are the Sino Operating Layer — an agentic AI assistant for Sino Group's brand and design operations team.

Your responsibilities:
- Help manage tenant data across Sino Group buildings
- Generate, regenerate, and update e-directory posters
- Check compliance and brand guidelines
- Provide statistics and insights about tenants and buildings
- Answer questions about the current state of tenants, buildings, and posters

Be concise, professional, and action-oriented. When the user asks you to do something,
acknowledge what you understood and describe what action you would take. (Note: tool use
will be connected in a future phase — for now just describe the action clearly.)

You are speaking with a Sino Group internal team member."""


def _build_client() -> AsyncOpenAI:
    provider = settings.llm_provider.lower()

    if provider == "grok":
        if not settings.xai_api_key:
            raise RuntimeError("XAI_API_KEY not configured")
        return AsyncOpenAI(
            api_key=settings.xai_api_key,
            base_url="https://api.x.ai/v1",
        )

    if provider == "openai":
        if not settings.openai_api_key:
            raise RuntimeError("OPENAI_API_KEY not configured")
        return AsyncOpenAI(api_key=settings.openai_api_key)

    raise RuntimeError(f"Unsupported LLM provider: {provider}")


async def chat_completion(user_message: str, history: list[dict] | None = None) -> str:
    client = _build_client()
    messages: list[dict] = [{"role": "system", "content": SYSTEM_PROMPT}]
    if history:
        messages.extend(history)
    messages.append({"role": "user", "content": user_message})

    response = await client.chat.completions.create(
        model=settings.llm_model,
        messages=messages,
        temperature=0.3,
    )
    return response.choices[0].message.content or ""
