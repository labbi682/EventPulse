-- ==========================================
-- EventPulse — Database Schema & Seed Data
-- ==========================================

-- Drop existing tables if they exist (for reset convenience)
DROP TABLE IF EXISTS feedback CASCADE;
DROP TABLE IF EXISTS registrations CASCADE;
DROP TABLE IF EXISTS participants CASCADE;
DROP TABLE IF EXISTS events CASCADE;

-- 1. Events Table
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_name TEXT NOT NULL,
    event_date TIMESTAMPTZ NOT NULL,
    category TEXT NOT NULL,
    venue TEXT NOT NULL,
    max_capacity INT NOT NULL CHECK (max_capacity > 0),
    status TEXT NOT NULL CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')) DEFAULT 'upcoming'
);

-- Disable RLS for events table
ALTER TABLE events DISABLE ROW LEVEL SECURITY;

-- 2. Participants Table
CREATE TABLE participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    department TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL
);

-- Disable RLS for participants table
ALTER TABLE participants DISABLE ROW LEVEL SECURITY;

-- 3. Registrations Table
CREATE TABLE registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
    registration_date TIMESTAMPTZ DEFAULT NOW(),
    waitlist_position INT DEFAULT NULL, -- NULL if confirmed, 1, 2, 3... if waitlisted
    UNIQUE (event_id, participant_id) -- Blocks duplicate registrations
);

-- Disable RLS for registrations table
ALTER TABLE registrations DISABLE ROW LEVEL SECURITY;

-- 4. Feedback Table
CREATE TABLE feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (event_id, participant_id) -- One feedback per participant per event
);

-- Disable RLS for feedback table
ALTER TABLE feedback DISABLE ROW LEVEL SECURITY;

-- Disable Row Level Security (RLS) on all tables for presentation convenience
ALTER TABLE events DISABLE ROW LEVEL SECURITY;
ALTER TABLE participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE registrations DISABLE ROW LEVEL SECURITY;
ALTER TABLE feedback DISABLE ROW LEVEL SECURITY;

-- ==========================================
-- Triggers and Functions for Waitlist Automation
-- ==========================================

-- Trigger 1: Auto-Waitlist on Insert
-- Triggers BEFORE INSERT to check event capacity and set waitlist position if full.
CREATE OR REPLACE FUNCTION handle_registration_waitlist()
RETURNS TRIGGER AS $$
DECLARE
    v_capacity INT;
    v_confirmed_count INT;
    v_waitlist_count INT;
BEGIN
    -- Get max capacity of the event
    SELECT max_capacity INTO v_capacity FROM events WHERE id = NEW.event_id;
    
    -- Count current confirmed registrations (excluding waitlisted ones)
    SELECT COUNT(*) INTO v_confirmed_count FROM registrations 
    WHERE event_id = NEW.event_id AND waitlist_position IS NULL;
    
    -- Check if we have capacity
    IF v_confirmed_count < v_capacity THEN
        NEW.waitlist_position := NULL;
    ELSE
        -- Count how many are currently waitlisted to assign the next position
        SELECT COUNT(*) INTO v_waitlist_count FROM registrations 
        WHERE event_id = NEW.event_id AND waitlist_position IS NOT NULL;
        
        NEW.waitlist_position := v_waitlist_count + 1;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_registration_waitlist
BEFORE INSERT ON registrations
FOR EACH ROW
EXECUTE FUNCTION handle_registration_waitlist();


-- Trigger 2: Auto-Promotion on Delete
-- Triggers AFTER DELETE to promote the first waitlisted participant when a confirmed seat is deleted.
CREATE OR REPLACE FUNCTION handle_registration_deletion()
RETURNS TRIGGER AS $$
DECLARE
    v_capacity INT;
    v_confirmed_count INT;
    v_next_waitlisted_id UUID;
BEGIN
    -- Only do something if the deleted registration was confirmed (waitlist_position IS NULL)
    IF OLD.waitlist_position IS NULL THEN
        -- Get event capacity
        SELECT max_capacity INTO v_capacity FROM events WHERE id = OLD.event_id;
        
        -- Get current confirmed count
        SELECT COUNT(*) INTO v_confirmed_count FROM registrations
        WHERE event_id = OLD.event_id AND waitlist_position IS NULL;
        
        -- If we have space now and there are waitlisted people
        IF v_confirmed_count < v_capacity THEN
            -- Find the person with waitlist_position = 1
            SELECT id INTO v_next_waitlisted_id FROM registrations
            WHERE event_id = OLD.event_id AND waitlist_position = 1
            LIMIT 1;
            
            IF v_next_waitlisted_id IS NOT NULL THEN
                -- Promote them to confirmed
                UPDATE registrations 
                SET waitlist_position = NULL 
                WHERE id = v_next_waitlisted_id;
                
                -- Shift all other waitlist positions down by 1
                UPDATE registrations
                SET waitlist_position = waitlist_position - 1
                WHERE event_id = OLD.event_id AND waitlist_position IS NOT NULL;
            END IF;
        END IF;
    ELSE
        -- The deleted registration was waitlisted. Shift all subsequent waitlist positions down by 1
        UPDATE registrations
        SET waitlist_position = waitlist_position - 1
        WHERE event_id = OLD.event_id 
          AND waitlist_position IS NOT NULL 
          AND waitlist_position > OLD.waitlist_position;
    END IF;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_registration_deletion
AFTER DELETE ON registrations
FOR EACH ROW
EXECUTE FUNCTION handle_registration_deletion();


-- Trigger 3: Capacity Increase Trigger
-- Triggers AFTER UPDATE of events.max_capacity to promote waitlisted people if capacity is increased.
CREATE OR REPLACE FUNCTION handle_event_capacity_increase()
RETURNS TRIGGER AS $$
DECLARE
    v_confirmed_count INT;
    v_capacity_diff INT;
    v_reg_record RECORD;
BEGIN
    -- If capacity increased
    IF NEW.max_capacity > OLD.max_capacity THEN
        v_capacity_diff := NEW.max_capacity - OLD.max_capacity;
        
        -- Loop to promote waitlisted people up to the capacity difference
        FOR v_reg_record IN 
            SELECT id FROM registrations 
            WHERE event_id = NEW.id AND waitlist_position IS NOT NULL
            ORDER BY waitlist_position ASC
            LIMIT v_capacity_diff
        LOOP
            UPDATE registrations 
            SET waitlist_position = NULL 
            WHERE id = v_reg_record.id;
        END LOOP;
        
        -- Recalculate remaining waitlist positions
        WITH numbered_waitlist AS (
            SELECT id, ROW_NUMBER() OVER (ORDER BY waitlist_position ASC) as new_pos
            FROM registrations
            WHERE event_id = NEW.id AND waitlist_position IS NOT NULL
        )
        UPDATE registrations r
        SET waitlist_position = nw.new_pos
        FROM numbered_waitlist nw
        WHERE r.id = nw.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_event_capacity_increase
AFTER UPDATE OF max_capacity ON events
FOR EACH ROW
EXECUTE FUNCTION handle_event_capacity_increase();


-- Helper: Function to auto-update event statuses based on time
CREATE OR REPLACE FUNCTION update_event_statuses()
RETURNS VOID AS $$
BEGIN
    -- Shift to ongoing if event date is past/equal and within 4 hours
    UPDATE events
    SET status = 'ongoing'
    WHERE status = 'upcoming' AND event_date <= NOW() AND event_date > NOW() - INTERVAL '4 hours';

    -- Shift to completed if event date is older than 4 hours
    UPDATE events
    SET status = 'completed'
    WHERE status IN ('upcoming', 'ongoing') AND event_date <= NOW() - INTERVAL '4 hours';
END;
$$ LANGUAGE plpgsql;


-- ==========================================
-- Seed Data for Presentation
-- ==========================================

-- Insert Events
INSERT INTO events (id, event_name, event_date, category, venue, max_capacity, status) VALUES
('e1a11111-1111-1111-1111-111111111111', 'Inter-College Hackathon 2026', NOW() + INTERVAL '5 days', 'Technical', 'Seminar Hall A', 5, 'upcoming'),
('e2b22222-2222-2222-2222-222222222222', 'AI & Machine Learning Symposium', NOW() - INTERVAL '2 hours', 'Technical', 'Auditorium Main', 30, 'ongoing'),
('e3c33333-3333-3333-3333-333333333333', 'Annual Battle of the Bands', NOW() - INTERVAL '3 days', 'Cultural', 'Open Amphitheater', 100, 'completed'),
('e4d44444-4444-4444-4444-444444444444', 'National Level Debate Championship', NOW() + INTERVAL '12 days', 'Academic', 'Conference Room C', 10, 'upcoming'),
('e5e55555-5555-5555-5555-555555555555', 'Alumni Networking Dinner', NOW() - INTERVAL '5 days', 'Social', 'Grand Dining Lounge', 50, 'completed'),
('e6f66666-6666-6666-6666-666666666666', 'Creative Writing Workshop', NOW() + INTERVAL '20 days', 'Arts', 'Library Room 4', 2, 'upcoming');

-- Insert Participants
INSERT INTO participants (id, name, department, email) VALUES
('a1111111-1111-1111-1111-111111111111', 'Aarav Mehta', 'Computer Science', 'aarav.mehta@college.edu'),
('a2222222-2222-2222-2222-222222222222', 'Ananya Sharma', 'Computer Science', 'ananya.sharma@college.edu'),
('a3333333-3333-3333-3333-333333333333', 'Kabir Malhotra', 'Electronics Engineering', 'kabir.malhotra@college.edu'),
('a4444444-4444-4444-4444-444444444444', 'Diya Iyer', 'Electronics Engineering', 'diya.iyer@college.edu'),
('a5555555-5555-5555-5555-555555555555', 'Rohan Das', 'Mechanical Engineering', 'rohan.das@college.edu'),
('a6666666-6666-6666-6666-666666666666', 'Meera Nair', 'Mechanical Engineering', 'meera.nair@college.edu'),
('a7777777-7777-7777-7777-777777777777', 'Aditya Verma', 'Business Administration', 'aditya.verma@college.edu'),
('a8888888-8888-8888-8888-888888888888', 'Zara Khan', 'Business Administration', 'zara.khan@college.edu'),
('a9999999-9999-9999-9999-999999999999', 'Vikram Sen', 'Information Technology', 'vikram.sen@college.edu'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Priya Kapoor', 'Information Technology', 'priya.kapoor@college.edu'),
('abbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Rahul Joshi', 'Biotechnology', 'rahul.joshi@college.edu'),
('accccccc-cccc-cccc-cccc-cccccccccccc', 'Sneha Roy', 'Biotechnology', 'sneha.roy@college.edu');

-- Insert Registrations
-- 1. Register 7 people to the Hackathon (Capacity = 5).
-- Aarav, Ananya, Kabir, Diya, Rohan -> Confirmed.
-- Meera, Aditya -> Waitlisted (trigger auto-assigns waitlist_position).
INSERT INTO registrations (event_id, participant_id, registration_date) VALUES
('e1a11111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', NOW() - INTERVAL '4 days'),
('e1a11111-1111-1111-1111-111111111111', 'a2222222-2222-2222-2222-222222222222', NOW() - INTERVAL '3 days'),
('e1a11111-1111-1111-1111-111111111111', 'a3333333-3333-3333-3333-333333333333', NOW() - INTERVAL '2 days'),
('e1a11111-1111-1111-1111-111111111111', 'a4444444-4444-4444-4444-444444444444', NOW() - INTERVAL '1 day'),
('e1a11111-1111-1111-1111-111111111111', 'a5555555-5555-5555-5555-555555555555', NOW() - INTERVAL '12 hours'),
-- These will trigger waitlist positions 1 and 2 automatically
('e1a11111-1111-1111-1111-111111111111', 'a6666666-6666-6666-6666-666666666666', NOW() - INTERVAL '6 hours'),
('e1a11111-1111-1111-1111-111111111111', 'a7777777-7777-7777-7777-777777777777', NOW() - INTERVAL '1 hour');

-- 2. Register people to AI Symposium (Capacity = 30) -> all confirmed
INSERT INTO registrations (event_id, participant_id, registration_date) VALUES
('e2b22222-2222-2222-2222-222222222222', 'a1111111-1111-1111-1111-111111111111', NOW() - INTERVAL '1 day'),
('e2b22222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-222222222222', NOW() - INTERVAL '1 day'),
('e2b22222-2222-2222-2222-222222222222', 'a8888888-8888-8888-8888-888888888888', NOW() - INTERVAL '12 hours'),
('e2b22222-2222-2222-2222-222222222222', 'a9999999-9999-9999-9999-999999999999', NOW() - INTERVAL '1 hour'),
('e2b22222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NOW());

-- 3. Register people to Battle of the Bands (Completed event)
INSERT INTO registrations (event_id, participant_id, registration_date) VALUES
('e3c33333-3333-3333-3333-333333333333', 'a2222222-2222-2222-2222-222222222222', NOW() - INTERVAL '5 days'),
('e3c33333-3333-3333-3333-333333333333', 'a3333333-3333-3333-3333-333333333333', NOW() - INTERVAL '5 days'),
('e3c33333-3333-3333-3333-333333333333', 'a5555555-5555-5555-5555-555555555555', NOW() - INTERVAL '4 days'),
('e3c33333-3333-3333-3333-333333333333', 'a7777777-7777-7777-7777-777777777777', NOW() - INTERVAL '4 days'),
('e3c33333-3333-3333-3333-333333333333', 'abbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', NOW() - INTERVAL '3 days'),
('e3c33333-3333-3333-3333-333333333333', 'accccccc-cccc-cccc-cccc-cccccccccccc', NOW() - INTERVAL '3 days');

-- 4. Register people to Alumni Dinner (Completed event)
INSERT INTO registrations (event_id, participant_id, registration_date) VALUES
('e5e55555-5555-5555-5555-555555555555', 'a1111111-1111-1111-1111-111111111111', NOW() - INTERVAL '7 days'),
('e5e55555-5555-5555-5555-555555555555', 'a4444444-4444-4444-4444-444444444444', NOW() - INTERVAL '6 days'),
('e5e55555-5555-5555-5555-555555555555', 'a7777777-7777-7777-7777-777777777777', NOW() - INTERVAL '6 days'),
('e5e55555-5555-5555-5555-555555555555', 'a8888888-8888-8888-8888-888888888888', NOW() - INTERVAL '5 days');

-- 5. Register people to Creative Writing (Capacity = 2) -> fills and waitlists
INSERT INTO registrations (event_id, participant_id, registration_date) VALUES
('e6f66666-6666-6666-6666-666666666666', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NOW() - INTERVAL '1 day'),
('e6f66666-6666-6666-6666-666666666666', 'abbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', NOW() - INTERVAL '12 hours'),
-- Waitlisted (trigger auto-assigns position 1)
('e6f66666-6666-6666-6666-666666666666', 'accccccc-cccc-cccc-cccc-cccccccccccc', NOW() - INTERVAL '1 hour');

-- Insert Feedback (Completed events only)
INSERT INTO feedback (event_id, participant_id, rating, comment, submitted_at) VALUES
('e3c33333-3333-3333-3333-333333333333', 'a2222222-2222-2222-2222-222222222222', 5, 'Absolutely spectacular! The bands were amazing and the lighting was top-tier.', NOW() - INTERVAL '2 days'),
('e3c33333-3333-3333-3333-333333333333', 'a3333333-3333-3333-3333-333333333333', 4, 'Great vibe, though the sound system in the amphitheater had a few echoes.', NOW() - INTERVAL '2 days'),
('e3c33333-3333-3333-3333-333333333333', 'a5555555-5555-5555-5555-555555555555', 5, 'Unbelievable energy! Best college fest event this year!', NOW() - INTERVAL '1 day'),
('e3c33333-3333-3333-3333-333333333333', 'abbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 3, 'The performances were good, but it went way past schedule and got very cold.', NOW() - INTERVAL '1 day'),
('e5e55555-5555-5555-5555-555555555555', 'a1111111-1111-1111-1111-111111111111', 4, 'A wonderful evening networking with seniors. Extremely helpful for job search tips!', NOW() - INTERVAL '4 days'),
('e5e55555-5555-5555-5555-555555555555', 'a8888888-8888-8888-8888-888888888888', 5, 'Elegant venue, delicious food, and great conversations. Will attend again next year.', NOW() - INTERVAL '4 days');


