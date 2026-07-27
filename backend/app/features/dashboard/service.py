class DashboardService:
    def __init__(self, repository):
        self.repository = repository

    def get_home_data(self, user_id):
        membership = self.repository.get_user_membership(user_id)

        if not membership:
            return {"space_status": "none"}

        member_count = self.repository.get_space_member_count(membership.space_id)
        status = "waiting" if member_count == 1 else "connected"

        return {"space_status": status}