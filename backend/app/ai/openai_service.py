import openai
import os


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
            if isinstance(image_data, str) and image_data.startswith('data:image'):
                image_url = image_data
            else:
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
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {"type": "image_url", "image_url": {"url": image_url}},
                        ],
                    }
                ],
                max_tokens=300,
            )

            return response.choices[0].message.content

        except Exception as e:
            raise Exception(f"Product recognition failed: {str(e)}")

    def chat_assistant(self, user_message, conversation_history=None):
        """
        AI Feature 2: Shopping Assistant Chatbot
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

            messages = [{"role": "system", "content": system_prompt}]

            if conversation_history:
                messages.extend(conversation_history)

            messages.append({"role": "user", "content": user_message})

            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=messages,
                max_tokens=500,
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
            if isinstance(image_data, str) and image_data.startswith('data:image'):
                image_url = image_data
            else:
                image_url = f"data:image/jpeg;base64,{image_data if ',' not in image_data else image_data.split(',')[1]}"

            product_list = "\n".join(
                [
                    f"- id:{p['id']} | name:{p['name']} | barcode:{p['barcode']} | category:{p.get('category', 'General')} | price:{p['price']}"
                    for p in available_products
                ]
            )

            prompt = f"""Analyze this image and find similar or matching products from the store inventory.

INVENTORY (use ONLY these items):
{product_list}

Your task:
1) Identify the main item(s) in the image (home goods, apparel, kitchen, etc.)
2) Select the best matching products from the INVENTORY list (prefer same category first)
3) Rank matches by similarity (exact > very similar style > same category)

STRICT OUTPUT (JSON only, no markdown):
{{
  "identified_item": "short description of item in photo",
  "matches": [
    {{
      "product_id": <id from inventory>,
      "barcode": "<barcode from inventory>",
      "product_name": "<exact inventory name>",
      "match_reason": "why this matches",
      "confidence": 0.0
    }}
  ],
  "search_tips": "if no good match, suggest closest category"
}}

Rules:
- Only use product_id/barcode from the provided inventory.
- Prefer same category; avoid random unrelated items.
- Cap confidence at 1.0 and do not invent products."""

            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {"type": "image_url", "image_url": {"url": image_url}},
                        ],
                    }
                ],
                max_tokens=500,
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
            cart_context = "Empty cart" if not current_cart or len(current_cart) == 0 else f"Current cart has: {current_cart}"

            product_list = "No products available"
            if available_products:
                product_list = "\n".join(
                    [
                        f"- id:{p['id']} | name:{p['name']} | category:{p.get('category', 'General')} | barcode:{p.get('barcode', '')} | price:{p['price']}"
                        for p in available_products
                    ]
                )

            prompt = f"""You are a smart recommendation engine for a retail store.

CURRENT SHOPPING SESSION:
{cart_context}

PAST PURCHASES:
{user_history if user_history else 'No purchase history'}

AVAILABLE PRODUCTS IN STORE:
{product_list}

TASK: Analyze what's in the current cart and recommend 2-3 complementary products.

            MATCHING RULES (priority):
            1. Shoes/footwear -> athletic wear, socks, accessories
            2. Clothing -> matching accessories, shoes, similar clothing
            3. Handbags/accessories -> matching clothing or shoes
            4. Food/grocery -> other food/grocery items
            5. Kitchen -> other kitchen or home items

            CRITICAL RULES:
            - Only return products from AVAILABLE PRODUCTS (exact name/id/barcode).
            - Prefer same or complementary categories to what's in cart/history.
            - Do not invent products.

            Respond ONLY in this exact JSON format (no markdown):
            {{
              "recommendations": [
                {{"product_id": <id>, "barcode": "<barcode>", "product_name": "Exact Product Name", "reason": "brief reason"}},
                {{"product_id": <id>, "barcode": "<barcode>", "product_name": "Exact Product Name", "reason": "brief reason"}},
                {{"product_id": <id>, "barcode": "<barcode>", "product_name": "Exact Product Name", "reason": "brief reason"}}
              ]
            }}
            """

            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=400,
            )

            return response.choices[0].message.content

        except Exception as e:
            raise Exception(f"Recommendations generation failed: {str(e)}")

    def detect_fraud_patterns(self, scan_data, user_behavior):
        """
        AI Feature 3: Fraud Detection
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
                max_tokens=300,
            )

            return response.choices[0].message.content

        except Exception as e:
            raise Exception(f"Fraud detection failed: {str(e)}")
