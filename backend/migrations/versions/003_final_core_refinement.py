"""final core refinement

Revision ID: 003_final_core_refinement
Revises: d32418d486c2
Create Date: 2026-07-11 22:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = '003_final_core_refinement'
down_revision = 'd32418d486c2'
branch_labels = None
depends_on = None


def upgrade():
    # 1. DROP REDUNDANT INDEXES (Relying on UNIQUE constraints instead)
    op.execute("DROP INDEX IF EXISTS ix_users_email;")
    op.execute("DROP INDEX IF EXISTS ix_users_supabase_uid;")
    op.execute("DROP INDEX IF EXISTS ix_spaces_invite_code;")
    op.execute("DROP INDEX IF EXISTS ix_profiles_user_id;")

    # 2. ALTER COLUMNS
    with op.batch_alter_table('spaces', schema=None) as batch_op:
        batch_op.alter_column('invite_code',
               existing_type=sa.VARCHAR(length=20),
               type_=sa.String(length=8),
               existing_nullable=False)

    # 3. ADD CHECK CONSTRAINTS
    op.create_check_constraint('chk_spaces_status', 'spaces', "status IN ('active', 'archived')")
    # Drop the old awkwardly named constraint if it existed from earlier, create the standard one
    op.execute("ALTER TABLE space_members DROP CONSTRAINT IF EXISTS check_valid_role;")
    op.create_check_constraint('chk_space_members_role', 'space_members', "role IN ('owner', 'partner')")

    # 4. ENFORCE FOREIGN KEY CASCADES
    # Profiles
    op.drop_constraint('profiles_user_id_fkey', 'profiles', type_='foreignkey')
    op.create_foreign_key('profiles_user_id_fkey', 'profiles', 'users', ['user_id'], ['id'], ondelete='CASCADE')

    # Space Members
    op.drop_constraint('space_members_space_id_fkey', 'space_members', type_='foreignkey')
    op.drop_constraint('space_members_user_id_fkey', 'space_members', type_='foreignkey')
    op.create_foreign_key('space_members_space_id_fkey', 'space_members', 'spaces', ['space_id'], ['id'], ondelete='CASCADE')
    op.create_foreign_key('space_members_user_id_fkey', 'space_members', 'users', ['user_id'], ['id'], ondelete='CASCADE')


def downgrade():
    # 1. REVERT FOREIGN KEY CASCADES
    op.drop_constraint('space_members_space_id_fkey', 'space_members', type_='foreignkey')
    op.drop_constraint('space_members_user_id_fkey', 'space_members', type_='foreignkey')
    op.create_foreign_key('space_members_space_id_fkey', 'space_members', 'spaces', ['space_id'], ['id'])
    op.create_foreign_key('space_members_user_id_fkey', 'space_members', 'users', ['user_id'], ['id'])

    op.drop_constraint('profiles_user_id_fkey', 'profiles', type_='foreignkey')
    op.create_foreign_key('profiles_user_id_fkey', 'profiles', 'users', ['user_id'], ['id'])

    # 2. REVERT CHECK CONSTRAINTS
    op.drop_constraint('chk_space_members_role', 'space_members', type_='check')
    op.drop_constraint('chk_spaces_status', 'spaces', type_='check')

    # 3. REVERT ALTER COLUMNS
    with op.batch_alter_table('spaces', schema=None) as batch_op:
        batch_op.alter_column('invite_code',
               existing_type=sa.String(length=8),
               type_=sa.VARCHAR(length=20),
               existing_nullable=False)

    # 4. RECREATE REDUNDANT INDEXES
    op.create_index('ix_users_email', 'users', ['email'], unique=True)
    op.create_index('ix_users_supabase_uid', 'users', ['supabase_uid'], unique=True)
    op.create_index('ix_spaces_invite_code', 'spaces', ['invite_code'], unique=True)
    op.create_index('ix_profiles_user_id', 'profiles', ['user_id'], unique=True)