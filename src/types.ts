export type TaskStatus = 'posted' | 'matched' | 'in-progress' | 'completed' | 'paid';
export type PaymentStatus = 'Held' | 'Released';
export type Category = 'Home Service' | 'Labor/Delivery' | 'Errand' | 'Freelance/Other';
export type Urgency = 'Instant' | 'Within a few hours';

export interface WorkerProfile {
  id: string;
  name: string;
  rating: number;
  distance: string;
  hourlyRate: number;
  completedJobs: number;
  avatarUrl: string;
}

export interface Task {
  id: string;
  title: string;
  category: Category;
  description: string;
  location: string;
  coords?: { lat: number, lng: number };
  distance: number;
  budget: number;
  urgency: Urgency;
  status: TaskStatus;
  paymentStatus?: PaymentStatus;
  paymentId?: string;
  worker?: WorkerProfile;
}

export type Role = 'customer' | 'worker';
export type Tab = 'home' | 'jobs' | 'profile';
