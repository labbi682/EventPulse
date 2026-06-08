import React, { useState, useEffect } from 'react';
import { MessageSquare, Star, Search, Calendar, User } from 'lucide-react';
import type { Feedback, Event, Participant } from '../types';
import { MockDatabase } from '../mockDatabase';
import { supabase } from '../supabase';

interface FeedbackProps {
  dbMode: 'supabase' | 'mock';
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const FeedbackView: React.FC<FeedbackProps> = ({ dbMode }) => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [eventFilter, setEventFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');

  const loadData = async () => {
    try {
      if (dbMode === 'supabase' && supabase) {
        const { data: feedData } = await supabase.from('feedback').select('*');
        const { data: eventsData } = await supabase.from('events').select('*');
        const { data: partsData } = await supabase.from('participants').select('*');

        setFeedbacks(feedData || []);
        setEvents(eventsData || []);
        setParticipants(partsData || []);
      } else {
        setFeedbacks(MockDatabase.getFeedback());
        setEvents(MockDatabase.getEvents());
        setParticipants(MockDatabase.getParticipants());
      }
    } catch (err) {
      console.error('Error loading feedback:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Listen to local DB changes
    const handleDbChange = () => loadData();
    window.addEventListener('eventpulse_db_change', handleDbChange);
    return () => window.removeEventListener('eventpulse_db_change', handleDbChange);
  }, [dbMode]);

  // Render star ratings helper
  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5" aria-label={`${rating} stars out of 5`}>
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            className={`h-3.5 w-3.5 ${
              s <= rating ? 'text-cyan-400 fill-cyan-400/80 drop-shadow-[0_0_4px_rgba(6,182,212,0.5)]' : 'text-slate-700'
            }`}
          />
        ))}
      </div>
    );
  };

  // Calculations for average feedback ratings
  const getAverageRatingForEvent = (eventId: string) => {
    const eventFeeds = feedbacks.filter(f => f.event_id === eventId);
    if (eventFeeds.length === 0) return 'No reviews yet';
    const sum = eventFeeds.reduce((acc, f) => acc + f.rating, 0);
    return (sum / eventFeeds.length).toFixed(1) + ' ★';
  };

  // Filters logic
  const filteredFeedbacks = feedbacks.filter(f => {
    const participant = participants.find(p => p.id === f.participant_id);
    const event = events.find(e => e.id === f.event_id);

    if (!participant || !event) return false;

    const matchesSearch = participant.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          event.event_name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesEvent = eventFilter === 'all' || f.event_id === eventFilter;
    const matchesRating = ratingFilter === 'all' || f.rating === Number(ratingFilter);

    return matchesSearch && matchesEvent && matchesRating;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-6rem)]">
        <div className="h-8 w-8 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-heading font-black text-white flex items-center gap-2">
          <MessageSquare className="h-6 w-6 text-cyan-400 animate-pulse-glow" />
          Feedback & Reviews
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Review participant post-event surveys, aggregate ratings, and read student reviews.
        </p>
      </div>

      {/* Aggregate Overview Box */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Overall score card */}
        <div className="lg:col-span-1 glass-panel border border-slate-800 p-5 rounded-2xl flex flex-col justify-between">
          <div className="space-y-2">
            <h3 className="font-heading font-bold text-slate-300 text-xs uppercase tracking-wider">Overall Sentiment</h3>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Feedback ratings average</p>
          </div>
          
          <div className="my-6 text-center">
            <h4 className="text-6xl font-heading font-black text-white flex items-baseline justify-center gap-1.5 leading-none">
              {feedbacks.length > 0 
                ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(1)
                : '0.0'
              }
              <span className="text-sm font-semibold text-slate-500">/ 5</span>
            </h4>
            <div className="flex justify-center mt-3">
              {renderStars(
                feedbacks.length > 0 
                  ? Math.round(feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length)
                  : 0
              )}
            </div>
            <p className="text-[10px] text-slate-400 mt-2 font-semibold">
              Based on {feedbacks.length} participant surveys
            </p>
          </div>

          <div className="text-[10px] text-slate-500 bg-slate-900/40 border border-slate-850 p-2.5 rounded-xl text-center">
            To submit reviews, direct participants to the public <strong className="text-cyan-400">Feedback Portal</strong>.
          </div>
        </div>

        {/* Right: Event list summary table */}
        <div className="lg:col-span-2 glass-panel border border-slate-800 p-5 rounded-2xl flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <h3 className="font-heading font-bold text-slate-100 text-sm">Average Ratings per Event</h3>
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Turnout feedback index</p>
            </div>

            <div className="max-h-48 overflow-y-auto pr-1 space-y-2">
              {events.filter(e => e.status === 'completed' || e.status === 'ongoing').map(e => {
                const count = feedbacks.filter(f => f.event_id === e.id).length;
                return (
                  <div key={e.id} className="flex items-center justify-between p-2 rounded-xl bg-slate-900/40 border border-slate-850 text-xs">
                    <span className="font-semibold text-white truncate max-w-xs">{e.event_name}</span>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-slate-500 text-[10px]">{count} review{count !== 1 ? 's' : ''}</span>
                      <span className="px-2 py-0.5 rounded font-bold text-[11px] bg-cyan-950/40 text-cyan-400 border border-cyan-800/30">
                        {getAverageRatingForEvent(e.id)}
                      </span>
                    </div>
                  </div>
                );
              })}
              {events.filter(e => e.status === 'completed' || e.status === 'ongoing').length === 0 && (
                <p className="text-xs text-slate-500 text-center py-6">No completed or ongoing events registered.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between shadow-md">
        
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Search by participant name or event title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-850 hover:border-slate-800 focus:border-cyan-500/50 rounded-xl text-xs text-slate-100 placeholder-slate-650 transition-all outline-none"
          />
        </div>

        {/* Filters Select */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Events Filter */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 shrink-0">Event:</span>
            <select
              value={eventFilter}
              onChange={(e) => setEventFilter(e.target.value)}
              className="bg-slate-950 border border-slate-855 text-slate-300 text-xs rounded-xl px-3 py-1.5 focus:border-cyan-500/50 outline-none w-full sm:w-auto transition-all"
            >
              <option value="all">All Events</option>
              {events.map(ev => (
                <option key={ev.id} value={ev.id}>{ev.event_name}</option>
              ))}
            </select>
          </div>

          {/* Rating Filter */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 shrink-0">Rating:</span>
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              className="bg-slate-950 border border-slate-855 text-slate-300 text-xs rounded-xl px-3 py-1.5 focus:border-cyan-500/50 outline-none w-full sm:w-auto transition-all"
            >
              <option value="all">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>
        </div>

      </div>

      {/* Review Feed Grid list */}
      <div className="space-y-4">
        <h3 className="font-heading font-black text-slate-300 text-sm uppercase tracking-wider">
          Student Feedback Stream ({filteredFeedbacks.length})
        </h3>
        
        {filteredFeedbacks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredFeedbacks.map((feed) => {
              const part = participants.find(p => p.id === feed.participant_id);
              const event = events.find(e => e.id === feed.event_id);

              if (!part || !event) return null;

              return (
                <div 
                  key={feed.id} 
                  className="glass-panel border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700 transition-all flex flex-col justify-between gap-4"
                >
                  <div className="space-y-2">
                    {/* Header: Event & Stars */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-semibold text-white text-xs leading-tight line-clamp-1">{event.event_name}</h4>
                        <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Reviewed event</span>
                      </div>
                      <div className="shrink-0">{renderStars(feed.rating)}</div>
                    </div>

                    {/* Review text */}
                    <p className="text-slate-300 text-xs italic leading-relaxed bg-slate-950/30 p-3 rounded-xl border border-slate-900/60">
                      "{feed.comment || 'No comment text provided.'}"
                    </p>
                  </div>

                  {/* Review footer: user info */}
                  <div className="flex items-center justify-between border-t border-slate-900/60 pt-3 text-[10px]">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <User className="h-3 w-3 text-slate-500" />
                      <span className="font-bold">{part.name}</span>
                      <span className="text-slate-600">({part.department})</span>
                    </div>

                    <div className="flex items-center gap-1 text-slate-500 font-mono">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(feed.submitted_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        ) : (
          <div className="glass-panel border border-slate-800 rounded-2xl py-12 text-center text-slate-500 text-xs">
            No feedback comments compiled.
          </div>
        )}
      </div>

    </div>
  );
};
