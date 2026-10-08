"""add ai_call table (metadata of every Groq call: latency, tokens, status)

Revision ID: a7c9e1b3d5f2
Revises: d3e4f5a6b7c8
Create Date: 2026-10-08 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a7c9e1b3d5f2'
down_revision = 'd3e4f5a6b7c8'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'ai_call',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('kind', sa.String(length=20), nullable=False),
        sa.Column('model', sa.String(length=80), nullable=False),
        sa.Column('stack', sa.String(length=80), nullable=True),
        sa.Column('level', sa.String(length=20), nullable=True),
        sa.Column('topic', sa.String(length=80), nullable=True),
        sa.Column('user_id', sa.Integer(), nullable=True),
        # No foreign key on purpose: create_session deletes the session row
        # when the AI fails, and we want to keep the record of that failure.
        sa.Column('session_id', sa.Integer(), nullable=True),
        sa.Column('attempt', sa.Integer(), nullable=False),
        sa.Column('latency_ms', sa.Integer(), nullable=False),
        sa.Column('prompt_tokens', sa.Integer(), nullable=True),
        sa.Column('completion_tokens', sa.Integer(), nullable=True),
        sa.Column('total_tokens', sa.Integer(), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('http_status', sa.Integer(), nullable=True),
        sa.Column('error_type', sa.String(length=80), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['user.user_id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_ai_call_created_at'), 'ai_call', ['created_at'])
    op.create_index('ix_ai_call_kind_status', 'ai_call', ['kind', 'status'])


def downgrade():
    op.drop_index('ix_ai_call_kind_status', table_name='ai_call')
    op.drop_index(op.f('ix_ai_call_created_at'), table_name='ai_call')
    op.drop_table('ai_call')
