"""
One-off repair for cards saved before the fix_literal_escapes() normalization
existed: their `code` (and other text) columns may contain the literal two
characters backslash+n instead of a real line break.

Run once, with the same environment/DB config the app uses:
    python fix_code_literal_newlines.py
"""
from app import create_app, db
from app.models.card import Card
from app.services.ai_service import fix_literal_escapes

FIELDS = ("definition", "explanation", "use_case", "avoid_when", "mnemonic", "code")

app = create_app()

with app.app_context():
    cards = Card.query.all()
    fixed = 0
    for card in cards:
        changed = False
        for field in FIELDS:
            value = getattr(card, field)
            new_value = fix_literal_escapes(value)
            if new_value != value:
                setattr(card, field, new_value)
                changed = True
        if changed:
            fixed += 1
    db.session.commit()
    print(f"Checked {len(cards)} cards, fixed {fixed}.")
