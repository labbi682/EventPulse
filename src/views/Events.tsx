import React, { useState, useEffect } from 'react';
import { 
  CalendarRange, 
  Plus, 
  Search, 
  MapPin, 
  Calendar, 
  Users, 
  Edit, 
  Trash2, 
  AlertTriangle,
  X
} from 'lucide-react';
import type { Event, Registration } from '../types';
import { MockDatabase } from '../mockDatabase';
import { supabase } from '../supabase';

interface EventsProps {
  dbMode: 'supabase' | 'mock';
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const Events: React.FC<EventsProps> = ({ dbMode, addToast }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  // Form Fields
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [category, setCategory] = useState('Technical');
  const [venue, setVenue] = useState('');
  const [maxCapacity, setMaxCapacity] = useState(30);
  const [status, setStatus] = useState<'upcoming' | 'ongoing' | 'completed' | 'cancelled'>('upcoming');

  const loadData = async () => {
    try {
      if (dbMode === 'supabase' && supabase) {
        // Automatically check event statuses prior to fetching
        await supabase.rpc('update_event_statuses');

        const { data: eventsData } = await supabase.from('events').select('*');
        const { data: regsData } = await supabase.from('registrations').select('*');

        // Sort events: upcoming/ongoing first, then completed/cancelled, ordered by date
        const sorted = (eventsData || []).sort((a, b) => {
          return new Date(a.event_date).getTime() - new Date(b.event_date).getTime();
        });

        setEvents(sorted);
        setRegistrations(regsData || []);
      } else {
        const sorted = MockDatabase.getEvents().sort((a, b) => {
          return new Date(a.event_date).getTime() - new Date(b.event_date).getTime();
        });
        setEvents(sorted);
        setRegistrations(MockDatabase.getRegistrations());
      }
    } catch (err) {
      console.error('Error loading events:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Listen to local DB change event
    const handleDbChange = () => loadData();
    window.addEventListener('eventpulse_db_change', handleDbChange);
    return () => window.removeEventListener('eventpulse_db_change', handleDbChange);
  }, [dbMode]);

  // Open Create/Edit modal
  const openModal = (event?: Event) => {
    if (event) {
      setEditingEvent(event);
      setEventName(event.event_name);
      // Format ISO string to datetime-local value (YYYY-MM-DDTHH:MM)
      const date = new Date(event.event_date);
      date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
      setEventDate(date.toISOString().slice(0, 16));
      setCategory(event.category);
      setVenue(event.venue);
      setMaxCapacity(event.max_capacity);
      setStatus(event.status);
    } else {
      setEditingEvent(null);
      setEventName('');
      // Default to today + 5 days
      const defaultDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
      defaultDate.setMinutes(defaultDate.getMinutes() - defaultDate.getTimezoneOffset());
      setEventDate(defaultDate.toISOString().slice(0, 16));
      setCategory('Technical');
      setVenue('');
      setMaxCapacity(30);
      setStatus('upcoming');
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventName.trim() || !venue.trim() || maxCapacity <= 0) {
      addToast('Please fill out all fields correctly.', 'error');
      return;
    }

    const payload = {
      event_name: eventName,
      event_date: new Date(eventDate).toISOString(),
      category,
      venue,
      max_capacity: Number(maxCapacity),
      status,
    };

    try {
      if (dbMode === 'supabase' && supabase) {
        if (editingEvent) {
          // Check if capacity increased to promote waitlisted registrations in DB
          // We let our triggers handle it on update!
          const { error } = await supabase
            .from('events')
            .update(payload)
            .eq('id', editingEvent.id);

          if (error) throw error;
          addToast(`Event "${eventName}" updated successfully!`, 'success');
        } else {
          const { error } = await supabase
            .from('events')
            .insert([payload]);

          if (error) throw error;
          addToast(`Event "${eventName}" created successfully!`, 'success');
        }
      } else {
        // Mock Mode
        MockDatabase.saveEvent({
          ...payload,
          id: editingEvent?.id
        } as Event);
        addToast(
          editingEvent 
            ? `Event "${eventName}" updated successfully!` 
            : `Event "${eventName}" created successfully!`, 
          'success'
        );
      }

      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      addToast(err.message || 'Failed to save event.', 'error');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"? This will cancel all associated student registrations.`)) {
      return;
    }

    try {
      if (dbMode === 'supabase' && supabase) {
        const { error } = await supabase
          .from('events')
          .delete()
          .eq('id', id);

        if (error) throw error;
        addToast(`Event "${name}" deleted.`, 'success');
      } else {
        MockDatabase.deleteEvent(id);
        addToast(`Event "${name}" deleted.`, 'success');
      }
      loadData();
    } catch (err: any) {
      addToast(err.message || 'Failed to delete event.', 'error');
    }
  };

  // Filter and Search Logic
  const filteredEvents = events.filter(e => {
    const matchesSearch = e.event_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          e.venue.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || e.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-heading font-black text-white flex items-center gap-2">
            <CalendarRange className="h-6 w-6 text-cyan-400 animate-pulse-glow" />
            Event Management
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Create and edit event details, track capacity guidelines, and check enrollment status.
          </p>
        </div>

        <button
          onClick={() => openModal()}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-xl cursor-pointer transition-all shadow-[0_0_15px_rgba(6,182,212,0.1)] hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] shrink-0"
        >
          <Plus className="h-4 w-4" />
          Create New Event
        </button>
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
            placeholder="Search events by title or venue..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-850 hover:border-slate-800 focus:border-cyan-500/50 rounded-xl text-xs text-slate-100 placeholder-slate-600 transition-all outline-none"
          />
        </div>

        {/* Filters Select */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Status */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 shrink-0">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-850 text-slate-300 text-xs rounded-xl px-3 py-1.5 focus:border-cyan-500/50 outline-none w-full sm:w-auto transition-all"
            >
              <option value="all">All Statuses</option>
              <option value="upcoming">Upcoming</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Category */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 shrink-0">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-950 border border-slate-850 text-slate-300 text-xs rounded-xl px-3 py-1.5 focus:border-cyan-500/50 outline-none w-full sm:w-auto transition-all"
            >
              <option value="all">All Categories</option>
              <option value="Technical">Technical</option>
              <option value="Cultural">Cultural</option>
              <option value="Academic">Academic</option>
              <option value="Social">Social</option>
              <option value="Arts">Arts</option>
            </select>
          </div>
        </div>

      </div>

      {/* Events Grid layout */}
      {filteredEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => {
            // Calculate confirmed vs waitlist count
            const confirmedRegs = registrations.filter(r => r.event_id === event.id && r.waitlist_position === null);
            const waitlistedRegs = registrations.filter(r => r.event_id === event.id && r.waitlist_position !== null);

            const confirmedCount = confirmedRegs.length;
            const waitlistedCount = waitlistedRegs.length;
            const capacityRatio = Math.min((confirmedCount / event.max_capacity) * 100, 100);

            // Status badges styles
            const badgeStyles = {
              upcoming: 'bg-blue-950/60 text-blue-400 border border-blue-800/40 shadow-[0_0_10px_rgba(59,130,246,0.05)]',
              ongoing: 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.1)]',
              completed: 'bg-purple-950/60 text-purple-400 border border-purple-800/40 shadow-[0_0_10px_rgba(139,92,246,0.05)]',
              cancelled: 'bg-rose-950/40 text-rose-400 border border-rose-900/30 shadow-[0_0_10px_rgba(244,63,94,0.05)]',
            };

            return (
              <div 
                key={event.id}
                className="glass-panel border border-slate-800 rounded-2xl flex flex-col justify-between overflow-hidden group hover:border-slate-700 transition-all duration-300 shadow-md relative"
              >
                
                {/* Event Top Section */}
                <div className="p-5 space-y-4">
                  {/* Badge Row */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400 px-2 py-0.5 rounded-lg bg-cyan-950/40 border border-cyan-900/25">
                      {event.category}
                    </span>

                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${badgeStyles[event.status]}`}>
                      {event.status}
                    </span>
                  </div>

                  {/* Title & Info */}
                  <div className="space-y-1">
                    <h3 className="font-heading font-black text-lg text-white group-hover:text-cyan-400 transition-colors leading-tight line-clamp-1">
                      {event.event_name}
                    </h3>
                    
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Calendar className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                      <span>{new Date(event.event_date).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <MapPin className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">{event.venue}</span>
                    </div>
                  </div>

                  {/* Capacity Progress bar */}
                  <div className="space-y-2 pt-2 border-t border-slate-900">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-slate-500" />
                        Seats Filled
                      </span>
                      <span className="text-slate-200">
                        {confirmedCount} <span className="text-slate-500">/ {event.max_capacity}</span>
                      </span>
                    </div>

                    {/* Bar */}
                    <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-950">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          capacityRatio >= 100 
                            ? 'bg-gradient-to-r from-cyan-500 to-indigo-500' 
                            : 'bg-cyan-500'
                        }`}
                        style={{ width: `${capacityRatio}%` }}
                      ></div>
                    </div>

                    {/* Waitlisted Warning Indicator */}
                    {waitlistedCount > 0 && (
                      <div className="flex items-center gap-1.5 text-[10px] text-amber-400 bg-amber-950/20 border border-amber-900/25 px-2.5 py-1 rounded-xl w-fit font-bold">
                        <AlertTriangle className="h-3 w-3 shrink-0" />
                        <span>{waitlistedCount} student{waitlistedCount > 1 ? 's' : ''} on Waitlist</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Event Action Row */}
                <div className="bg-slate-950/60 border-t border-slate-900/80 px-5 py-3.5 flex items-center justify-end gap-2 shrink-0">
                  <button
                    onClick={() => openModal(event)}
                    className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent hover:border-slate-800 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                  >
                    <Edit className="h-3.5 w-3.5" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(event.id, event.event_name)}
                    className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/20 border border-transparent hover:border-rose-900/20 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-panel border border-slate-800 rounded-2xl py-16 text-center text-slate-500 text-sm">
          <CalendarRange className="h-10 w-10 mx-auto text-slate-600 mb-3" />
          No events found matching the specified filters.
        </div>
      )}

      {/* Create / Edit Modal Container */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="glass-panel border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl relative animate-fade-in my-8">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-900 flex items-center justify-between bg-slate-950/60">
              <h3 className="font-heading font-black text-lg text-white">
                {editingEvent ? 'Edit Event Details' : 'Create New Event'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 hover:bg-slate-850 p-1.5 rounded-lg transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              
              {/* Event Name */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Event Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hackathon 2026, AI Symposium"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  className="block w-full px-4 py-2.5 bg-slate-950 border border-slate-850 focus:border-cyan-500/50 rounded-xl text-sm text-slate-100 placeholder-slate-700 outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Date */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Event Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="block w-full px-4 py-2.5 bg-slate-950 border border-slate-850 focus:border-cyan-500/50 rounded-xl text-sm text-slate-100 outline-none transition-all"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="block w-full px-4 py-2.5 bg-slate-950 border border-slate-850 focus:border-cyan-500/50 rounded-xl text-sm text-slate-200 outline-none transition-all"
                  >
                    <option value="Technical">Technical</option>
                    <option value="Cultural">Cultural</option>
                    <option value="Academic">Academic</option>
                    <option value="Social">Social</option>
                    <option value="Arts">Arts</option>
                  </select>
                </div>
              </div>

              {/* Venue */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Venue Location
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Seminar Hall A, Auditorium Main"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  className="block w-full px-4 py-2.5 bg-slate-950 border border-slate-850 focus:border-cyan-500/50 rounded-xl text-sm text-slate-100 placeholder-slate-750 outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Max capacity */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Max Seat Capacity
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={maxCapacity}
                    onChange={(e) => setMaxCapacity(Number(e.target.value))}
                    className="block w-full px-4 py-2.5 bg-slate-950 border border-slate-850 focus:border-cyan-500/50 rounded-xl text-sm text-slate-100 outline-none transition-all"
                  />
                  {editingEvent && maxCapacity > editingEvent.max_capacity && (
                    <p className="text-[10px] text-emerald-400 mt-1">
                      Increasing capacity will automatically promote waitlisted participants!
                    </p>
                  )}
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="block w-full px-4 py-2.5 bg-slate-950 border border-slate-850 focus:border-cyan-500/50 rounded-xl text-sm text-slate-200 outline-none transition-all"
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-900 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-850 hover:bg-slate-900 text-slate-400 hover:text-slate-200 text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs cursor-pointer transition-all shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                >
                  {editingEvent ? 'Save Changes' : 'Create Event'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
