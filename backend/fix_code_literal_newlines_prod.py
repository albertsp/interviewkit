"""
Self-contained repair script for production: does not import
app.services.ai_service.fix_literal_escapes because that fix has not been
deployed yet. Run inside the interview-prep-api machine, where DATABASE_URL
is already set as an env var.
"""
from app import create_app, db
from app.models.card import Card

FIELDS = ("definition", "explanation", "use_case", "avoid_when", "mnemonic", "code")


def fix_literal_escapes(text):
    if not isinstance(text, str) or "\\" not in text:
        return text
    return (
        text.replace("\\r\\n", "\n")
            .replace("\\n", "\n")
            .replace("\\t", "\t")
    )


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
