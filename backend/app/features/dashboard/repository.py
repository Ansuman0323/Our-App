from app.models.space_member import SpaceMember

class DashboardRepository:
    def __init__(self, db_session):
        self.session = db_session

    def get_user_membership(self, user_id):
        return self.session.query(SpaceMember).filter_by(user_id=user_id).first()

    def get_space_member_count(self, space_id):
        return self.session.query(SpaceMember).filter_by(space_id=space_id).count()