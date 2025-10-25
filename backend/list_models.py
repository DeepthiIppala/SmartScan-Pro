"""
Script to list available Gemini models
"""
import google.generativeai as genai
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

api_key = os.getenv('GEMINI_API_KEY')
genai.configure(api_key=api_key)

print("Available Gemini models:")
print("-" * 50)

for model in genai.list_models():
    if 'generateContent' in model.supported_generation_methods:
        print(f"Model: {model.name}")
        print(f"  Display Name: {model.display_name}")
        print(f"  Description: {model.description}")
        print(f"  Supported methods: {model.supported_generation_methods}")
        print("-" * 50)
