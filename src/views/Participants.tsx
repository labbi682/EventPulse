import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Mail, 
  Briefcase, 
  Trash2, 
  Edit, 
  X,
  FileCheck
} from 'lucide-react';
import type { Participant, Registration } from '../types';
import { MockDatabase } from '../mockDatabase';
import { supabase } from '../supabase';

interface ParticipantsProps {
  dbMode: 'supabase' | 'mock';
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const Participants: React.FC<ParticipantsProps> = ({ dbMode, addToast }) => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('Computer Science');

  const loadData = async () => {
    try {
      if (dbMode === 'supabase' && supabase) {
        const { data: partData } = await supabase.from('participants').select('*');
        const { data: regData } = await supabase.from('registrations').select('*');
        setParticipants(partData || []);
        setRegistrations(regData || []);
      } else {
        setParticipants(MockDatabase.getParticipants());
        setRegistrations(MockDatabase.getRegistrations());
      }
    } catch (err) {
      console.error('Error loading participants:', err);
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
  const openModal = (participant?: Participant) => {
    if (participant) {
      setEditingParticipant(participant);
      setName(participant.name);
      setEmail(participant.email);
      setDepartment(participant.department);
    } else {
      setEditingParticipant(null);
      setName('');
      setEmail('');
      setDepartment('Computer Science');
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      addToast('Please fill out all fields.', 'error');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      addToast('Please enter a valid email address.', 'error');
      return;
    }

    const payload = {
      name: name.trim(),
      email: email.trim(),
      department,
    };

    try {
      if (dbMode === 'supabase' && supabase) {
        if (editingParticipant) {
          const { error } = await supabase
            .from('participants')
            .update(payload)
            .eq('id', editingParticipant.id);

          if (error) throw error;
          addToast(`Participant "${name}" updated successfully!`, 'success');
        } else {
          const { error } = await supabase
            .from('participants')
            .insert([payload]);

          if (error) throw error;
          addToast(`Participant "${name}" added successfully!`, 'success');
        }
      } else {
        // Mock Mode
        MockDatabase.saveParticipant({
          ...payload,
          id: editingParticipant?.id
        } as Participant);
        addToast(
          editingParticipant 
            ? `Participant "${name}" updated successfully!` 
            : `Participant "${name}" added successfully!`, 
          'success'
        );
      }

      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      addToast(err.message || 'Failed to save participant profile.', 'error');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete participant "${name}"? This will cancel all their registrations and promote waitlisted students if necessary.`)) {
      return;
    }

    try {
      if (dbMode === 'supabase' && supabase) {
        // Let SQL CASCADE handles registrations and trigger promoters
        const { error } = await supabase
          .from('participants')
          .delete()
          .eq('id', id);

        if (error) throw error;
        addToast(`Participant "${name}" deleted.`, 'success');
      } else {
        MockDatabase.deleteParticipant(id);
        addToast(`Participant "${name}" deleted.`, 'success');
      }
      loadData();
    } catch (err: any) {
      addToast(err.message || 'Failed to delete participant.', 'error');
    }
  };

  // Filter and Search Logic
  const filteredParticipants = participants.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = deptFilter === 'all' || p.department === deptFilter;

    return matchesSearch && matchesDept;
  });

  // Unique departments list for filter options
  const departments = ['Computer Science', 'Electronics Engineering', 'Mechanical Engineering', 'Business Administration', 'Information Technology', 'Biotechnology'];

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
            <Users className="h-6 w-6 text-cyan-400 animate-pulse-glow" />
            Participant Directory
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Register students into the EventPulse database, manage details, and check registration tallies.
          </p>
        </div>

        <button
          onClick={() => openModal()}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-xl cursor-pointer transition-all shadow-[0_0_15px_rgba(6,182,212,0.1)] hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] shrink-0"
        >
          <Plus className="h-4 w-4" />
          Add Participant
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
            placeholder="Search by student name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-850 hover:border-slate-800 focus:border-cyan-500/50 rounded-xl text-xs text-slate-100 placeholder-slate-650 transition-all outline-none"
          />
        </div>

        {/* Filters Select */}
        <div className="flex items-center gap-1.5 w-full md:w-auto">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 shrink-0">Department:</span>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="bg-slate-950 border border-slate-850 text-slate-300 text-xs rounded-xl px-3 py-1.5 focus:border-cyan-500/50 outline-none w-full sm:w-auto transition-all"
          >
            <option value="all">All Departments</option>
            {departments.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

      </div>

      {/* Participants Table Container */}
      <div className="glass-panel border border-slate-800 rounded-2xl overflow-hidden shadow-md">
        {filteredParticipants.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-900 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                  <th className="py-3 px-6">Name</th>
                  <th className="py-3 px-6">Department</th>
                  <th className="py-3 px-6">Email Contact</th>
                  <th className="py-3 px-6 text-center">Registered Events</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/40">
                {filteredParticipants.map((part) => {
                  const regCount = registrations.filter(r => r.participant_id === part.id).length;
                  
                  return (
                    <tr key={part.id} className="hover:bg-slate-900/10 transition-all">
                      <td className="py-3.5 px-6 font-bold text-white">
                        {part.name}
                      </td>
                      <td className="py-3.5 px-6 text-xs font-semibold text-slate-300">
                        {part.department}
                      </td>
                      <td className="py-3.5 px-6 text-xs text-slate-400 font-mono">
                        {part.email}
                      </td>
                      <td className="py-3.5 px-6 text-center">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-950/40 border border-cyan-900/20 text-cyan-400">
                          <FileCheck className="h-3.5 w-3.5" />
                          {regCount} Event{regCount !== 1 ? 's' : ''}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-right space-x-1 shrink-0">
                        <button
                          onClick={() => openModal(part)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-all cursor-pointer"
                          title="Edit Profile"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(part.id, part.name)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 transition-all cursor-pointer"
                          title="Delete Profile"
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
            <Users className="h-10 w-10 mx-auto text-slate-600 mb-3" />
            No participants found matching the current search parameters.
          </div>
        )}
      </div>

      {/* Create / Edit Modal Container */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="glass-panel border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl relative animate-fade-in">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-900 flex items-center justify-between bg-slate-950/60">
              <h3 className="font-heading font-black text-lg text-white">
                {editingParticipant ? 'Edit Student Profile' : 'Add New Participant'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 hover:bg-slate-855 p-1.5 rounded-lg transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSave} className="p-6 space-y-4">
              
              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Liam Johnson, Sophia Patel"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full px-4 py-2.5 bg-slate-950 border border-slate-850 focus:border-cyan-500/50 rounded-xl text-sm text-slate-100 placeholder-slate-700 outline-none transition-all"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  College Email
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Mail className="h-4 w-4" />
                  </span>
                  <input
                    type="email"
                    required
                    placeholder="student.name@college.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-855 focus:border-cyan-500/50 rounded-xl text-sm text-slate-100 placeholder-slate-700 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Department */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Academic Department
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Briefcase className="h-4 w-4" />
                  </span>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="block w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-855 focus:border-cyan-500/50 rounded-xl text-sm text-slate-200 outline-none transition-all"
                  >
                    {departments.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
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
                  {editingParticipant ? 'Save Changes' : 'Add Profile'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
