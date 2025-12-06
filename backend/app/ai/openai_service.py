import openai
import os
from PIL import Image
import io
import base64

class OpenAIService:
    def __init__(self):
        api_key = os.getenv('OPENAI_API_KEY')
        if not api_key or api_key == 'your-openai-api-key-here':
            raise ValueError("Please set OPENAI_API_KEY in your .env file")

        openai.api_key = api_key
        self.client = openai.OpenAI(api_key=api_key)

    def recognize_product(self, image_data):
        """
        AI Feature 1: Product Recognition using Computer Vision
        Identifies products from images when barcodes are not available
        """
        try:
            # Decode base64 image
            if isinstance(image_data, str) and image_data.startswith('data:image'):
                # Keep the full data URL for OpenAI
                image_url = image_data
            else:
                # If just base64, add data URL prefix
                image_url = f"data:image/jpeg;base64,{image_data}"

            prompt = """You are a product recognition AI for a smart self-checkout system.
            Analyze this image and identify the product.

            Respond ONLY in this JSON format:
            {
                "product_name": "exact product name",
                "confidence": 0.95,
                "category": "category name",
                "description": "brief description"
            }

            If you cannot identify the product with high confidence, set confidence below 0.7"""

            response = self.client.chat.completions.create(
                model="gpt-4o-mini",  # Cost-effective vision model
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {"url": image_url}
                            }
                        ]
                    }
                ],
                max_tokens=300
            )

            return response.choices[0].message.content

        except Exception as e:
            raise Exception(f"Product recognition failed: {str(e)}")

    def chat_assistant(self, user_message, conversation_history=None):
        """
        AI Feature 2: Shopping Assistant Chatbot
        Helps users find products, answers questions, provides recommendations
        """
        try:
            system_prompt = """You are a helpful shopping assistant for SmartScan Pro, a smart self-checkout application.

            Your capabilities:
            - Help users find products in the store
            - Answer questions about products, prices, and promotions
            - Provide shopping tips and suggestions
            - Assist with checkout process
            - Handle customer service inquiries

            Be friendly, concise, and helpful. If you don't know something, admit it politely.
            """

            # Build messages array
            messages = [{"role": "system", "content": system_prompt}]

            if conversation_history:
                messages.extend(conversation_history)

            messages.append({"role": "user", "content": user_message})

            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=messages,
                max_tokens=500
            )

            return response.choices[0].message.content

        except Exception as e:
            raise Exception(f"Chat assistant failed: {str(e)}")

    def visual_product_search(self, image_data, available_products):
        """
        AI Feature: Visual Product Search
        Upload any photo and find similar products in store inventory
        """
        try:
            # Decode base64 image
            if isinstance(image_data, str) and image_data.startswith('data:image'):
                image_url = image_data
            else:
                image_url = f"data:image/jpeg;base64,{image_data if ',' not in image_data else image_data.split(',')[1]}"

            # Build product catalog for AI
            product_list = "\n".join([
                f"- {p['name']} (${p['price']}) - Category: {p.get('category', 'General')}"
                for p in available_products
            ])

            prompt = f"""Analyze this image and find similar or matching products from this store inventory.

            AVAILABLE PRODUCTS:
            {product_list}

            Your task:
            1. Identify the main item(s) in the image (clothing, accessories, home goods, etc.)
            2. Match them to similar products in the inventory
            3. Rank matches by similarity (exact match, similar style, same category, etc.)

            Return results as JSON with NO markdown formatting:
            {{
                "identified_item": "description of item in photo",
                "matches": [
                    {{
                        "product_name": "exact product name from inventory",
                        "match_reason": "why this matches (exact/similar style/same category)",
                        "confidence": 0.95
                    }}
                ],
                "search_tips": "if no good matches, suggest what to search for"
            }}

            Focus on finding the BEST matches. If there are no similar products, suggest the closest category."""

            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {"url": image_url}
                            }
                        ]
                    }
                ],
                max_tokens=500
            )

            return response.choices[0].message.content

        except Exception as e:
            raise Exception(f"Visual search failed: {str(e)}")

    def generate_recommendations(self, user_history, current_cart=None, available_products=None):
        """
        AI Feature 4: Smart Recommendations
        Generates personalized product recommendations based on shopping history and current cart
        """
        try:
            # Build context about current cart
            cart_context = "Empty cart" if not current_cart or len(current_cart) == 0 else f"Current cart has: {current_cart}"

            # Build available products list
            product_list = "No products available"
            if available_products:
                product_list = "\n".join([
                    f"- {p['name']} (${p['price']}) - Category: {p.get('category', 'General')}"
                    for p in available_products
                ])

            prompt = f"""You are a smart recommendation engine for a retail store.

            CURRENT SHOPPING SESSION:
            {cart_context}

            PAST PURCHASES:
            {user_history if user_history else 'No purchase history'}

            AVAILABLE PRODUCTS IN STORE:
            {product_list}

            TASK: Analyze what's in the current cart and recommend 3-5 complementary products.

            MATCHING RULES (in order of priority):
            1. If cart has SHOES/FOOTWEAR → recommend ATHLETIC WEAR, SOCKS, or ACCESSORIES
            2. If cart has CLOTHING → recommend matching ACCESSORIES, SHOES, or similar CLOTHING items
            3. If cart has HANDBAGS/ACCESSORIES → recommend matching CLOTHING or SHOES
            4. If cart has FOOD/GROCERY → recommend other FOOD/GROCERY items
            5. If cart has KITCHEN items → recommend other KITCHEN or HOME items

            CRITICAL RULES:
            - You MUST use EXACT product names from the AVAILABLE PRODUCTS list
            - Focus on items from the SAME or COMPLEMENTARY categories
            - Example: Running Shoes → recommend Athletic Socks, Gym T-Shirts, Sports Watch
            - Example: Cardigan → recommend Jeans, Handbag, Scarf
            - DO NOT recommend random unrelated items

            Respond ONLY in this exact JSON format (no markdown):
            {{
                "recommendations": [
                    {{"product": "Exact Product Name", "reason": "brief reason"}},
                    {{"product": "Exact Product Name", "reason": "brief reason"}},
                    {{"product": "Exact Product Name", "reason": "brief reason"}}
                ]
            }}
            """

            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=400
            )

            return response.choices[0].message.content

        except Exception as e:
            raise Exception(f"Recommendations generation failed: {str(e)}")

    def detect_fraud_patterns(self, scan_data, user_behavior):
        """
        AI Feature 3: Fraud Detection
        Analyzes scanning patterns and user behavior to detect potential fraud
        """
        try:
            prompt = f"""You are a fraud detection AI for a self-checkout system.

            Analyze this data for suspicious patterns:

            Scan Data: {scan_data}
            User Behavior: {user_behavior}

            Look for:
            - Unusual scanning patterns (too fast, skipped items)
            - Mismatched product types
            - High-value items scanned as low-value items
            - Repeated failed scans
            - Suspicious timing patterns

            Respond in JSON format:
            {{
                "risk_level": "low/medium/high",
                "confidence": 0.85,
                "flags": ["list of suspicious patterns found"],
                "recommendation": "action to take"
            }}

            If no suspicious activity, return risk_level: "low" with empty flags.
            """

            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=300
            )

            return response.choices[0].message.content

        except Exception as e:
            raise Exception(f"Fraud detection failed: {str(e)}")
