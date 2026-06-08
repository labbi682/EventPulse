import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Calendar, 
  FileCheck, 
  Star, 
  Download, 
  Activity, 
  TrendingUp, 
  AlertCircle
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  Cell,
  Legend,
  ComposedChart,
  Line
} from 'recharts';
import type { Event, Participant, Registration, Feedback, LiveActivity } from '../types';
import { MockDatabase } from '../mockDatabase';
import { supabase } from '../supabase';

interface DashboardProps {
  dbMode: 'supabase' | 'mock';
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ dbMode, addToast }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [activities, setActivities] = useState<LiveActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPulseActive, setIsPulseActive] = useState(false);

  const loadData = async () => {
    try {
      if (dbMode === 'supabase' && supabase) {
        // Fetch all tables from Supabase
        const { data: participantsData } = await supabase.from('participants').select('*');
        const { data: registrationsData } = await supabase.from('registrations').select('*');
        const { data: feedbacksData } = await supabase.from('feedback').select('*');

        // Dynamically update statuses on load using the SQL function
        await supabase.rpc('update_event_statuses');
        
        // Re-fetch events to get updated statuses
        const { data: updatedEvents } = await supabase.from('events').select('*');

        setEvents(updatedEvents || []);
        setParticipants(participantsData || []);
        setRegistrations(registrationsData || []);
        setFeedbacks(feedbacksData || []);

        // Reconstruct live activity feed from database logs if possible, or fall back to mock
        setActivities(MockDatabase.getActivities());
      } else {
        // Mock mode
        setEvents(MockDatabase.getEvents());
        setParticipants(MockDatabase.getParticipants());
        setRegistrations(MockDatabase.getRegistrations());
        setFeedbacks(MockDatabase.getFeedback());
        setActivities(MockDatabase.getActivities());
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Listen to local DB change event
    const handleDbChange = () => {
      setIsPulseActive(true);
      loadData();
      setTimeout(() => setIsPulseActive(false), 1000);
    };

    window.addEventListener('eventpulse_db_change', handleDbChange);

    // Setup Supabase Realtime Listener if in Supabase mode
    let channel: any = null;
    if (dbMode === 'supabase' && supabase) {
      channel = supabase
        .channel('db-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'registrations' }, (payload) => {
          setIsPulseActive(true);
          
          let actionMsg = '';
          if (payload.eventType === 'INSERT') {
            actionMsg = 'New registration received on database.';
            MockDatabase.logActivity('registration', 'Real-time: New registration captured.');
          } else if (payload.eventType === 'DELETE') {
            actionMsg = 'Registration deleted from database.';
            MockDatabase.logActivity('registration', 'Real-time: Registration cancelled.');
          }
          
          addToast(`Real-time DB Sync: ${actionMsg}`, 'info');
          loadData();
          setTimeout(() => setIsPulseActive(false), 1000);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'feedback' }, () => {
          setIsPulseActive(true);
          MockDatabase.logActivity('feedback', 'Real-time: New participant feedback submitted.');
          addToast('Real-time DB Sync: Feedback received.', 'info');
          loadData();
          setTimeout(() => setIsPulseActive(false), 1000);
        })
        .subscribe();
    }

    return () => {
      window.removeEventListener('eventpulse_db_change', handleDbChange);
      if (channel) {
        supabase?.removeChannel(channel);
      }
    };
  }, [dbMode]);

  // --- Calculations & Aggregations ---

  // KPIs
  const totalRegistrations = registrations.length;
  const activeEventsCount = events.filter(e => e.status === 'upcoming' || e.status === 'ongoing').length;
  const totalParticipantsCount = participants.length;
  const waitlistedCount = registrations.filter(r => r.waitlist_position !== null).length;
  
  const avgRating = feedbacks.length > 0
    ? Number((feedbacks.reduce((acc, f) => acc + f.rating, 0) / feedbacks.length).toFixed(1))
    : 0;

  // Chart 1: Department breakdown
  const departmentBreakdown = React.useMemo(() => {
    const counts: { [key: string]: number } = {};
    
    // Walk registrations to count departments
    registrations.forEach(reg => {
      const participant = participants.find(p => p.id === reg.participant_id);
      if (participant) {
        counts[participant.department] = (counts[participant.department] || 0) + 1;
      }
    });

    return Object.keys(counts).map(dept => ({
      name: dept,
      registrations: counts[dept]
    })).sort((a, b) => b.registrations - a.registrations);
  }, [registrations, participants]);

  // Chart 2: Turnout vs Capacity
  const turnoutData = React.useMemo(() => {
    return events.map(e => {
      const regCount = registrations.filter(r => r.event_id === e.id && r.waitlist_position === null).length;
      const waitCount = registrations.filter(r => r.event_id === e.id && r.waitlist_position !== null).length;
      return {
        name: e.event_name.length > 18 ? e.event_name.slice(0, 18) + '...' : e.event_name,
        registered: regCount,
        capacity: e.max_capacity,
        waitlisted: waitCount
      };
    });
  }, [events, registrations]);

  // Chart 3: Registration Trend (Grouped by Date)
  const trendData = React.useMemo(() => {
    const dates: { [key: string]: number } = {};
    
    // Format dates to MMM DD
    registrations.forEach(r => {
      const date = new Date(r.registration_date);
      const formatted = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dates[formatted] = (dates[formatted] || 0) + 1;
    });

    // If empty, supply placeholder dates for visualization
    if (Object.keys(dates).length === 0) {
      return [
        { date: 'Jun 1', count: 0 },
        { date: 'Jun 2', count: 0 },
        { date: 'Jun 3', count: 0 }
      ];
    }

    // Sort dates chronologically (approximate by timestamp sorting)
    return Object.keys(dates).map(d => ({
      date: d,
      count: dates[d]
    }));
  }, [registrations]);

  // Popular Event Calculation
  const popularEvent = React.useMemo((): { event: Event; count: number } | null => {
    if (events.length === 0) return null;
    
    let maxRegs = -1;
    let bestEvent: Event | null = null;
    
    events.forEach(e => {
      const count = registrations.filter(r => r.event_id === e.id).length;
      if (count > maxRegs) {
        maxRegs = count;
        bestEvent = e;
      }
    });

    return bestEvent ? { event: bestEvent as Event, count: maxRegs } : null;
  }, [events, registrations]);

  // --- Export CSV Handler ---
  const handleExportCSV = () => {
    if (events.length === 0) {
      addToast('No data available to export.', 'error');
      return;
    }

    // Prepare CSV headers
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Event Name,Date,Category,Venue,Max Capacity,Confirmed Registrations,Waitlisted,Status,Average Rating\n';

    // Compile rows
    events.forEach(e => {
      const confirmed = registrations.filter(r => r.event_id === e.id && r.waitlist_position === null).length;
      const waitlist = registrations.filter(r => r.event_id === e.id && r.waitlist_position !== null).length;
      
      const eventFeeds = feedbacks.filter(f => f.event_id === e.id);
      const avgEventRating = eventFeeds.length > 0
        ? (eventFeeds.reduce((sum, f) => sum + f.rating, 0) / eventFeeds.length).toFixed(1)
        : 'N/A';

      const row = [
        `"${e.event_name.replace(/"/g, '""')}"`,
        `"${new Date(e.event_date).toLocaleDateString()}"`,
        `"${e.category}"`,
        `"${e.venue.replace(/"/g, '""')}"`,
        e.max_capacity,
        confirmed,
        waitlist,
        e.status,
        avgEventRating
      ].join(',');

      csvContent += row + '\n';
    });

    // Trigger download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `EventPulse_Analytics_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast('Analytics report exported successfully!', 'success');
  };

  const colors = ['#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#ec4899'];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-6rem)]">
        <div className="h-8 w-8 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Title bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-heading font-black text-white flex items-center gap-2">
            EventPulse Analytics Dashboard
            <Activity className={`h-5 w-5 text-cyan-400 ${isPulseActive ? 'animate-heartbeat scale-110 text-cyan-300' : ''}`} />
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Real-time event trackers, department breakdowns, turnout rates, and feedback.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-cyan-950/40 border border-cyan-800/40 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-900/30 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.02)]"
          >
            <Download className="h-4 w-4" />
            Export Analytics CSV
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* KPI 1 */}
        <div className="glass-panel border border-slate-800/80 p-5 rounded-2xl flex items-center gap-4 relative overflow-hidden group hover:border-cyan-500/20 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-bl-full pointer-events-none transition-all duration-300 group-hover:bg-cyan-500/10"></div>
          <div className="p-3 bg-cyan-950/40 border border-cyan-800/30 text-cyan-400 rounded-xl">
            <FileCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Total Signups</p>
            <h3 className="text-2xl font-heading font-black text-white mt-1 leading-none">
              {totalRegistrations}
            </h3>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="glass-panel border border-slate-800/80 p-5 rounded-2xl flex items-center gap-4 relative overflow-hidden group hover:border-blue-500/20 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-bl-full pointer-events-none transition-all duration-300 group-hover:bg-blue-500/10"></div>
          <div className="p-3 bg-blue-950/40 border border-blue-800/30 text-blue-400 rounded-xl">
            <Calendar className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Active Events</p>
            <h3 className="text-2xl font-heading font-black text-white mt-1 leading-none">
              {activeEventsCount}
            </h3>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="glass-panel border border-slate-800/80 p-5 rounded-2xl flex items-center gap-4 relative overflow-hidden group hover:border-indigo-500/20 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-bl-full pointer-events-none transition-all duration-300 group-hover:bg-indigo-500/10"></div>
          <div className="p-3 bg-indigo-950/40 border border-indigo-800/30 text-indigo-400 rounded-xl">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Students Pool</p>
            <h3 className="text-2xl font-heading font-black text-white mt-1 leading-none">
              {totalParticipantsCount}
            </h3>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="glass-panel border border-slate-800/80 p-5 rounded-2xl flex items-center gap-4 relative overflow-hidden group hover:border-amber-500/20 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-bl-full pointer-events-none transition-all duration-300 group-hover:bg-amber-500/10"></div>
          <div className="p-3 bg-amber-950/40 border border-amber-800/30 text-amber-400 rounded-xl">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Waitlisted</p>
            <h3 className="text-2xl font-heading font-black text-white mt-1 leading-none">
              {waitlistedCount}
            </h3>
          </div>
        </div>

        {/* KPI 5 */}
        <div className="glass-panel border border-slate-800/80 p-5 rounded-2xl flex items-center gap-4 relative overflow-hidden group hover:border-purple-500/20 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-bl-full pointer-events-none transition-all duration-300 group-hover:bg-purple-500/10"></div>
          <div className="p-3 bg-purple-950/40 border border-purple-800/30 text-purple-400 rounded-xl">
            <Star className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Avg Rating</p>
            <h3 className="text-2xl font-heading font-black text-white mt-1 leading-none flex items-center gap-1">
              {avgRating} <span className="text-xs text-slate-500">/ 5</span>
            </h3>
          </div>
        </div>
      </div>

      {/* Analytics Charts Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Trend Area Chart (Span 2) */}
        <div className="lg:col-span-2 glass-panel border border-slate-800/80 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-heading font-bold text-slate-100 text-sm">Registration Trend over Time</h4>
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Historical Accumulations</p>
            </div>
            <span className="flex items-center gap-1 bg-slate-900 border border-slate-800 px-2 py-1 rounded-lg text-[10px] text-cyan-400 font-bold">
              <TrendingUp className="h-3 w-3" /> Live
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRegs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00f0ff" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#00f0ff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b/30" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="count" name="Registrations" stroke="#00f0ff" strokeWidth={2} fillOpacity={1} fill="url(#colorRegs)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Popular Event Insights */}
        <div className="lg:col-span-1 glass-panel border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <h4 className="font-heading font-bold text-slate-100 text-sm">Event Spotlights</h4>
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Top Performing Events</p>
            </div>

            {popularEvent ? (
              <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/60 relative overflow-hidden group hover:border-cyan-500/25 transition-all">
                <span className="absolute top-2 right-2 text-[10px] font-bold text-cyan-400 uppercase tracking-widest bg-cyan-950/80 border border-cyan-800/30 px-2 py-0.5 rounded-md">
                  Most Popular
                </span>
                
                <h5 className="font-heading font-black text-white text-base mt-2 truncate">
                  {popularEvent.event.event_name}
                </h5>
                <p className="text-xs text-slate-400 mt-1 truncate">
                  Venue: {popularEvent.event.venue}
                </p>

                <div className="grid grid-cols-2 gap-4 mt-4 pt-3 border-t border-slate-800/60">
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Signups</span>
                    <p className="text-xl font-heading font-black text-cyan-400 mt-0.5">{popularEvent.count}</p>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Capacity</span>
                    <p className="text-xl font-heading font-black text-slate-300 mt-0.5">{popularEvent.event.max_capacity}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-10 text-center text-slate-500 text-xs">
                No events currently configured.
              </div>
            )}
          </div>

          {/* Database Info panel */}
          <div className="mt-4 pt-4 border-t border-slate-900 flex items-center justify-between text-xs text-slate-400">
            <span>Server mode:</span>
            <span className={`font-bold px-2 py-0.5 rounded-md border text-[10px] uppercase ${
              dbMode === 'supabase'
                ? 'bg-cyan-950/40 border-cyan-800/40 text-cyan-400'
                : 'bg-amber-950/20 border-amber-900/30 text-amber-400'
            }`}>
              {dbMode}
            </span>
          </div>
        </div>

      </div>

      {/* Second Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Turnout vs Capacity Composed Chart */}
        <div className="glass-panel border border-slate-800/80 rounded-2xl p-5 space-y-4">
          <div>
            <h4 className="font-heading font-bold text-slate-100 text-sm">Turnout vs Capacity</h4>
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Registered (Confirmed) Seats vs Event Limits</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={turnoutData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b/30" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '10px', marginTop: '10px' }} />
                <Bar dataKey="registered" name="Confirmed Participants" fill="#00f0ff" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="waitlisted" name="Waitlisted" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={20} />
                <Line type="monotone" dataKey="capacity" name="Max Capacity" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: '#8b5cf6', r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Distribution Bar Chart */}
        <div className="glass-panel border border-slate-800/80 rounded-2xl p-5 space-y-4">
          <div>
            <h4 className="font-heading font-bold text-slate-100 text-sm">Department-wise Participation</h4>
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Distribution of student enrollments</p>
          </div>

          <div className="h-64 w-full">
            {departmentBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departmentBreakdown} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b/30" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="registrations" name="Signups" fill="#8b5cf6" radius={[4, 4, 0, 0]}>
                    {departmentBreakdown.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                No participant data recorded. Create participants and register them to populate department metrics.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Live Logger & Activity Console */}
      <div className="glass-panel border border-slate-800/80 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-heading font-bold text-slate-100 text-sm flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              EventPulse Live Activity Console
            </h4>
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Live database stream</p>
          </div>

          <button
            onClick={() => {
              MockDatabase.clearActivities();
              setActivities([]);
              addToast('Activity logs cleared locally.', 'info');
            }}
            className="text-[10px] font-bold text-rose-400 hover:text-rose-300 bg-rose-950/20 hover:bg-rose-950/40 border border-rose-900/25 px-3 py-1.5 rounded-lg transition-all"
          >
            Clear Console Logs
          </button>
        </div>

        <div className="bg-slate-950/80 border border-slate-900 rounded-xl overflow-hidden font-mono text-xs max-h-56 overflow-y-auto">
          {activities.length > 0 ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-900 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                  <th className="py-2.5 px-4">Timestamp</th>
                  <th className="py-2.5 px-4">Category</th>
                  <th className="py-2.5 px-4">Console Log Message</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/40">
                {activities.map((act) => {
                  const tagStyles = {
                    registration: 'bg-cyan-950/50 text-cyan-400 border border-cyan-800/30',
                    feedback: 'bg-purple-950/50 text-purple-400 border border-purple-800/30',
                    event_created: 'bg-blue-950/50 text-blue-400 border border-blue-800/30',
                    event_status: 'bg-emerald-950/50 text-emerald-400 border border-emerald-800/30',
                    waitlist_promote: 'bg-amber-950/50 text-amber-400 border border-amber-800/30',
                  };

                  return (
                    <tr key={act.id} className="hover:bg-slate-900/20 transition-all">
                      <td className="py-2 px-4 text-slate-500">
                        {new Date(act.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="py-2 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${tagStyles[act.type] || 'bg-slate-800'}`}>
                          {act.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-2 px-4 text-slate-300 font-medium">
                        {act.message}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="py-8 text-center text-slate-500">
              Console initialized. Awaiting database operations...
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
