import type { Event, Participant, Registration, Feedback, LiveActivity } from './types';

// Standard seed data matching schema.sql
const defaultEvents: Event[] = [
  {
    id: 'e1a11111-1111-1111-1111-111111111111',
    event_name: 'Inter-College Hackathon 2026',
    event_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'Technical',
    venue: 'Seminar Hall A',
    max_capacity: 5,
    status: 'upcoming',
  },
  {
    id: 'e2b22222-2222-2222-2222-222222222222',
    event_name: 'AI & Machine Learning Symposium',
    event_date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    category: 'Technical',
    venue: 'Auditorium Main',
    max_capacity: 30,
    status: 'ongoing',
  },
  {
    id: 'e3c33333-3333-3333-3333-333333333333',
    event_name: 'Annual Battle of the Bands',
    event_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'Cultural',
    venue: 'Open Amphitheater',
    max_capacity: 100,
    status: 'completed',
  },
  {
    id: 'e4d44444-4444-4444-4444-444444444444',
    event_name: 'National Level Debate Championship',
    event_date: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'Academic',
    venue: 'Conference Room C',
    max_capacity: 10,
    status: 'upcoming',
  },
  {
    id: 'e5e55555-5555-5555-5555-555555555555',
    event_name: 'Alumni Networking Dinner',
    event_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'Social',
    venue: 'Grand Dining Lounge',
    max_capacity: 50,
    status: 'completed',
  },
  {
    id: 'e6f66666-6666-6666-6666-666666666666',
    event_name: 'Creative Writing Workshop',
    event_date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'Arts',
    venue: 'Library Room 4',
    max_capacity: 2,
    status: 'upcoming',
  },
];

const defaultParticipants: Participant[] = [
  { id: 'p1111111-1111-1111-1111-111111111111', name: 'Aarav Mehta', department: 'Computer Science', email: 'aarav.mehta@college.edu' },
  { id: 'p2222222-2222-2222-2222-222222222222', name: 'Ananya Sharma', department: 'Computer Science', email: 'ananya.sharma@college.edu' },
  { id: 'p3333333-3333-3333-3333-333333333333', name: 'Kabir Malhotra', department: 'Electronics Engineering', email: 'kabir.malhotra@college.edu' },
  { id: 'p4444444-4444-4444-4444-444444444444', name: 'Diya Iyer', department: 'Electronics Engineering', email: 'diya.iyer@college.edu' },
  { id: 'p5555555-5555-5555-5555-555555555555', name: 'Rohan Das', department: 'Mechanical Engineering', email: 'rohan.das@college.edu' },
  { id: 'p6666666-6666-6666-6666-666666666666', name: 'Meera Nair', department: 'Mechanical Engineering', email: 'meera.nair@college.edu' },
  { id: 'p7777777-7777-7777-7777-777777777777', name: 'Aditya Verma', department: 'Business Administration', email: 'aditya.verma@college.edu' },
  { id: 'p8888888-8888-8888-8888-888888888888', name: 'Zara Khan', department: 'Business Administration', email: 'zara.khan@college.edu' },
  { id: 'p9999999-9999-9999-9999-999999999999', name: 'Vikram Sen', department: 'Information Technology', email: 'vikram.sen@college.edu' },
  { id: 'paaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', name: 'Priya Kapoor', department: 'Information Technology', email: 'priya.kapoor@college.edu' },
  { id: 'pbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', name: 'Rahul Joshi', department: 'Biotechnology', email: 'rahul.joshi@college.edu' },
  { id: 'pccccccc-cccc-cccc-cccc-cccccccccccc', name: 'Sneha Roy', department: 'Biotechnology', email: 'sneha.roy@college.edu' },
];

const defaultRegistrations: Registration[] = [
  // Hackathon (Capacity = 5): 5 confirmed, 2 waitlisted
  { id: 'r1', event_id: 'e1a11111-1111-1111-1111-111111111111', participant_id: 'p1111111-1111-1111-1111-111111111111', registration_date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), waitlist_position: null },
  { id: 'r2', event_id: 'e1a11111-1111-1111-1111-111111111111', participant_id: 'p2222222-2222-2222-2222-222222222222', registration_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), waitlist_position: null },
  { id: 'r3', event_id: 'e1a11111-1111-1111-1111-111111111111', participant_id: 'p3333333-3333-3333-3333-333333333333', registration_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), waitlist_position: null },
  { id: 'r4', event_id: 'e1a11111-1111-1111-1111-111111111111', participant_id: 'p4444444-4444-4444-4444-444444444444', registration_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), waitlist_position: null },
  { id: 'r5', event_id: 'e1a11111-1111-1111-1111-111111111111', participant_id: 'p5555555-5555-5555-5555-555555555555', registration_date: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), waitlist_position: null },
  { id: 'r6', event_id: 'e1a11111-1111-1111-1111-111111111111', participant_id: 'p6666666-6666-6666-6666-666666666666', registration_date: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), waitlist_position: 1 },
  { id: 'r7', event_id: 'e1a11111-1111-1111-1111-111111111111', participant_id: 'p7777777-7777-7777-7777-777777777777', registration_date: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), waitlist_position: 2 },

  // AI Symposium
  { id: 'r8', event_id: 'e2b22222-2222-2222-2222-222222222222', participant_id: 'p1111111-1111-1111-1111-111111111111', registration_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), waitlist_position: null },
  { id: 'r9', event_id: 'e2b22222-2222-2222-2222-222222222222', participant_id: 'p2222222-2222-2222-2222-222222222222', registration_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), waitlist_position: null },
  { id: 'r10', event_id: 'e2b22222-2222-2222-2222-222222222222', participant_id: 'p8888888-8888-8888-8888-888888888888', registration_date: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), waitlist_position: null },
  { id: 'r11', event_id: 'e2b22222-2222-2222-2222-222222222222', participant_id: 'p9999999-9999-9999-9999-999999999999', registration_date: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), waitlist_position: null },
  { id: 'r12', event_id: 'e2b22222-2222-2222-2222-222222222222', participant_id: 'paaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', registration_date: new Date().toISOString(), waitlist_position: null },

  // Battle of Bands
  { id: 'r13', event_id: 'e3c33333-3333-3333-3333-333333333333', participant_id: 'p2222222-2222-2222-2222-222222222222', registration_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), waitlist_position: null },
  { id: 'r14', event_id: 'e3c33333-3333-3333-3333-333333333333', participant_id: 'p3333333-3333-3333-3333-333333333333', registration_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), waitlist_position: null },
  { id: 'r15', event_id: 'e3c33333-3333-3333-3333-333333333333', participant_id: 'p5555555-5555-5555-5555-555555555555', registration_date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), waitlist_position: null },
  { id: 'r16', event_id: 'e3c33333-3333-3333-3333-333333333333', participant_id: 'p7777777-7777-7777-7777-777777777777', registration_date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), waitlist_position: null },
  { id: 'r17', event_id: 'e3c33333-3333-3333-3333-333333333333', participant_id: 'pbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', registration_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), waitlist_position: null },
  { id: 'r18', event_id: 'e3c33333-3333-3333-3333-333333333333', participant_id: 'pccccccc-cccc-cccc-cccc-cccccccccccc', registration_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), waitlist_position: null },

  // Alumni dinner
  { id: 'r19', event_id: 'e5e55555-5555-5555-5555-555555555555', participant_id: 'p1111111-1111-1111-1111-111111111111', registration_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), waitlist_position: null },
  { id: 'r20', event_id: 'e5e55555-5555-5555-5555-555555555555', participant_id: 'p4444444-4444-4444-4444-444444444444', registration_date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), waitlist_position: null },
  { id: 'r21', event_id: 'e5e55555-5555-5555-5555-555555555555', participant_id: 'p7777777-7777-7777-7777-777777777777', registration_date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), waitlist_position: null },
  { id: 'r22', event_id: 'e5e55555-5555-5555-5555-555555555555', participant_id: 'p8888888-8888-8888-8888-888888888888', registration_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), waitlist_position: null },

  // Creative writing (Capacity = 2): 2 confirmed, 1 waitlisted
  { id: 'r23', event_id: 'e6f66666-6666-6666-6666-666666666666', participant_id: 'paaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', registration_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), waitlist_position: null },
  { id: 'r24', event_id: 'e6f66666-6666-6666-6666-666666666666', participant_id: 'pbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', registration_date: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), waitlist_position: null },
  { id: 'r25', event_id: 'e6f66666-6666-6666-6666-666666666666', participant_id: 'pccccccc-cccc-cccc-cccc-cccccccccccc', registration_date: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), waitlist_position: 1 },
];

const defaultFeedback: Feedback[] = [
  { id: 'f1', event_id: 'e3c33333-3333-3333-3333-333333333333', participant_id: 'p2222222-2222-2222-2222-222222222222', rating: 5, comment: 'Absolutely spectacular! The bands were amazing and the lighting was top-tier.', submitted_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'f2', event_id: 'e3c33333-3333-3333-3333-333333333333', participant_id: 'p3333333-3333-3333-3333-333333333333', rating: 4, comment: 'Great vibe, though the sound system in the amphitheater had a few echoes.', submitted_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'f3', event_id: 'e3c33333-3333-3333-3333-333333333333', participant_id: 'p5555555-5555-5555-5555-555555555555', rating: 5, comment: 'Unbelievable energy! Best college fest event this year!', submitted_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'f4', event_id: 'e3c33333-3333-3333-3333-333333333333', participant_id: 'pbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', rating: 3, comment: 'The performances were good, but it went way past schedule and got very cold.', submitted_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'f5', event_id: 'e5e55555-5555-5555-5555-555555555555', participant_id: 'p1111111-1111-1111-1111-111111111111', rating: 4, comment: 'A wonderful evening networking with seniors. Extremely helpful for job search tips!', submitted_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'f6', event_id: 'e5e55555-5555-5555-5555-555555555555', participant_id: 'p8888888-8888-8888-8888-888888888888', rating: 5, comment: 'Elegant venue, delicious food, and great conversations. Will attend again next year.', submitted_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() },
];

const defaultActivities: LiveActivity[] = [
  { id: 'act1', type: 'event_created', message: 'Event "Inter-College Hackathon 2026" created.', timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'act2', type: 'registration', message: 'Aarav Mehta registered for Inter-College Hackathon 2026.', timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'act3', type: 'registration', message: 'Meera Nair waitlisted (#1) for Inter-College Hackathon 2026.', timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString() },
  { id: 'act4', type: 'feedback', message: 'Ananya Sharma submitted 5★ feedback for Annual Battle of the Bands.', timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString() },
];

export class MockDatabase {
  private static load<T>(key: string, defaults: T[]): T[] {
    const data = localStorage.getItem(`eventpulse_mock_${key}`);
    if (!data) {
      localStorage.setItem(`eventpulse_mock_${key}`, JSON.stringify(defaults));
      return defaults;
    }
    return JSON.parse(data);
  }

  private static save<T>(key: string, data: T[]) {
    localStorage.setItem(`eventpulse_mock_${key}`, JSON.stringify(data));
    // Dispatch custom event to notify listeners of changes (replicates realtime subscriptions)
    window.dispatchEvent(new CustomEvent('eventpulse_db_change', { detail: { table: key } }));
  }

  // Auto update event statuses based on current time (upcoming -> ongoing -> completed)
  private static runStatusUpdates(events: Event[]): { updated: boolean; events: Event[] } {
    let updated = false;
    const now = Date.now();
    const fourHoursMs = 4 * 60 * 60 * 1000;

    const newEvents = events.map(event => {
      const eventTime = new Date(event.event_date).getTime();
      let newStatus = event.status;

      if (event.status !== 'cancelled') {
        if (now >= eventTime && now < eventTime + fourHoursMs && event.status === 'upcoming') {
          newStatus = 'ongoing';
          updated = true;
          this.logActivity('event_status', `Event "${event.event_name}" is now ONGOING.`);
        } else if (now >= eventTime + fourHoursMs && (event.status === 'upcoming' || event.status === 'ongoing')) {
          newStatus = 'completed';
          updated = true;
          this.logActivity('event_status', `Event "${event.event_name}" is now COMPLETED.`);
        }
      }

      if (newStatus !== event.status) {
        return { ...event, status: newStatus as any };
      }
      return event;
    });

    return { updated, events: newEvents };
  }

  // --- Logger ---
  public static logActivity(type: LiveActivity['type'], message: string) {
    const activities = this.load<LiveActivity>('activities', defaultActivities);
    const newAct: LiveActivity = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      message,
      timestamp: new Date().toISOString(),
    };
    activities.unshift(newAct); // Put newest first
    this.save('activities', activities.slice(0, 50)); // Keep last 50
  }

  public static getActivities(): LiveActivity[] {
    return this.load<LiveActivity>('activities', defaultActivities);
  }

  public static clearActivities() {
    this.save('activities', []);
  }

  // --- Reset database to default seed state ---
  public static resetDatabase() {
    localStorage.removeItem('eventpulse_mock_events');
    localStorage.removeItem('eventpulse_mock_participants');
    localStorage.removeItem('eventpulse_mock_registrations');
    localStorage.removeItem('eventpulse_mock_feedback');
    localStorage.removeItem('eventpulse_mock_activities');
    this.getEvents();
    this.getParticipants();
    this.getRegistrations();
    this.getFeedback();
    this.save('activities', defaultActivities);
  }

  // --- Events CRUD ---
  public static getEvents(): Event[] {
    const rawEvents = this.load<Event>('events', defaultEvents);
    const check = this.runStatusUpdates(rawEvents);
    if (check.updated) {
      this.save('events', check.events);
    }
    return check.events;
  }

  public static saveEvent(event: Omit<Event, 'id'> & { id?: string }): Event {
    const events = this.getEvents();
    let savedEvent: Event;

    if (event.id) {
      // Edit
      const oldEvent = events.find(e => e.id === event.id);
      const isCapacityIncrease = oldEvent && event.max_capacity > oldEvent.max_capacity;

      events.forEach((e, idx) => {
        if (e.id === event.id) {
          events[idx] = { ...e, ...event } as Event;
        }
      });
      savedEvent = events.find(e => e.id === event.id)!;
      this.save('events', events);
      this.logActivity('event_created', `Event "${event.event_name}" details updated.`);

      // PostgreSQL Trigger Replication: Auto Promotion when capacity increases
      if (isCapacityIncrease && oldEvent) {
        this.handleCapacityIncrease(event.id, oldEvent.max_capacity, event.max_capacity);
      }
    } else {
      // Create
      savedEvent = {
        ...event,
        id: Math.random().toString(36).substring(2, 9) + '-' + Math.random().toString(36).substring(2, 9),
      } as Event;
      events.push(savedEvent);
      this.save('events', events);
      this.logActivity('event_created', `New event "${event.event_name}" created at ${event.venue}.`);
    }

    return savedEvent;
  }

  public static deleteEvent(id: string) {
    const events = this.getEvents();
    const event = events.find(e => e.id === id);
    const filtered = events.filter(e => e.id !== id);
    this.save('events', filtered);

    // Cascading deletes replication
    const regs = this.getRegistrations();
    this.save('registrations', regs.filter(r => r.event_id !== id));
    
    const feeds = this.getFeedback();
    this.save('feedback', feeds.filter(f => f.event_id !== id));

    if (event) {
      this.logActivity('event_created', `Event "${event.event_name}" was deleted.`);
    }
  }

  // --- Participants CRUD ---
  public static getParticipants(): Participant[] {
    return this.load<Participant>('participants', defaultParticipants);
  }

  public static saveParticipant(participant: Omit<Participant, 'id'> & { id?: string }): Participant {
    const participants = this.getParticipants();
    let saved: Participant;

    if (participant.id) {
      participants.forEach((p, idx) => {
        if (p.id === participant.id) {
          participants[idx] = { ...p, ...participant } as Participant;
        }
      });
      saved = participants.find(p => p.id === participant.id)!;
      this.save('participants', participants);
    } else {
      saved = {
        ...participant,
        id: 'p-' + Math.random().toString(36).substring(2, 9),
      };
      participants.push(saved);
      this.save('participants', participants);
      this.logActivity('registration', `New participant "${participant.name}" added to system.`);
    }
    return saved;
  }

  public static deleteParticipant(id: string) {
    const participants = this.getParticipants();
    const participant = participants.find(p => p.id === id);
    this.save('participants', participants.filter(p => p.id !== id));

    // Cascading deletes replication on registrations
    const regs = this.getRegistrations();
    const affectedRegs = regs.filter(r => r.participant_id === id);
    
    // Deleting registrations triggers promotion logic sequentially
    affectedRegs.forEach(reg => {
      this.deleteRegistration(reg.id);
    });

    if (participant) {
      this.logActivity('registration', `Participant "${participant.name}" profile deleted.`);
    }
  }

  // --- Registrations Operations (Waitlist Triggers) ---
  public static getRegistrations(): Registration[] {
    return this.load<Registration>('registrations', defaultRegistrations);
  }

  // Replicates trg_registration_waitlist BEFORE INSERT
  public static addRegistration(event_id: string, participant_id: string): Registration {
    const regs = this.getRegistrations();
    const events = this.getEvents();
    const participants = this.getParticipants();

    // 1. Block duplicate registrations
    const exists = regs.find(r => r.event_id === event_id && r.participant_id === participant_id);
    if (exists) {
      throw new Error('Participant is already registered for this event.');
    }

    const event = events.find(e => e.id === event_id);
    const participant = participants.find(p => p.id === participant_id);

    if (!event || !participant) {
      throw new Error('Event or Participant not found.');
    }

    // 2. Count current confirmed registrations for this event
    const confirmedCount = regs.filter(r => r.event_id === event_id && r.waitlist_position === null).length;

    let waitlist_pos: number | null = null;
    let message = '';

    if (confirmedCount < event.max_capacity) {
      waitlist_pos = null;
      message = `${participant.name} successfully registered for "${event.event_name}".`;
      this.logActivity('registration', message);
    } else {
      // Event is full! Assign waitlist position
      const waitlistCount = regs.filter(r => r.event_id === event_id && r.waitlist_position !== null).length;
      waitlist_pos = waitlistCount + 1;
      message = `Event capacity full. ${participant.name} added to Waitlist (#${waitlist_pos}) for "${event.event_name}".`;
      this.logActivity('registration', message);
    }

    const newReg: Registration = {
      id: 'r-' + Math.random().toString(36).substring(2, 9),
      event_id,
      participant_id,
      registration_date: new Date().toISOString(),
      waitlist_position: waitlist_pos,
    };

    regs.push(newReg);
    this.save('registrations', regs);

    return newReg;
  }

  // Replicates trg_registration_deletion AFTER DELETE
  public static deleteRegistration(id: string) {
    const regs = this.getRegistrations();
    const regToDelete = regs.find(r => r.id === id);
    if (!regToDelete) return;

    const events = this.getEvents();
    const participants = this.getParticipants();
    const event = events.find(e => e.id === regToDelete.event_id);
    const participant = participants.find(p => p.id === regToDelete.participant_id);

    // Filter out the deleted registration
    const updatedRegs = regs.filter(r => r.id !== id);
    this.save('registrations', updatedRegs);

    if (regToDelete.waitlist_position === null) {
      // 1. A CONFIRMED registration was deleted. Look for waitlist position 1.
      const eventRegs = updatedRegs.filter(r => r.event_id === regToDelete.event_id);
      const nextInLine = eventRegs.find(r => r.waitlist_position === 1);

      if (nextInLine) {
        // Promote them! Set waitlist_position to null
        updatedRegs.forEach((r, idx) => {
          if (r.id === nextInLine.id) {
            updatedRegs[idx].waitlist_position = null;
          }
        });

        // Shift all other waitlisted candidates down by 1 position
        updatedRegs.forEach((r, idx) => {
          if (r.event_id === regToDelete.event_id && r.waitlist_position !== null && r.waitlist_position > 1) {
            updatedRegs[idx].waitlist_position = r.waitlist_position! - 1;
          }
        });

        const promotedParticipant = participants.find(p => p.id === nextInLine.participant_id);
        const eventName = event ? event.event_name : 'the event';
        this.logActivity('waitlist_promote', `Slot freed. Waitlisted participant "${promotedParticipant?.name || 'Unknown'}" promoted to CONFIRMED for "${eventName}".`);
      }
      
      const pName = participant ? participant.name : 'Participant';
      this.logActivity('registration', `Registration for ${pName} cancelled.`);
    } else {
      // 2. A WAITLISTED registration was deleted. Shift all subsequent waitlisted candidates down.
      updatedRegs.forEach((r, idx) => {
        if (
          r.event_id === regToDelete.event_id && 
          r.waitlist_position !== null && 
          r.waitlist_position > regToDelete.waitlist_position!
        ) {
          updatedRegs[idx].waitlist_position = r.waitlist_position! - 1;
        }
      });
      
      const pName = participant ? participant.name : 'Participant';
      this.logActivity('registration', `Waitlisted spot for ${pName} removed.`);
    }

    this.save('registrations', updatedRegs);
  }

  // Replicates trg_event_capacity_increase AFTER UPDATE
  private static handleCapacityIncrease(event_id: string, oldCapacity: number, newCapacity: number) {
    const regs = this.getRegistrations();
    const participants = this.getParticipants();
    const events = this.getEvents();
    const event = events.find(e => e.id === event_id);

    const capacityDiff = newCapacity - oldCapacity;
    if (capacityDiff <= 0) return;

    // Get all waitlisted items for this event, ordered by waitlist_position
    const waitlisted = regs
      .filter(r => r.event_id === event_id && r.waitlist_position !== null)
      .sort((a, b) => a.waitlist_position! - b.waitlist_position!);

    if (waitlisted.length === 0) return;

    // Promote waitlisted registrations up to capacity difference
    const idsToPromote = waitlisted.slice(0, capacityDiff).map(r => r.id);

    regs.forEach((r, idx) => {
      if (idsToPromote.includes(r.id)) {
        regs[idx].waitlist_position = null;
        const p = participants.find(part => part.id === r.participant_id);
        this.logActivity('waitlist_promote', `Capacity increased. ${p?.name || 'Waitlisted participant'} promoted to CONFIRMED for "${event?.event_name}".`);
      }
    });

    // Recalculate remaining waitlist positions
    const remainingWaitlisted = regs
      .filter(r => r.event_id === event_id && r.waitlist_position !== null)
      .sort((a, b) => a.waitlist_position! - b.waitlist_position!);

    remainingWaitlisted.forEach((r, index) => {
      regs.forEach((originalReg, idx) => {
        if (originalReg.id === r.id) {
          regs[idx].waitlist_position = index + 1;
        }
      });
    });

    this.save('registrations', regs);
  }

  // --- Feedback Module ---
  public static getFeedback(): Feedback[] {
    return this.load<Feedback>('feedback', defaultFeedback);
  }

  public static addFeedback(event_id: string, participant_id: string, rating: number, comment: string): Feedback {
    const feeds = this.getFeedback();
    const regs = this.getRegistrations();
    const participants = this.getParticipants();
    const events = this.getEvents();

    const event = events.find(e => e.id === event_id);
    const participant = participants.find(p => p.id === participant_id);

    if (!event || !participant) {
      throw new Error('Event or Participant not found.');
    }

    // 1. Only registered participants can submit
    const isRegistered = regs.find(r => r.event_id === event_id && r.participant_id === participant_id);
    if (!isRegistered) {
      throw new Error('Only registered participants of this event can submit feedback.');
    }

    // 2. Block duplicate feedback
    const exists = feeds.find(f => f.event_id === event_id && f.participant_id === participant_id);
    if (exists) {
      throw new Error('You have already submitted feedback for this event.');
    }

    const newFeed: Feedback = {
      id: 'f-' + Math.random().toString(36).substring(2, 9),
      event_id,
      participant_id,
      rating,
      comment,
      submitted_at: new Date().toISOString(),
    };

    feeds.push(newFeed);
    this.save('feedback', feeds);
    this.logActivity('feedback', `${participant.name} submitted a ${rating}★ feedback rating for "${event.event_name}".`);

    return newFeed;
  }
}
