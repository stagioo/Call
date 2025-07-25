-- Add leftAt column to call_participants to track when a user leaves a call
ALTER TABLE call_participants ADD COLUMN left_at TIMESTAMP; 