-- Clean up user activity data by removing duration from active sessions
-- This allows active sessions to calculate live time instead of using stored duration

UPDATE user_activities 
SET duration = NULL 
WHERE duration IS NOT NULL;
