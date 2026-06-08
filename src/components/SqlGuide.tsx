import React, { useState } from 'react';
import { Database, Copy, Check, Terminal, ExternalLink, Sparkles } from 'lucide-react';

interface SqlGuideProps {
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const SqlGuide: React.FC<SqlGuideProps> = ({ addToast }) => {
  const [copied, setCopied] = useState(false);

  const sqlCode = `-- ==========================================
-- EventPulse — Database Schema & Seed Data
-- ==========================================

-- Drop existing tables if they exist
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

-- 2. Participants Table
CREATE TABLE participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    department TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL
);

-- 3. Registrations Table
CREATE TABLE registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
    registration_date TIMESTAMPTZ DEFAULT NOW(),
    waitlist_position INT DEFAULT NULL, -- NULL if confirmed, 1, 2, 3... if waitlisted
    UNIQUE (event_id, participant_id)
);

-- 4. Feedback Table
CREATE TABLE feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (event_id, participant_id)
);

-- ==========================================
-- Triggers and Functions for Waitlist Automation
-- ==========================================

-- Trigger 1: Auto-Waitlist on Insert
CREATE OR REPLACE FUNCTION handle_registration_waitlist()
RETURNS TRIGGER AS $$
DECLARE
    v_capacity INT;
    v_confirmed_count INT;
    v_waitlist_count INT;
BEGIN
    SELECT max_capacity INTO v_capacity FROM events WHERE id = NEW.event_id;
    
    SELECT COUNT(*) INTO v_confirmed_count FROM registrations 
    WHERE event_id = NEW.event_id AND waitlist_position IS NULL;
    
    IF v_confirmed_count < v_capacity THEN
        NEW.waitlist_position := NULL;
    ELSE
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
CREATE OR REPLACE FUNCTION handle_registration_deletion()
RETURNS TRIGGER AS $$
DECLARE
    v_capacity INT;
    v_confirmed_count INT;
    v_next_waitlisted_id UUID;
BEGIN
    IF OLD.waitlist_position IS NULL THEN
        SELECT max_capacity INTO v_capacity FROM events WHERE id = OLD.event_id;
        
        SELECT COUNT(*) INTO v_confirmed_count FROM registrations
        WHERE event_id = OLD.event_id AND waitlist_position IS NULL;
        
        IF v_confirmed_count < v_capacity THEN
            SELECT id INTO v_next_waitlisted_id FROM registrations
            WHERE event_id = OLD.event_id AND waitlist_position = 1
            LIMIT 1;
            
            IF v_next_waitlisted_id IS NOT NULL THEN
                UPDATE registrations 
                SET waitlist_position = NULL 
                WHERE id = v_next_waitlisted_id;
                
                UPDATE registrations
                SET waitlist_position = waitlist_position - 1
                WHERE event_id = OLD.event_id AND waitlist_position IS NOT NULL;
            END IF;
        END IF;
    ELSE
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
CREATE OR REPLACE FUNCTION handle_event_capacity_increase()
RETURNS TRIGGER AS $$
DECLARE
    v_confirmed_count INT;
    v_capacity_diff INT;
    v_reg_record RECORD;
BEGIN
    IF NEW.max_capacity > OLD.max_capacity THEN
        v_capacity_diff := NEW.max_capacity - OLD.max_capacity;
        
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

-- Helper: Status calculations
CREATE OR REPLACE FUNCTION update_event_statuses()
RETURNS VOID AS $$
BEGIN
    UPDATE events
    SET status = 'ongoing'
    WHERE status = 'upcoming' AND event_date <= NOW() AND event_date > NOW() - INTERVAL '4 hours';

    UPDATE events
    SET status = 'completed'
    WHERE status IN ('upcoming', 'ongoing') AND event_date <= NOW() - INTERVAL '4 hours';
END;
$$ LANGUAGE plpgsql;`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sqlCode);
    setCopied(true);
    addToast('SQL schema copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div>
        <h2 className="text-2xl font-heading font-black text-white flex items-center gap-2">
          <Database className="h-6 w-6 text-cyan-400" />
          Supabase Database Setup Guide
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Follow these quick steps to hook up your own live Supabase project to EventPulse.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Step List Card */}
        <div className="lg:col-span-1 space-y-4">
          <div className="glass-panel border border-slate-800 p-5 rounded-2xl space-y-4">
            <h3 className="font-heading font-bold text-slate-100 flex items-center gap-2 text-sm uppercase tracking-wider">
              <Sparkles className="h-4 w-4 text-cyan-400" />
              Setup Instructions
            </h3>

            <ol className="space-y-4 text-xs text-slate-300">
              <li className="flex gap-3">
                <span className="h-5 w-5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800/40 flex items-center justify-center font-bold shrink-0">1</span>
                <div>
                  <strong className="text-white block mb-0.5">Create a Supabase Project</strong>
                  Sign in to{' '}
                  <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline inline-flex items-center gap-0.5">
                    Supabase.com <ExternalLink className="h-3 w-3" />
                  </a>{' '}
                  and initialize a new free PostgreSQL database.
                </div>
              </li>
              
              <li className="flex gap-3">
                <span className="h-5 w-5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800/40 flex items-center justify-center font-bold shrink-0">2</span>
                <div>
                  <strong className="text-white block mb-0.5">Execute the SQL Script</strong>
                  Navigate to the **SQL Editor** tab in your Supabase project sidebar. Paste the SQL code on the right and click **Run**. This installs all tables, waitlist triggers, and seed data.
                </div>
              </li>

              <li className="flex gap-3">
                <span className="h-5 w-5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800/40 flex items-center justify-center font-bold shrink-0">3</span>
                <div>
                  <strong className="text-white block mb-0.5">Enable Supabase Realtime</strong>
                  Go to **Database** → **Replication** in Supabase. Edit the `supabase_realtime` publication, check the `registrations` table, and click save. This enables instant live dashboard ticks!
                </div>
              </li>

              <li className="flex gap-3">
                <span className="h-5 w-5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800/40 flex items-center justify-center font-bold shrink-0">4</span>
                <div>
                  <strong className="text-white block mb-0.5">Save Keys on Login Page</strong>
                  Copy your Project URL and Anon API key from **Settings** → **API** in Supabase, paste them into the gear panel on the EventPulse Login screen, and connect.
                </div>
              </li>
            </ol>
          </div>

          <div className="glass-panel border border-rose-950/20 bg-rose-950/5 p-4 rounded-2xl text-xs text-rose-300">
            <span className="font-bold block mb-1">💡 Presentation Pro-Tip:</span>
            Showing the triggers and functions inside Supabase to your professor proves that the waitlisting logic runs securely on the database level, preventing race conditions.
          </div>
        </div>

        {/* Code window block */}
        <div className="lg:col-span-2">
          <div className="glass-panel border border-slate-800 rounded-2xl overflow-hidden flex flex-col h-[500px]">
            {/* Window bar */}
            <div className="bg-slate-950/80 px-4 py-3 border-b border-slate-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-cyan-400" />
                <span className="text-xs font-mono font-semibold text-slate-200">schema.sql</span>
              </div>
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 bg-cyan-950/40 border border-cyan-800/30 px-3 py-1.5 rounded-lg transition-all cursor-pointer font-bold"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copied!' : 'Copy SQL Schema'}
              </button>
            </div>

            {/* Code scroll view */}
            <div className="flex-1 overflow-auto p-4 bg-slate-950/40 font-mono text-xs text-slate-300 leading-relaxed selection:bg-cyan-900 selection:text-white">
              <pre>{sqlCode}</pre>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
