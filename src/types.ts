export interface Event {
  id: string;
  event_name: string;
  event_date: string;
  category: string;
  venue: string;
  max_capacity: number;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
}

export interface Participant {
  id: string;
  name: string;
  department: string;
  email: string;
}

export interface Registration {
  id: string;
  event_id: string;
  participant_id: string;
  registration_date: string;
  waitlist_position: number | null;
}

export interface Feedback {
  id: string;
  event_id: string;
  participant_id: string;
  rating: number;
  comment: string;
  submitted_at: string;
}

// Joined types for tables with foreign keys
export interface RegistrationWithDetails extends Registration {
  event: Event;
  participant: Participant;
}

export interface FeedbackWithDetails extends Feedback {
  event: Event;
  participant: Participant;
}

// Analytics and Dashboard Types
export interface DashboardStats {
  totalRegistrations: number;
  activeEvents: number;
  totalParticipants: number;
  waitlistCount: number;
  avgFeedbackRating: number;
}

export interface DepartmentParticipation {
  department: string;
  count: number;
}

export interface EventTurnout {
  name: string;
  registered: number;
  capacity: number;
  waitlisted: number;
}

export interface RegistrationTrend {
  date: string;
  count: number;
}

export interface LiveActivity {
  id: string;
  type: 'registration' | 'feedback' | 'event_created' | 'event_status' | 'waitlist_promote';
  message: string;
  timestamp: string;
}
