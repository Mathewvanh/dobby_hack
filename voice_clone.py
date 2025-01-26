from elevenlabs import play, Voice
from elevenlabs.client import ElevenLabs
from dotenv import load_dotenv
import os
import time
from functools import wraps

load_dotenv()
ELEVEN_API_KEY = os.getenv("ELEVEN_API_KEY")

def timer_decorator(func):
    """
    Decorator to measure and print the execution time of functions.
    """
    @wraps(func)
    def wrapper(*args, **kwargs):
        start_time = time.time()
        result = func(*args, **kwargs)
        end_time = time.time()
        print(f"{func.__name__} took {end_time - start_time:.2f} seconds to execute.")
        return result
    return wrapper

@timer_decorator
def init_client() -> ElevenLabs:
    """Initialize and return an ElevenLabs client instance.
    
    Returns:
        ElevenLabs: An initialized ElevenLabs client object ready for API interactions.
    """
    client = ElevenLabs(
        api_key=ELEVEN_API_KEY,
    )
    print("ElevenLabs client initialized.")
    return client

@timer_decorator
def clone_voice(client: ElevenLabs, name: str, description: str, file_path_lists: list[str]) -> Voice:
    """Clone a voice using provided audio samples.
    
    Args:
        client (ElevenLabs): The initialized ElevenLabs client.
        name (str): Name to assign to the cloned voice.
        description (str): Description of the voice characteristics.
        file_path_lists (list[str]): List of paths to audio sample files for voice cloning.

    Returns:
        Voice: A Voice object representing the cloned voice.
    """
    voice = client.clone(
        name=name,
        description=description,
        files=file_path_lists,
    )
    print("Voice cloned successfully.")
    return voice

@timer_decorator
def text_to_speech(client: ElevenLabs, voice: Voice, text: str):
    """Generate speech using the cloned voice.
    
    Args:
        client (ElevenLabs): The initialized ElevenLabs client.
        voice (Voice): The cloned voice to use for speech generation.
        text (str): The text to be converted to speech.

    Returns:
        Audio: An Audio object representing the generated speech.
    """
    audio = client.generate(text=text, voice=voice, model="eleven_multilingual_v2")
    print("Audio generated successfully.")
    return audio

@timer_decorator
def main() -> None:
    """Main function to demonstrate voice cloning and text-to-speech generation.
    
    This function initializes the ElevenLabs client, clones a voice using
    audio files, and generates speech using the cloned voice. 
    The speech will be played out.
    
    Returns:
        None
    """
    client = init_client()
    # Hardcoded data for testing
    voice = clone_voice(
        client,
        "Joker",
        "You are the joker from batman, mean, raw and unfiltered",
        [
            "/Users/wenjiehu/Developer/dobby/dobby_hack/data/Joker voice.m4a",
        ]
    )
    audio = text_to_speech(client, voice, 
            "Why so serious?"
            "I'm not a monster, I'm just ahead of the curve."
    )
    play(audio)

if __name__ == "__main__":
    main()