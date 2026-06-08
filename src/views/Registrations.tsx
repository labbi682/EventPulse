import React, { useState, useEffect } from 'react';
import { 
  FileCheck, 
  Plus, 
  Search, 
  Calendar, 
  User, 
  Trash2, 
  X,
  Clock,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import type { Registration, Event, Participant } from '../types';
import { MockDatabase } from '../mockDatabase';
import { supabase } from '../supabase';

interface RegistrationsProps {
  dbMode: 'supabase' | 'mock';
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const Registrations: React.FC<RegistrationsProps> = ({ dbMode, addToast }) => {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [eventFilter, setEventFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [selectedParticipantId, setSelectedParticipantId] = useState('');

  const loadData = async () => {
    try {
      if (dbMode === 'supabase' && supabase) {
        const { data: regsData } = await supabase.from('registrations').select('*');
        const { data: eventsData } = await supabase.from('events').select('*');
        const { data: partsData } = await supabase.from('participants').select('*');

        setRegistrations(regsData || []);
        setEvents(eventsData || []);
        setParticipants(partsData || []);
      } else {
        setRegistrations(MockDatabase.getRegistrations());
        setEvents(MockDatabase.getEvents());
        setParticipants(MockDatabase.getParticipants());
      }
    } catch (err) {
      console.error('Error loading registrations:', err);
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

  const openModal = () => {
    if (events.length === 0) {
      addToast('Please create an event first.', 'error');
      return;
    }
    if (participants.length === 0) {
      addToast('Please register a participant first.', 'error');
      return;
    }

    // Default selectors
    setSelectedEventId(events[0].id);
    setSelectedParticipantId(participants[0].id);
    setIsModalOpen(true);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId || !selectedParticipantId) {
      addToast('Please select both an event and a participant.', 'error');
      return;
    }

    try {
      if (dbMode === 'supabase' && supabase) {
        // Block duplicates on client side before hitting DB UNIQUE constraint
        const exists = registrations.find(
          r => r.event_id === selectedEventId && r.participant_id === selectedParticipantId
        );
        if (exists) {
          throw new Error('This student is already registered for this event.');
        }

        const { error } = await supabase
          .from('registrations')
          .insert([{ event_id: selectedEventId, participant_id: selectedParticipantId }]);

        if (error) {
          if (error.code === '23505') {
            throw new Error('This student is already registered for this event.');
          }
          throw error;
        }
        addToast('Registration submitted successfully!', 'success');
      } else {
        // Mock Mode: Replicates all duplicate blocks & waitlist logics
        MockDatabase.addRegistration(selectedEventId, selectedParticipantId);
        addToast('Registration completed!', 'success');
      }

      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      addToast(err.message || 'Registration failed.', 'error');
    }
  };

  const handleCancelRegistration = async (id: string, pName: string, eName: string) => {
    if (!window.confirm(`Cancel registration for "${pName}" at "${eName}"? Deletions automatically promote the next waitlisted student.`)) {
      return;
    }

    try {
      if (dbMode === 'supabase' && supabase) {
        const { error } = await supabase
          .from('registrations')
          .delete()
          .eq('id', id);

        if (error) throw error;
        addToast(`Cancelled registration for ${pName}.`, 'success');
      } else {
        // Mock Mode replicates the AFTER DELETE auto promotion trigger
        MockDatabase.deleteRegistration(id);
        addToast(`Cancelled registration for ${pName}.`, 'success');
      }
      loadData();
    } catch (err: any) {
      addToast(err.message || 'Failed to cancel registration.', 'error');
    }
  };

  // Helper info about capacity for the selected event in form
  const getCapacityWarning = () => {
    if (!selectedEventId) return null;
    const event = events.find(e => e.id === selectedEventId);
    if (!event) return null;

    const confirmedCount = registrations.filter(
      r => r.event_id === selectedEventId && r.waitlist_position === null
    ).length;

    const waitlistCount = registrations.filter(
      r => r.event_id === selectedEventId && r.waitlist_position !== null
    ).length;

    if (confirmedCount >= event.max_capacity) {
      return {
        type: 'waitlist',
        message: `Notice: This event is currently FULL (${confirmedCount}/${event.max_capacity} seats filled). Submitting will automatically place this student on the waitlist at position #${waitlistCount + 1}.`,
      };
    }

    return {
      type: 'confirmed',
      message: `Space available! Event capacity is ${confirmedCount}/${event.max_capacity} filled. This student will receive a CONFIRMED slot immediately.`,
    };
  };

  const capWarning = getCapacityWarning();

  // Joint filters mapping
  const filteredRegs = registrations.filter(r => {
    const participant = participants.find(p => p.id === r.participant_id);
    const event = events.find(e => e.id === r.event_id);

    if (!participant || !event) return false;

    const matchesSearch = participant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          participant.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesEvent = eventFilter === 'all' || r.event_id === eventFilter;
    
    let matchesStatus = true;
    if (statusFilter === 'confirmed') {
      matchesStatus = r.waitlist_position === null;
    } else if (statusFilter === 'waitlisted') {
      matchesStatus = r.waitlist_position !== null;
    }

    return matchesSearch && matchesEvent && matchesStatus;
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
            <FileCheck className="h-6 w-6 text-cyan-400 animate-pulse-glow" />
            Admissions & Registrations
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Sign up participants for college fests, review seat statuses, and cancel enrollments.
          </p>
        </div>

        <button
          onClick={openModal}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-xl cursor-pointer transition-all shadow-[0_0_15px_rgba(6,182,212,0.15)] hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] shrink-0"
        >
          <Plus className="h-4 w-4" />
          New Registration
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
            placeholder="Search by registered student name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-850 hover:border-slate-800 focus:border-cyan-500/50 rounded-xl text-xs text-slate-100 placeholder-slate-650 outline-none transition-all"
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

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 shrink-0">Seat:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-855 text-slate-300 text-xs rounded-xl px-3 py-1.5 focus:border-cyan-500/50 outline-none w-full sm:w-auto transition-all"
            >
              <option value="all">All Statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="waitlisted">Waitlisted</option>
            </select>
          </div>
        </div>

      </div>

      {/* Registry Table */}
      <div className="glass-panel border border-slate-800 rounded-2xl overflow-hidden shadow-md">
        {filteredRegs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-900 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                  <th className="py-3 px-6">Participant</th>
                  <th className="py-3 px-6">Department</th>
                  <th className="py-3 px-6">Registered Event</th>
                  <th className="py-3 px-6">Signup Date</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/40">
                {filteredRegs.map((reg) => {
                  const part = participants.find(p => p.id === reg.participant_id);
                  const event = events.find(e => e.id === reg.event_id);

                  if (!part || !event) return null;

                  return (
                    <tr key={reg.id} className="hover:bg-slate-900/10 transition-all">
                      <td className="py-3.5 px-6">
                        <p className="font-bold text-white leading-tight">{part.name}</p>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">{part.email}</p>
                      </td>
                      <td className="py-3.5 px-6 text-xs text-slate-300 font-semibold">
                        {part.department}
                      </td>
                      <td className="py-3.5 px-6 font-semibold text-slate-100 text-xs">
                        {event.event_name}
                      </td>
                      <td className="py-3.5 px-6 text-xs text-slate-400">
                        {new Date(reg.registration_date).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                      </td>
                      <td className="py-3.5 px-6">
                        {reg.waitlist_position === null ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/50 border border-emerald-800/30 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.05)]">
                            <CheckCircle className="h-3 w-3 shrink-0" />
                            Confirmed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/40 border border-amber-800/30 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.05)]">
                            <Clock className="h-3 w-3 shrink-0" />
                            Waitlist #{reg.waitlist_position}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <button
                          onClick={() => handleCancelRegistration(reg.id, part.name, event.event_name)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 border border-transparent hover:border-rose-900/20 transition-all cursor-pointer"
                          title="Cancel Enrollment"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-slate-500 text-sm">
            <FileCheck className="h-10 w-10 mx-auto text-slate-600 mb-3" />
            No registration records catalogued.
          </div>
        )}
      </div>

      {/* New Registration Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="glass-panel border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl relative animate-fade-in">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-900 flex items-center justify-between bg-slate-950/60">
              <h3 className="font-heading font-black text-lg text-white">
                Register Participant for Event
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 hover:bg-slate-855 p-1.5 rounded-lg transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleRegister} className="p-6 space-y-4">
              
              {/* Event Dropdown */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Select Event
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Calendar className="h-4 w-4" />
                  </span>
                  <select
                    value={selectedEventId}
                    onChange={(e) => setSelectedEventId(e.target.value)}
                    className="block w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-855 focus:border-cyan-500/50 rounded-xl text-sm text-slate-200 outline-none transition-all"
                  >
                    {events.map(ev => (
                      <option key={ev.id} value={ev.id}>
                        {ev.event_name} (Max Capacity: {ev.max_capacity})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Participant Dropdown */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Select Student Participant
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <User className="h-4 w-4" />
                  </span>
                  <select
                    value={selectedParticipantId}
                    onChange={(e) => setSelectedParticipantId(e.target.value)}
                    className="block w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-855 focus:border-cyan-500/50 rounded-xl text-sm text-slate-200 outline-none transition-all"
                  >
                    {participants.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} - {p.department} ({p.email})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dynamic Capacity Warning Alert */}
              {capWarning && (
                <div className={`p-4 rounded-xl border text-xs leading-relaxed flex items-start gap-2.5 ${
                  capWarning.type === 'waitlist' 
                    ? 'bg-amber-950/20 border-amber-900/30 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.02)]' 
                    : 'bg-cyan-950/25 border-cyan-900/25 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.02)]'
                }`}>
                  {capWarning.type === 'waitlist' ? (
                    <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  )}
                  <span>{capWarning.message}</span>
                </div>
              )}

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
                  Confirm Registration
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
