"""add indexes on foreign key columns (session.user_id, question.session_id, card.user_id/session_id/question_id)

Revision ID: f1a2b3c4d5e6
Revises: effcd837c83d
Create Date: 2026-06-20 00:00:00.000000

"""
from alembic import op


# revision identifiers, used by Alembic.
revision = 'f1a2b3c4d5e6'
down_revision = 'effcd837c83d'
branch_labels = None
depends_on = None


def upgrade():
    op.create_index(op.f('ix_session_user_id'), 'session', ['user_id'])
    op.create_index(op.f('ix_question_session_id'), 'question', ['session_id'])
    op.create_index(op.f('ix_card_user_id'), 'card', ['user_id'])
    op.create_index(op.f('ix_card_session_id'), 'card', ['session_id'])
    op.create_index(op.f('ix_card_question_id'), 'card', ['question_id'])


def downgrade():
    op.drop_index(op.f('ix_card_question_id'), table_name='card')
    op.drop_index(op.f('ix_card_session_id'), table_name='card')
    op.drop_index(op.f('ix_card_user_id'), table_name='card')
    op.drop_index(op.f('ix_question_session_id'), table_name='question')
    op.drop_index(op.f('ix_session_user_id'), table_name='session')
