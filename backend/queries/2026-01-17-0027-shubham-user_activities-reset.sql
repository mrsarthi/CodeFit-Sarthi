-- Delete all user activity records (fresh start)
-- Use this when you want to completely reset time tracking data

DELETE FROM user_activities 
WHERE id IS NOT NULL;
