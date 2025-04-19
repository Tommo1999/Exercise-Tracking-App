export  interface Set {
  id: string;
  weight: string;
  reps: string;
}

export interface CardioEntry {
  id: string;
  duration: string;  // In minutes
  distance: string;  // In miles/km
  intensity: string; // Low, Medium, High
  caloriesBurned?: string;
}

export interface Exercise {
  id: string;
  name: string;
  description: string;
  type: 'strength' | 'cardio';
  sets?: Set[];
  cardio?: CardioEntry;
}

export interface Workout {
  id: string;
  date: string;
  name: string;
  exercises: Exercise[];
}

export interface User {
  id: string;
  email: string;
  name: string;
  workouts?: string[]; // IDs of user workouts
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
}
 