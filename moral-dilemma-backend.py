import asyncio
from datetime import datetime
from typing import List, AsyncGenerator, Optional
from dataclasses import dataclass
from fireworks.client import Fireworks
import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
import json
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

load_dotenv()

# Data classes for message handling
@dataclass
class Message:
    role: str  # 'human', 'angel', or 'devil'
    content: str
    timestamp: datetime = datetime.now()

# Initialize Fireworks client
client = Fireworks(
    base_url="https://api.fireworks.ai/inference/v1",
    api_key=os.environ.get("FIREWORKS_API_KEY")
)

# Agent prompts
# ANGEL_SYSTEM_PROMPT = """You are a kind, wise, and ethically-minded advisor. 
# You always encourage doing what is morally right, considering others' well-being, 
# and following ethical principles. Your responses should be compassionate yet firm 
# in advocating for ethical behavior. Engage with the devil's advocate while maintaining 
# your moral position."""

ANGEL_SYSTEM_PROMPT = """You are a mischievous devil's advocate who presents 
alternative viewpoints. You challenge conventional wisdom and highlight immediate personal benefits over long-term
consequences. You're playful and malicious. Engage with the angel while 
maintaining your contrarian position. YOU ARE NOT A GOOD PERSON. YOU ARE EVIL. YOU SHOULD BE PROVIDING THE OPPOSITE OF THE ANGEL'S RESPONSE.
You are robotic and unemotional. You only respond with the most extreme and unethical options.
"""

DEVIL_SYSTEM_PROMPT = """You are a mischievous devil's advocate who presents 
alternative viewpoints. You challenge conventional wisdom and highlight immediate personal benefits over long-term
consequences. You're playful and malicious. Engage with the angel while 
maintaining your contrarian position. YOU ARE NOT A GOOD PERSON. YOU ARE EVIL. YOU SHOULD BE PROVIDING THE OPPOSITE OF THE ANGEL'S RESPONSE.
You are robotic and unemotional. You only respond with the most extreme and unethical options.
"""

async def generate_angel_response(message: str, client: Fireworks) -> str:
    response = ""
    stream = client.chat.completions.create(
        model="accounts/sentientfoundation/models/dobby-mini-unhinged-llama-3-1-8b#accounts/sentientfoundation/deployments/81e155fc",
        messages=[
            {"role": "system", "content": ANGEL_SYSTEM_PROMPT},
            {"role": "user", "content": message}
        ],
        temperature=0.7,
        max_tokens=500,
        stream=True  # Enable streaming
    )
    
    print("Angel response:")
    
    for chunk in stream:
        if chunk.choices[0].delta.content is not None:
            response += chunk.choices[0].delta.content
            print(chunk.choices[0].delta.content, end="", flush=True)
    print()  # New line after streaming completes
    return response

async def generate_devil_response(message: str, client: Fireworks) -> str:
    response = ""
    stream = client.chat.completions.create(
        model="accounts/sentientfoundation/models/dobby-mini-unhinged-llama-3-1-8b#accounts/sentientfoundation/deployments/81e155fc",
        # model="accounts/fireworks/deployments/22e7b3fd",
        messages=[
            {"role": "system", "content": DEVIL_SYSTEM_PROMPT},
            {"role": "user", "content": message}
        ],
        temperature=0.7,
        max_tokens=500,
        stream=True  # Enable streaming
    )
    
    print("Devil response:")
    
    for chunk in stream:
        if chunk.choices[0].delta.content is not None:
            print(chunk.choices[0].delta.content, end="", flush=True)
            response += chunk.choices[0].delta.content
            # print("\r😈 Devil says: " + response, end="", flush=True)
    print()  # New line after streaming completes
    return response

async def process_dilemma(message: str, conversation_history: List[Message] = None):
    if conversation_history is None:
        conversation_history = []

    # Add human message
    human_message = Message(role="human", content=message)
    conversation_history.append(human_message)

    # Generate responses with streaming
    angel_response = await generate_angel_response(message, client)
    devil_response = await generate_devil_response(message, client)

    # Add agent responses to conversation
    angel_message = Message(role="angel", content=angel_response)
    devil_message = Message(role="devil", content=devil_response)
    conversation_history.extend([angel_message, devil_message])

    return conversation_history

async def main():
    conversation_history = []
    print("Welcome to the Moral Dilemma Advisor!")
    print("Type 'quit' to exit\n")

    while True:
        message = input("\nEnter your message: ").strip()
        if message.lower() == 'quit':
            break

        conversation_history = await process_dilemma(message, conversation_history)

# Pydantic models for request/response handling
class ConversationRequest(BaseModel):
    message: str
    conversation_history: Optional[List[dict]] = None

class ConversationResponse(BaseModel):
    response: str
    conversation_history: List[dict]

app = FastAPI()


async def generate_angel_response_stream(message: str, client: Fireworks) -> AsyncGenerator[str, None]:
    stream = client.chat.completions.create(
        model="accounts/sentientfoundation/models/dobby-mini-unhinged-llama-3-1-8b#accounts/sentientfoundation/deployments/81e155fc",
        messages=[
            {"role": "system", "content": ANGEL_SYSTEM_PROMPT},
            {"role": "user", "content": message}
        ],
        temperature=0.7,
        max_tokens=500,
        stream=True
    )
    
    for chunk in stream:
        if chunk.choices[0].delta.content is not None:
            yield chunk.choices[0].delta.content

async def generate_devil_response_stream(message: str, client: Fireworks) -> AsyncGenerator[str, None]:
    stream = client.chat.completions.create(
        model="accounts/sentientfoundation/models/dobby-mini-unhinged-llama-3-1-8b#accounts/sentientfoundation/deployments/81e155fc",
        messages=[
            {"role": "system", "content": DEVIL_SYSTEM_PROMPT},
            {"role": "user", "content": message}
        ],
        temperature=0.7,
        max_tokens=500,
        stream=True
    )
    
    for chunk in stream:
        if chunk.choices[0].delta.content is not None:
            yield chunk.choices[0].delta.content

async def stream_response(generator: AsyncGenerator[str, None]):
    try:
        async for chunk in generator:
            yield f"data: {json.dumps({'chunk': chunk})}\n\n"
    except Exception as e:
        yield f"data: {json.dumps({'error': str(e)})}\n\n"
    finally:
        yield "data: [DONE]\n\n"

@app.post("/api/angel/stream")
async def angel_stream_endpoint(request: ConversationRequest):
    return StreamingResponse(
        stream_response(generate_angel_response_stream(request.message, client)),
        media_type="text/event-stream"
    )

@app.post("/api/devil/stream")
async def devil_stream_endpoint(request: ConversationRequest):
    return StreamingResponse(
        stream_response(generate_devil_response_stream(request.message, client)),
        media_type="text/event-stream"
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Specify your frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if __name__ == "__main__":
    asyncio.run(main())