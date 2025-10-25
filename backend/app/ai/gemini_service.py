import google.generativeai as genai
import os
from PIL import Image
import io
import base64

class GeminiService:
    def __init__(self):
        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key or api_key == 'your-gemini-api-key-here':
            raise ValueError("Please set GEMINI_API_KEY in your .env file")

        genai.configure(api_key=api_key)

        # Initialize models - using stable Gemini 2.5 Flash (fast, multimodal, supports vision)
        self.vision_model = genai.GenerativeModel('gemini-2.5-flash')
        self.text_model = genai.GenerativeModel('gemini-2.5-flash')

    def recognize_product(self, image_data):
        """
        AI Feature 1: Product Recognition using Computer Vision
        Identifies products from images when barcodes are not available
        """
        try:
            # Decode base64 image
            if isinstance(image_data, str) and image_data.startswith('data:image'):
                # Remove data URL prefix
                image_data = image_data.split(',')[1]

            image_bytes = base64.b64decode(image_data)
            image = Image.open(io.BytesIO(image_bytes))

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

            response = self.vision_model.generate_content([prompt, image])
            return response.text

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

            # Build conversation context
            messages = []
            if conversation_history:
                messages.extend(conversation_history)

            messages.append({
                "role": "user",
                "content": f"{system_prompt}\n\nUser: {user_message}"
            })

            response = self.text_model.generate_content(user_message)
            return response.text

        except Exception as e:
            raise Exception(f"Chat assistant failed: {str(e)}")

    def visual_product_search(self, image_data, available_products):
        """
        AI Feature: Visual Product Search
        Upload any photo and find similar products in store inventory
        """
        try:
            import base64
            from PIL import Image
            import io

            # Decode base64 image
            image_bytes = base64.b64decode(image_data.split(',')[1] if ',' in image_data else image_data)
            image = Image.open(io.BytesIO(image_bytes))

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

            response = self.vision_model.generate_content([prompt, image])
            return response.text

        except Exception as e:
            raise Exception(f"Visual search failed: {str(e)}")

    def generate_recommendations(self, user_history, current_cart=None):
        """
        AI Feature 4: Smart Recommendations
        Generates personalized product recommendations based on shopping history and current cart
        """
        try:
            # Build context about current cart
            cart_context = "Empty cart" if not current_cart or len(current_cart) == 0 else f"Current cart has: {current_cart}"

            prompt = f"""You are a smart recommendation engine for a retail store.

            CURRENT SHOPPING SESSION (PRIORITY):
            {cart_context}

            User's past shopping history: {user_history if user_history else 'No history'}

            IMPORTANT: Recommend products that go well with what's CURRENTLY IN THE CART.
            If the cart has clothing items, recommend clothing accessories.
            If the cart has food items, recommend complementary food items.

            Based on this data, suggest 3-5 products the user might want to buy.
            Consider:
            - Items that complement what's currently in the cart (HIGHEST PRIORITY)
            - Frequently bought together items
            - Matching accessories or related products
            - Similar category items

            Respond ONLY in this exact JSON format (no markdown, no code blocks):
            {{
                "recommendations": [
                    {{"product": "Product Name", "reason": "why recommend this"}},
                    {{"product": "Another Product", "reason": "why recommend this"}}
                ]
            }}
            """

            response = self.text_model.generate_content(prompt)
            return response.text

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

            response = self.text_model.generate_content(prompt)
            return response.text

        except Exception as e:
            raise Exception(f"Fraud detection failed: {str(e)}")
