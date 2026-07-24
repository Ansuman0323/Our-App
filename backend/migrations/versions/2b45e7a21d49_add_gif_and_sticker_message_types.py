"""add gif and sticker message types

Revision ID: 2b45e7a21d49
Revises: 9a71d18249f1
Create Date: 2026-07-17 00:54:36.928816

"""

from alembic import op

revision = "2b45e7a21d49"
down_revision = "9a71d18249f1"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("ALTER TYPE messagetype ADD VALUE IF NOT EXISTS 'GIF';")
    op.execute("ALTER TYPE messagetype ADD VALUE IF NOT EXISTS 'STICKER';")


def downgrade():
    pass