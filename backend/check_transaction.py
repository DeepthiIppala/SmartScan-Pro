from app import create_app
from app.models import Transaction

app = create_app()

with app.app_context():
    t = Transaction.query.get(14)
    if t:
        print(f"Transaction 14:")
        print(f"  Total: ${t.total_amount}")
        print(f"  Requires Audit: {t.requires_audit}")
        print(f"  Audit Reason: {t.audit_reason}")
    else:
        print("Transaction 14 not found")
