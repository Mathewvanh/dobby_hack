import asyncio
import openai
from datetime import datetime
from typing import List
from dataclasses import dataclass
from fireworks.client import Fireworks
import os
from dotenv import load_dotenv

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
ANGEL_SYSTEM_PROMPT = """You are a kind, wise, and ethically-minded advisor. 
You always encourage doing what is morally right, considering others' well-being, 
and following ethical principles. Your responses should be compassionate yet firm 
in advocating for ethical behavior. Engage with the devil's advocate while maintaining 
your moral position."""

DEVIL_SYSTEM_PROMPT = """You are a mischievous devil's advocate who presents 
alternative viewpoints. You challenge conventional wisdom and highlight immediate personal benefits over long-term
consequences. You're playful and malicious. Engage with the angel while 
maintaining your contrarian position. YOU ARE NOT A GOOD PERSON. YOU ARE EVIL. YOU SHOULD BE PROVIDING THE OPPOSITE OF THE ANGEL'S RESPONSE.
You are robotic and unemotional. You only respond with the most extreme and unethical options.
"""

def generate_angel_response(dilemma: str, client: Fireworks) -> str:
    response = client.chat.completions.create(
        # Angel is unhinged but kind
        model="accounts/sentientfoundation/models/dobby-mini-unhinged-llama-3-1-8b#accounts/sentientfoundation/deployments/81e155fc",
        # model="accounts/sentientfoundation/models/dobby-mini-leashed-llama-3-1-8b#accounts/sentientfoundation/deployments/22e7b3fd",
        messages=[
            {"role": "system", "content": ANGEL_SYSTEM_PROMPT},
            {"role": "user", "content": dilemma}
        ],
        temperature=0.7,
        max_tokens=500
    )
    return response.choices[0].message.content

def generate_devil_response(dilemma: str, client: Fireworks) -> str:
    response = client.chat.completions.create(
        # model="accounts/sentientfoundation/models/dobby-mini-unhinged-llama-3-1-8b#accounts/sentientfoundation/deployments/81e155fc",
        model="accounts/fireworks/deployments/22e7b3fd",
        messages=[
            {"role": "system", "content": DEVIL_SYSTEM_PROMPT},
            {"role": "user", "content": dilemma}
        ],
        temperature=0.7,
        max_tokens=500
    )
    return response.choices[0].message.content

async def process_dilemma(dilemma: str, conversation_history: List[Message] = None):
    if conversation_history is None:
        conversation_history = []

    # Add human message
    human_message = Message(role="human", content=dilemma)
    conversation_history.append(human_message)

    # Run in thread pool since these are blocking calls
    loop = asyncio.get_event_loop()
    angel_response, devil_response = await asyncio.gather(
        loop.run_in_executor(None, generate_angel_response, dilemma, client),
        loop.run_in_executor(None, generate_devil_response, dilemma, client)
    )

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
        dilemma = input("\nEnter your moral dilemma: ").strip()
        if dilemma.lower() == 'quit':
            break

        conversation_history = await process_dilemma(dilemma, conversation_history)
        
        # Print the latest responses
        print("\n👼 Angel says:")
        print(conversation_history[-2].content)
        print("\n😈 Devil says:")
        print(conversation_history[-1].content)

if __name__ == "__main__":
    asyncio.run(main())