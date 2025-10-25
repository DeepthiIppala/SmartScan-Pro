"""
Stripe Payment Service
Handles payment processing through Stripe API
"""
import stripe
import os
from dotenv import load_dotenv

load_dotenv()

class StripeService:
    def __init__(self):
        """Initialize Stripe with secret key"""
        stripe.api_key = os.getenv('STRIPE_SECRET_KEY')
        self.publishable_key = os.getenv('STRIPE_PUBLISHABLE_KEY')

    def create_payment_intent(self, amount, currency='usd', metadata=None):
        """
        Create a payment intent for processing payment

        Args:
            amount (float): Amount to charge in dollars (will be converted to cents)
            currency (str): Currency code (default: usd)
            metadata (dict): Additional metadata to attach to payment

        Returns:
            dict: Payment intent object with client_secret
        """
        try:
            # Convert dollars to cents (Stripe uses smallest currency unit)
            amount_cents = int(amount * 100)

            # Create payment intent
            payment_intent = stripe.PaymentIntent.create(
                amount=amount_cents,
                currency=currency,
                metadata=metadata or {},
                automatic_payment_methods={
                    'enabled': True,
                },
            )

            return {
                'client_secret': payment_intent.client_secret,
                'payment_intent_id': payment_intent.id,
                'amount': amount,
                'status': payment_intent.status
            }
        except stripe.error.StripeError as e:
            raise Exception(f"Stripe error: {str(e)}")

    def confirm_payment(self, payment_intent_id):
        """
        Confirm and retrieve payment intent status

        Args:
            payment_intent_id (str): The payment intent ID to confirm

        Returns:
            dict: Payment intent status and details
        """
        try:
            payment_intent = stripe.PaymentIntent.retrieve(payment_intent_id)

            return {
                'status': payment_intent.status,
                'amount': payment_intent.amount / 100,  # Convert cents back to dollars
                'currency': payment_intent.currency,
                'payment_method': payment_intent.payment_method
            }
        except stripe.error.StripeError as e:
            raise Exception(f"Stripe error: {str(e)}")

    def refund_payment(self, payment_intent_id, amount=None):
        """
        Refund a payment (full or partial)

        Args:
            payment_intent_id (str): The payment intent ID to refund
            amount (float, optional): Amount to refund in dollars. If None, full refund.

        Returns:
            dict: Refund details
        """
        try:
            refund_params = {'payment_intent': payment_intent_id}

            if amount is not None:
                refund_params['amount'] = int(amount * 100)

            refund = stripe.Refund.create(**refund_params)

            return {
                'refund_id': refund.id,
                'status': refund.status,
                'amount': refund.amount / 100,
                'currency': refund.currency
            }
        except stripe.error.StripeError as e:
            raise Exception(f"Stripe error: {str(e)}")

    def get_publishable_key(self):
        """Get the publishable key for frontend"""
        return self.publishable_key

# Create singleton instance
stripe_service = StripeService()
