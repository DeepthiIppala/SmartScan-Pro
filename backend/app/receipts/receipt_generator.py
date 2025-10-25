"""
Digital Receipt Generator
Creates formatted text and HTML receipts for transactions
"""
from datetime import datetime
from ..models import Transaction

class ReceiptGenerator:
    def __init__(self):
        self.store_name = "SmartScan Pro"
        self.store_address = "123 Main Street, Jersey City, NJ 07310"
        self.store_phone = "(201) 555-0100"

    def generate_text_receipt(self, transaction: Transaction) -> str:
        """Generate a plain text receipt"""
        receipt = []
        receipt.append("=" * 50)
        receipt.append(self.store_name.center(50))
        receipt.append(self.store_address.center(50))
        receipt.append(f"Phone: {self.store_phone}".center(50))
        receipt.append("=" * 50)
        receipt.append("")
        receipt.append(f"Order ID: #{transaction.id}")
        receipt.append(f"Date: {transaction.created_at.strftime('%Y-%m-%d %H:%M:%S')}")
        if hasattr(transaction, 'payment_intent_id') and transaction.payment_intent_id:
            receipt.append(f"Payment ID: {transaction.payment_intent_id}")
        receipt.append("")
        receipt.append("-" * 50)
        receipt.append(f"{'Item':<30} {'Qty':<5} {'Price':<15}")
        receipt.append("-" * 50)

        for item in transaction.items:
            name = item.product.name[:28] if len(item.product.name) > 28 else item.product.name
            receipt.append(f"{name:<30} {item.quantity:<5} ${item.price_at_purchase * item.quantity:>12.2f}")

        receipt.append("-" * 50)
        receipt.append(f"{'TOTAL':<36} ${transaction.total_amount:>12.2f}")
        receipt.append("=" * 50)
        receipt.append("")
        receipt.append("Thank you for shopping with SmartScan Pro!".center(50))
        receipt.append("Please save this receipt for your records".center(50))
        receipt.append("")

        return "\n".join(receipt)

    def generate_html_receipt(self, transaction: Transaction) -> str:
        """Generate an HTML receipt"""
        items_html = ""
        for item in transaction.items:
            items_html += f"""
            <tr>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">{item.product.name}</td>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">{item.quantity}</td>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${item.price_at_purchase:.2f}</td>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">${item.price_at_purchase * item.quantity:.2f}</td>
            </tr>
            """

        payment_id_row = ""
        if hasattr(transaction, 'payment_intent_id') and transaction.payment_intent_id:
            payment_id_row = f"""
            <tr>
                <td style="padding: 8px 0; color: #6b7280;"><strong>Payment ID:</strong></td>
                <td style="padding: 8px 0; color: #374151; text-align: right;" colspan="3">{transaction.payment_intent_id}</td>
            </tr>
            """

        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Receipt #{transaction.id}</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb; padding: 20px; margin: 0;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); overflow: hidden;">
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 32px; text-align: center;">
                    <h1 style="margin: 0 0 8px 0; font-size: 28px; font-weight: 700;">{self.store_name}</h1>
                    <p style="margin: 0; opacity: 0.9; font-size: 14px;">{self.store_address}</p>
                    <p style="margin: 4px 0 0 0; opacity: 0.9; font-size: 14px;">Phone: {self.store_phone}</p>
                </div>

                <!-- Order Info -->
                <div style="padding: 24px; background-color: #f9fafb; border-bottom: 1px solid #e5e7eb;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 8px 0; color: #6b7280;"><strong>Order ID:</strong></td>
                            <td style="padding: 8px 0; color: #374151; text-align: right; font-weight: 600;">#{transaction.id}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #6b7280;"><strong>Date:</strong></td>
                            <td style="padding: 8px 0; color: #374151; text-align: right;">{transaction.created_at.strftime('%B %d, %Y at %I:%M %p')}</td>
                        </tr>
                        {payment_id_row}
                    </table>
                </div>

                <!-- Items Table -->
                <div style="padding: 24px;">
                    <h2 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #111827;">Order Items</h2>
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background-color: #f9fafb;">
                                <th style="padding: 12px; text-align: left; font-weight: 600; color: #6b7280; font-size: 14px; border-bottom: 2px solid #e5e7eb;">Item</th>
                                <th style="padding: 12px; text-align: center; font-weight: 600; color: #6b7280; font-size: 14px; border-bottom: 2px solid #e5e7eb;">Qty</th>
                                <th style="padding: 12px; text-align: right; font-weight: 600; color: #6b7280; font-size: 14px; border-bottom: 2px solid #e5e7eb;">Price</th>
                                <th style="padding: 12px; text-align: right; font-weight: 600; color: #6b7280; font-size: 14px; border-bottom: 2px solid #e5e7eb;">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items_html}
                        </tbody>
                    </table>
                </div>

                <!-- Total -->
                <div style="padding: 24px; background-color: #f9fafb; border-top: 2px solid #e5e7eb;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-size: 20px; font-weight: 700; color: #111827;">TOTAL</span>
                        <span style="font-size: 28px; font-weight: 700; color: #10b981;">${transaction.total_amount:.2f}</span>
                    </div>
                </div>

                <!-- Footer -->
                <div style="padding: 24px; text-align: center; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0 0 8px 0; color: #374151; font-weight: 600;">Thank you for shopping with SmartScan Pro!</p>
                    <p style="margin: 0; color: #6b7280; font-size: 14px;">Please save this receipt for your records</p>
                </div>
            </div>
        </body>
        </html>
        """

        return html

# Create singleton instance
receipt_generator = ReceiptGenerator()
