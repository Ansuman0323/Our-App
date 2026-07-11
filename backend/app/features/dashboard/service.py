class DashboardService:
    def __init__(self, repository):
        self.repository = repository

    def get_home_data(self, user_id):
        membership = self.repository.get_user_membership(user_id)
        if not membership:
            return None

        member_count = self.repository.get_space_member_count(membership.space_id)
        
        # Determine state
        status = "waiting" if member_count == 1 else "connected"

        # The Dashboard API acts as an aggregator. Future modules will inject their data here.
        return {
            "space_status": status,
            "widgets": {
                "days_together": None,
                "latest_message": None,
                "today_tasks": [],
                "recent_memory": None,
                "wishlist": [],
                "upcoming_event": None
            }
        }