import React, { useState, useEffect } from 'react';
import { Activity, Calendar, Star, Mail, ShieldCheck, CheckCircle2, ChevronLeft } from 'lucide-react';
import type { Event, Participant, Registration } from '../types';
import { MockDatabase } from '../mockDatabase';
import { supabase } from '../supabase';

interface FeedbackPortalProps {
  dbMode: 'supabase' | 'mock';
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
  onBackToAdmin: () => void;
}

export const FeedbackPortal: React.FC<FeedbackPortalProps> = ({ 
  dbMode, 
  addToast, 
  onBackToAdmin 
}) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  
  // Verification states
  const [email, setEmail] = useState('');
  const [selectedEventId, setSelectedEventId] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [verifiedParticipant, setVerifiedParticipant] = useState<Participant | null>(null);
  
  // Rating states
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmittedSuccessfully, setHasSubmittedSuccessfully] = useState(false);

  const loadData = async () => {
    try {
      if (dbMode === 'supabase' && supabase) {
        const { data: eventsData } = await supabase.from('events').select('*');
        const { data: partsData } = await supabase.from('participants').select('*');
        const { data: regsData } = await supabase.from('registrations').select('*');

        // Filter events that are Completed or Ongoing
        const eligible = (eventsData || []).filter(e => e.status === 'completed' || e.status === 'ongoing');
        setEvents(eligible);
        setParticipants(partsData || []);
        setRegistrations(regsData || []);
        if (eligible.length > 0) setSelectedEventId(eligible[0].id);
      } else {
        const eligible = MockDatabase.getEvents().filter(e => e.status === 'completed' || e.status === 'ongoing');
        setEvents(eligible);
        setParticipants(MockDatabase.getParticipants());
        setRegistrations(MockDatabase.getRegistrations());
        if (eligible.length > 0) setSelectedEventId(eligible[0].id);
      }
    } catch (err) {
      console.error('Error loading feedback portal data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [dbMode]);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !selectedEventId) {
      addToast('Please enter your email and select an event.', 'error');
      return;
    }

    // 1. Find participant by email
    const participant = participants.find(
      p => p.email.toLowerCase() === email.trim().toLowerCase()
    );

    if (!participant) {
      addToast('Email not found in our student registry.', 'error');
      return;
    }

    // 2. Check if registered for selected event
    const isRegistered = registrations.find(
      r => r.event_id === selectedEventId && r.participant_id === participant.id
    );

    if (!isRegistered) {
      addToast('This email is not registered for the selected event.', 'error');
      return;
    }

    // Checked okay
    setVerifiedParticipant(participant);
    setIsVerified(true);
    addToast('Attendance verified! You can now submit your rating.', 'success');
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifiedParticipant || !selectedEventId) return;

    setIsSubmitting(true);

    try {
      if (dbMode === 'supabase' && supabase) {
        // Enforce DB UNIQUE check locally first
        const { data: existing } = await supabase
          .from('feedback')
          .select('id')
          .eq('event_id', selectedEventId)
          .eq('participant_id', verifiedParticipant.id)
          .maybeSingle();

        if (existing) {
          throw new Error('You have already submitted feedback for this event.');
        }

        const { error } = await supabase
          .from('feedback')
          .insert([{
            event_id: selectedEventId,
            participant_id: verifiedParticipant.id,
            rating,
            comment: comment.trim()
          }]);

        if (error) {
          if (error.code === '23505') {
            throw new Error('You have already submitted feedback for this event.');
          }
          throw error;
        }
      } else {
        // Mock DB implementation
        MockDatabase.addFeedback(selectedEventId, verifiedParticipant.id, rating, comment.trim());
      }

      addToast('Thank you! Your feedback has been submitted.', 'success');
      setHasSubmittedSuccessfully(true);
    } catch (err: any) {
      addToast(err.message || 'Failed to submit feedback.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPortal = () => {
    setEmail('');
    setIsVerified(false);
    setVerifiedParticipant(null);
    setComment('');
    setRating(5);
    setHasSubmittedSuccessfully(false);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-brand-dark bg-grid-glow relative p-4 overflow-hidden">
      
      {/* Background Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-md w-full relative z-10 space-y-6">
        
        {/* Back navigation button */}
        <button
          onClick={onBackToAdmin}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400 font-bold bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-[0_0_10px_rgba(0,0,0,0.5)]"
        >
          <ChevronLeft className="h-4 w-4" />
          Return to Admin Dashboard
        </button>

        {/* Branding header */}
        <div className="text-center">
          <div className="mx-auto relative flex items-center justify-center h-14 w-14 rounded-2xl bg-cyan-950/40 border border-cyan-400/30 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.1)]">
            <Calendar className="h-8 w-8 absolute" />
            <Activity className="h-5 w-5 absolute text-cyan-300 animate-heartbeat scale-110 z-10" />
          </div>
          <h2 className="font-heading font-black text-2xl text-white tracking-tight mt-3">
            Event<span className="text-cyan-400">Pulse</span> Feedback Portal
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Track. Analyze. Engage. — Share your event experience with organizers.
          </p>
        </div>

        {/* Portal card */}
        <div className="glass-panel rounded-2xl border border-slate-800 shadow-2xl p-6 relative overflow-hidden">
          
          {hasSubmittedSuccessfully ? (
            /* Success View */
            <div className="text-center py-6 space-y-4">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-emerald-950 border border-emerald-500/30 text-emerald-400 mb-2">
                <CheckCircle2 className="h-6 w-6 animate-pulse" />
              </div>
              <h3 className="font-heading font-bold text-white text-lg">Feedback Received!</h3>
              <p className="text-slate-400 text-xs max-w-xs mx-auto leading-relaxed">
                Thank you for reviewing the event. Your insights will help us organize better college events in the future.
              </p>
              <button
                onClick={handleResetPortal}
                className="bg-cyan-950 border border-cyan-800 text-cyan-400 hover:bg-cyan-900 px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Submit another review
              </button>
            </div>
          ) : !isVerified ? (
            /* Verification Form */
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="pb-3 border-b border-slate-900">
                <h3 className="font-heading font-bold text-slate-100 text-sm">Attendance Verification</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Please check your signup details before leaving a review.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  1. Select Event
                </label>
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="block w-full px-4 py-2.5 bg-slate-950 border border-slate-855 text-slate-300 text-xs rounded-xl outline-none focus:border-cyan-500/50 transition-all"
                >
                  {events.length > 0 ? (
                    events.map(ev => (
                      <option key={ev.id} value={ev.id}>{ev.event_name}</option>
                    ))
                  ) : (
                    <option value="">No completed events available to review</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  2. Registered College Email
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Mail className="h-4 w-4" />
                  </span>
                  <input
                    type="email"
                    required
                    placeholder="student.name@college.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-855 focus:border-cyan-500/50 rounded-xl text-xs text-slate-100 placeholder-slate-700 outline-none transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={events.length === 0}
                className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-cyan-950 border border-cyan-800 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-900 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Verify Attendance & Check Registration
              </button>
            </form>
          ) : (
            /* Feedback Form (Revealed after verification) */
            <form onSubmit={handleSubmitFeedback} className="space-y-4">
              <div className="pb-3 border-b border-slate-900 flex items-center justify-between">
                <div>
                  <h3 className="font-heading font-bold text-slate-100 text-sm">Submit Event Feedback</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">Attendee: {verifiedParticipant?.name}</p>
                </div>
                <span className="inline-flex items-center gap-1 bg-cyan-950/40 border border-cyan-850 px-2 py-0.5 rounded-md text-[9px] text-cyan-400 font-bold">
                  <ShieldCheck className="h-3 w-3" /> Verified
                </span>
              </div>

              {/* Star selector */}
              <div className="text-center space-y-2 py-2 bg-slate-950/40 border border-slate-900 rounded-xl">
                <span className="block text-[10px] font-bold text-slate-500 uppercase">Rate your experience</span>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((s) => {
                    const isLit = s <= rating;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setRating(s)}
                        className="p-1 transition-transform hover:scale-125 focus:outline-none cursor-pointer"
                      >
                        <Star
                          className={`h-7 w-7 ${
                            isLit 
                              ? 'text-cyan-400 fill-cyan-400/80 drop-shadow-[0_0_6px_rgba(6,182,212,0.6)]' 
                              : 'text-slate-800 hover:text-slate-700'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
                <span className="text-[11px] font-bold text-cyan-400">
                  {rating === 5 ? 'Excellent (5/5)' :
                   rating === 4 ? 'Very Good (4/5)' :
                   rating === 3 ? 'Average (3/5)' :
                   rating === 2 ? 'Disappointing (2/5)' : 'Poor (1/5)'}
                </span>
              </div>

              {/* Comments */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Review Comment
                </label>
                <textarea
                  required
                  rows={3}
                  maxLength={500}
                  placeholder="Share details about the venue, sound, topics, organization..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="block w-full px-4 py-2.5 bg-slate-950 border border-slate-855 focus:border-cyan-500/50 rounded-xl text-xs text-slate-100 placeholder-slate-700 outline-none transition-all resize-none"
                />
              </div>

              {/* Submit / Cancel row */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleResetPortal}
                  className="flex-1 py-2 px-4 rounded-xl border border-slate-850 hover:bg-slate-900 text-slate-400 hover:text-slate-200 text-xs font-bold transition-all cursor-pointer"
                >
                  Change Email
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-2 py-2 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 hover:shadow-[0_0_15px_rgba(6,182,212,0.2)] transition-all cursor-pointer"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Rating'}
                </button>
              </div>

            </form>
          )}

        </div>

      </div>
    </div>
  );
};
