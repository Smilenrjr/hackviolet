import os
from google import genai

print(os.environ['HOME'])
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))