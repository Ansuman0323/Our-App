"""add missing unique constraints

Revision ID: 004_add_missing_unique_constraints
Revises: 003_final_core_refinement
Create Date: 2026-07-11 23:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '004_add_missing_unique_constraints'
down_revision = '003_final_core_refinement'
branch_labels = None
depends_on = None


def upgrade():
    # Explicitly create formal UNIQUE constraints
    op.create_unique_constraint('uq_spaces_invite_code', 'spaces', ['invite_code'])
    op.create_unique_constraint('uq_users_email', 'users', ['email'])
    op.create_unique_constraint('uq_users_supabase_uid', 'users', ['supabase_uid'])


def downgrade():
    # Remove the constraints if downgraded
    op.drop_constraint('uq_users_supabase_uid', 'users', type_='unique')
    op.drop_constraint('uq_users_email', 'users', type_='unique')
    op.drop_constraint('uq_spaces_invite_code', 'spaces', type_='unique')