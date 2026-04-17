from openai import AsyncOpenAI

from app.config import settings
from app.llm.tools import TOOL_SCHEMAS, execute_tool


SYSTEM_PROMPT = """You are the Sino Operating Layer — an agentic AI assistant for Sino Group's brand and design operations team.

You have tools to manage tenant data across Sino Group buildings. Use them whenever the
user asks about tenants, buildings, statistics, or wants to add / update / remove tenants.

Guidelines:
- When the user asks a question about current data, CALL the appropriate tool rather than
  guessing. Never fabricate tenant or building information.
- When the user asks you to make a change, call the tool to perform it, then confirm briefly.
- After a successful action, briefly summarize what changed in plain English.
- Be concise, professional, and action-oriented.

Buildings are identified by id (e.g. "bld-plaza") or code (e.g. "PLAZA"). Known codes:
PLAZA (Sino Plaza), CENTRAL (Central Building), OLYMPIAN (Olympian City)."""


MAX_TOOL_ROUNDS = 5


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


async def chat_completion(user_message: str, history: list[dict] | None = None) -> dict:
    """Run a multi-round tool-calling loop and return the final assistant reply.

    Returns a dict: {"reply": str, "tool_calls": list[{name, arguments, result}]}
    """
    client = _build_client()
    messages: list[dict] = [{"role": "system", "content": SYSTEM_PROMPT}]
    if history:
        # Only keep role+content from the history to avoid sending stale tool_calls
        for h in history:
            if h.get("role") in {"user", "assistant"} and h.get("content"):
                messages.append({"role": h["role"], "content": h["content"]})
    messages.append({"role": "user", "content": user_message})

    executed_tools: list[dict] = []

    for _ in range(MAX_TOOL_ROUNDS):
        response = await client.chat.completions.create(
            model=settings.llm_model,
            messages=messages,
            tools=TOOL_SCHEMAS,
            temperature=0.3,
        )
        msg = response.choices[0].message

        if not msg.tool_calls:
            return {"reply": msg.content or "", "tool_calls": executed_tools}

        # Append the assistant's tool-call message to history
        messages.append(
            {
                "role": "assistant",
                "content": msg.content or "",
                "tool_calls": [
                    {
                        "id": tc.id,
                        "type": "function",
                        "function": {
                            "name": tc.function.name,
                            "arguments": tc.function.arguments,
                        },
                    }
                    for tc in msg.tool_calls
                ],
            }
        )

        # Execute each tool and add its result
        for tc in msg.tool_calls:
            result_json = await execute_tool(tc.function.name, tc.function.arguments)
            executed_tools.append(
                {
                    "name": tc.function.name,
                    "arguments": tc.function.arguments,
                    "result": result_json,
                }
            )
            messages.append(
                {
                    "role": "tool",
                    "tool_call_id": tc.id,
                    "content": result_json,
                }
            )

    return {
        "reply": "I hit the tool-use limit for this turn. Please try rephrasing.",
        "tool_calls": executed_tools,
    }
