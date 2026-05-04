import os
import json
from typing import TypedDict, Annotated, Optional, Any
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, AIMessage, ToolMessage
from langchain_core.tools import tool
from sqlalchemy.orm import Session

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    api_key=GROQ_API_KEY,
    temperature=0
)

# ─────────────────────────────────────────────
# Tool definitions (5 required tools)
# ─────────────────────────────────────────────

@tool
def extract_interaction_data(text: str) -> dict:
    """
    Tool 1 – Log Interaction.
    Extracts structured HCP interaction fields from free-form text using the LLM.
    Returns a dict with hcp_name, date, topics_discussed, materials_shared,
    samples_distributed, sentiment, outcomes, follow_up_actions.
    """
    extraction_llm = ChatGroq(model="llama-3.3-70b-versatile", api_key=GROQ_API_KEY, temperature=0)
    prompt = f"""Extract the following fields from this interaction description.
Return ONLY valid JSON with these keys (use null if not found):
- hcp_name
- date (ISO or natural language)
- topics_discussed
- materials_shared
- samples_distributed
- sentiment (Positive / Neutral / Negative)
- outcomes
- follow_up_actions

Text: {text}

JSON:"""
    response = extraction_llm.invoke(prompt)
    raw = response.content.strip()
    # Strip markdown fences if present
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    try:
        return json.loads(raw.strip())
    except Exception:
        return {"error": "Could not parse extraction", "raw": raw}


@tool
def edit_interaction_data(current_data: dict, edit_instruction: str) -> dict:
    """
    Tool 2 – Edit Interaction.
    Takes existing form data and a natural-language edit instruction,
    returns an updated dict with only the changed fields.
    """
    edit_llm = ChatGroq(model="llama-3.3-70b-versatile", api_key=GROQ_API_KEY, temperature=0)
    prompt = f"""You are a CRM data editor. Given the current interaction data and an edit instruction,
return ONLY a JSON object with the updated fields (only include fields that changed).

Current data:
{json.dumps(current_data, indent=2)}

Edit instruction: {edit_instruction}

Return ONLY the JSON with changed fields:"""
    response = edit_llm.invoke(prompt)
    raw = response.content.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    try:
        return json.loads(raw.strip())
    except Exception:
        return {"error": "Could not parse edit", "raw": raw}


@tool
def suggest_follow_up(interaction_summary: str) -> str:
    """
    Tool 3 – Suggest Follow-Up Actions.
    Based on the interaction summary, suggests the next best action
    for the field rep (e.g., schedule a meeting, send a sample, share a study).
    """
    llm_suggest = ChatGroq(model="llama-3.3-70b-versatile", api_key=GROQ_API_KEY, temperature=0.3)
    prompt = f"""You are a life-science CRM assistant. Based on this HCP interaction summary,
suggest 2-3 concise follow-up actions for the field representative.

Interaction: {interaction_summary}

Follow-up suggestions (as a short bullet list):"""
    response = llm_suggest.invoke(prompt)
    return response.content.strip()


@tool
def summarize_interaction(raw_notes: str) -> str:
    """
    Tool 4 – Summarize Interaction.
    Converts verbose field notes into a clean 2-3 sentence CRM summary
    suitable for storing in the outcomes field.
    """
    llm_sum = ChatGroq(model="llama-3.3-70b-versatile", api_key=GROQ_API_KEY, temperature=0.2)
    prompt = f"""Summarize these field representative notes into 2-3 concise sentences
suitable for a CRM interaction record.

Notes: {raw_notes}

Summary:"""
    response = llm_sum.invoke(prompt)
    return response.content.strip()


@tool
def analyze_hcp_sentiment(interaction_text: str) -> dict:
    """
    Tool 5 – Analyze HCP Sentiment.
    Infers the HCP's sentiment (Positive / Neutral / Negative) from the interaction text
    and provides a brief reasoning.
    """
    llm_sent = ChatGroq(model="llama-3.3-70b-versatile", api_key=GROQ_API_KEY, temperature=0)
    prompt = f"""Analyze the HCP's sentiment from this interaction description.
Return ONLY JSON with keys: "sentiment" (Positive/Neutral/Negative) and "reasoning" (one sentence).

Text: {interaction_text}

JSON:"""
    response = llm_sent.invoke(prompt)
    raw = response.content.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    try:
        return json.loads(raw.strip())
    except Exception:
        return {"sentiment": "Neutral", "reasoning": "Could not determine sentiment"}


# ─────────────────────────────────────────────
# LangGraph State & Graph
# ─────────────────────────────────────────────

class AgentState(TypedDict):
    messages: Annotated[list, add_messages]
    extracted_data: Optional[dict]
    action: Optional[str]
    interaction_id: Optional[int]
    current_form_data: Optional[dict]


TOOLS = [
    extract_interaction_data,
    edit_interaction_data,
    suggest_follow_up,
    summarize_interaction,
    analyze_hcp_sentiment,
]

tools_by_name = {t.name: t for t in TOOLS}
llm_with_tools = llm.bind_tools(TOOLS)


def agent_node(state: AgentState):
    system_msg = {
        "role": "system",
        "content": (
            "You are an AI assistant for a Life Science CRM. "
            "Help field reps log and manage HCP interactions. "
            "Use the available tools to extract data, edit records, "
            "suggest follow-ups, summarize notes, and analyze sentiment. "
            "When the user describes an interaction, call extract_interaction_data. "
            "When the user wants to edit, call edit_interaction_data with the current form data. "
            "Always be concise and professional."
        )
    }
    messages = [system_msg] + state["messages"]
    response = llm_with_tools.invoke(messages)
    return {"messages": [response]}


def tool_node(state: AgentState):
    last = state["messages"][-1]
    tool_results = []
    extracted_data = state.get("extracted_data")
    action = state.get("action")

    for tool_call in last.tool_calls:
        tool_fn = tools_by_name.get(tool_call["name"])
        if tool_fn:
            result = tool_fn.invoke(tool_call["args"])
            tool_results.append(
                ToolMessage(content=json.dumps(result) if isinstance(result, dict) else str(result),
                            tool_call_id=tool_call["id"])
            )
            if tool_call["name"] == "extract_interaction_data":
                extracted_data = result if isinstance(result, dict) else {}
                action = "log"
            elif tool_call["name"] == "edit_interaction_data":
                extracted_data = result if isinstance(result, dict) else {}
                action = "edit"

    return {"messages": tool_results, "extracted_data": extracted_data, "action": action}


def should_continue(state: AgentState):
    last = state["messages"][-1]
    if hasattr(last, "tool_calls") and last.tool_calls:
        return "tools"
    return END


graph = StateGraph(AgentState)
graph.add_node("agent", agent_node)
graph.add_node("tools", tool_node)
graph.set_entry_point("agent")
graph.add_conditional_edges("agent", should_continue, {"tools": "tools", END: END})
graph.add_edge("tools", "agent")

crm_agent = graph.compile()


async def run_agent(message: str, interaction_id: Optional[int] = None, current_form_data: Optional[dict] = None):
    """Main entry point to run the CRM agent."""
    init_state = {
        "messages": [HumanMessage(content=message)],
        "extracted_data": None,
        "action": None,
        "interaction_id": interaction_id,
        "current_form_data": current_form_data or {},
    }

    # If user wants to edit, inject current form data into the message
    if current_form_data and any(k in message.lower() for k in ["edit", "change", "update", "modify"]):
        enhanced_msg = f"{message}\n\nCurrent form data: {json.dumps(current_form_data)}"
        init_state["messages"] = [HumanMessage(content=enhanced_msg)]

    final_state = await crm_agent.ainvoke(init_state)

    last_ai = next(
        (m for m in reversed(final_state["messages"]) if isinstance(m, AIMessage)),
        None
    )
    reply = last_ai.content if last_ai else "I processed your request."

    return {
        "message": reply,
        "extracted_data": final_state.get("extracted_data"),
        "action": final_state.get("action"),
        "interaction_id": interaction_id,
    }
