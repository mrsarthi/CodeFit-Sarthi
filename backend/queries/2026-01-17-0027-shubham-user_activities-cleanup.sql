-- Delete all sessions with zero duration (where startTime equals endTime)
-- These are bad data from initial testing and prevent accurate time tracking

DELETE FROM user_activities 
WHERE TIMESTAMPDIFF(SECOND, startTime, COALESCE(endTime, startTime)) = 0;
