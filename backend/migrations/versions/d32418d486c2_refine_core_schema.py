"""refine core schema

Revision ID: d32418d486c2
Revises: 9b8d1cf81482
Create Date: 2026-07-11 20:54:22.324370

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'd32418d486c2'
down_revision = '9b8d1cf81482'
branch_labels = None
depends_on = None


def upgrade():
    # 1. SPACES: Add the new columns FIRST
    with op.batch_alter_table('spaces', schema=None) as batch_op:
        batch_op.add_column(sa.Column('relationship_started_on', sa.Date(), nullable=True))
        # ADDED server_default='active' to prevent Postgres from crashing on existing rows
        batch_op.add_column(sa.Column('status', sa.String(length=20), server_default='active', nullable=False))
        batch_op.alter_column('invite_code',
               existing_type=sa.VARCHAR(length=50),
               type_=sa.String(length=20),
               existing_nullable=False)
        batch_op.create_unique_constraint(None, ['id'])

    # 2. DATA MIGRATION: Safely move the data from profiles to spaces
    op.execute("""
        UPDATE spaces
        SET relationship_started_on = subquery.anniversary_date
        FROM (
            SELECT sm.space_id, MAX(p.anniversary_date) as anniversary_date
            FROM space_members sm
            JOIN profiles p ON sm.user_id = p.user_id
            WHERE p.anniversary_date IS NOT NULL
            GROUP BY sm.space_id
        ) AS subquery
        WHERE spaces.id = subquery.space_id;
    """)

    # 3. PROFILES: Now it is safe to drop the old column
    with op.batch_alter_table('profiles', schema=None) as batch_op:
        batch_op.drop_constraint(batch_op.f('profiles_user_id_key'), type_='unique')
        batch_op.create_index(batch_op.f('ix_profiles_user_id'), ['user_id'], unique=True)
        batch_op.create_unique_constraint(None, ['id'])
        batch_op.drop_column('anniversary_date')

    # 4. SPACE_MEMBERS
    with op.batch_alter_table('space_members', schema=None) as batch_op:
        batch_op.alter_column('role',
               existing_type=sa.VARCHAR(length=50),
               type_=sa.String(length=20),
               existing_nullable=False)
        batch_op.create_unique_constraint(None, ['id'])

    # 5. USERS
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.alter_column('display_name',
               existing_type=sa.VARCHAR(length=100),
               nullable=True)
        batch_op.create_unique_constraint(None, ['id'])


def downgrade():
    # 1. PROFILES: Add the old column back FIRST
    with op.batch_alter_table('profiles', schema=None) as batch_op:
        batch_op.add_column(sa.Column('anniversary_date', sa.DATE(), autoincrement=False, nullable=True))
        batch_op.drop_constraint(None, type_='unique')
        batch_op.drop_index(batch_op.f('ix_profiles_user_id'))
        batch_op.create_unique_constraint(batch_op.f('profiles_user_id_key'), ['user_id'], postgresql_nulls_not_distinct=False)

    # 2. DATA ROLLBACK: Safely move the data back from spaces to profiles
    op.execute("""
        UPDATE profiles
        SET anniversary_date = subquery.relationship_started_on
        FROM (
            SELECT sm.user_id, s.relationship_started_on
            FROM space_members sm
            JOIN spaces s ON sm.space_id = s.id
            WHERE s.relationship_started_on IS NOT NULL
        ) AS subquery
        WHERE profiles.user_id = subquery.user_id;
    """)

    # 3. SPACES: Now it is safe to drop the new columns
    with op.batch_alter_table('spaces', schema=None) as batch_op:
        batch_op.drop_constraint(None, type_='unique')
        batch_op.alter_column('invite_code',
               existing_type=sa.String(length=20),
               type_=sa.VARCHAR(length=50),
               existing_nullable=False)
        batch_op.drop_column('status')
        batch_op.drop_column('relationship_started_on')

    # 4. SPACE_MEMBERS
    with op.batch_alter_table('space_members', schema=None) as batch_op:
        batch_op.drop_constraint(None, type_='unique')
        batch_op.alter_column('role',
               existing_type=sa.String(length=20),
               type_=sa.VARCHAR(length=50),
               existing_nullable=False)

    # 5. USERS
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.drop_constraint(None, type_='unique')
        batch_op.alter_column('display_name',
               existing_type=sa.VARCHAR(length=100),
               nullable=False)