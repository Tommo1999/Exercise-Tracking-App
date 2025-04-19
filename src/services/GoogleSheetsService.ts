import  { Workout } from '../types';

class GoogleSheetsService {
  // Get workouts for the currently logged in user
  async getWorkouts(): Promise<Workout[]> {
    try {
      // In a real app, we would fetch from the user's specific data
      // For demonstration, we're using mock data
      const userId = this.getCurrentUserId();
      console.log(`Fetching workouts for user ${userId}`);
      
      // Mock data for demonstration
      return this.getMockWorkoutsForUser();
    } catch (error) {
      console.error('Error fetching workouts:', error);
      return [];
    }
  }

  async saveWorkout(workout: Workout): Promise<boolean> {
    try {
      // In production, save workout to user's specific data
      const userId = this.getCurrentUserId();
      console.log(`Saving workout for user ${userId}:`, workout);
      
      // In a real app, we would call our API with the userId
      return true;
    } catch (error) {
      console.error('Error saving workout:', error);
      return false;
    }
  }

  async deleteWorkout(workoutId: string): Promise<boolean> {
    try {
      const userId = this.getCurrentUserId();
      console.log(`Deleting workout ${workoutId} for user ${userId}`);
      
      return true;
    } catch (error) {
      console.error('Error deleting workout:', error);
      return false;
    }
  }

  // Helper to get current user ID from localStorage
  private getCurrentUserId(): string | null {
    try {
      const userString = localStorage.getItem('fittrack_user');
      if (userString) {
        const user = JSON.parse(userString);
        return user.id;
      }
      return null;
    } catch {
      return null;
    }
  }

  // Mock data for development
  private getMockWorkoutsForUser(): Workout[] {
    const userId = this.getCurrentUserId();
    
    // For demo user 1, show some sample workouts
    if (userId === '1') {
      return [
        {
          id: '1',
          date: '2023-06-10',
          name: 'Upper Body Strength',
          exercises: [
            {
              id: '101',
              name: 'Bench Press',
              description: 'Barbell bench press with proper form',
              sets: [
                { id: '1', weight: '135', reps: '12' },
                { id: '2', weight: '155', reps: '10' },
                { id: '3', weight: '175', reps: '8' },
                { id: '4', weight: '185', reps: '6' },
                { id: '5', weight: '155', reps: '10' }
              ]
            },
            {
              id: '102',
              name: 'Shoulder Press',
              description: 'Dumbbell shoulder press',
              sets: [
                { id: '1', weight: '35', reps: '12' },
                { id: '2', weight: '40', reps: '10' },
                { id: '3', weight: '45', reps: '8' },
                { id: '4', weight: '45', reps: '8' },
                { id: '5', weight: '40', reps: '10' }
              ]
            }
          ]
        },
        {
          id: '2',
          date: '2023-06-12',
          name: 'Leg Day',
          exercises: [
            {
              id: '201',
              name: 'Squat',
              description: 'Barbell back squat',
              sets: [
                { id: '1', weight: '185', reps: '12' },
                { id: '2', weight: '205', reps: '10' },
                { id: '3', weight: '225', reps: '8' },
                { id: '4', weight: '245', reps: '6' },
                { id: '5', weight: '205', reps: '10' }
              ]
            }
          ]
        }
      ];
    } 
    // For admin user, show different workouts
    else if (userId === '2') {
      return [
        {
          id: '3',
          date: '2023-06-15',
          name: 'Full Body Workout',
          exercises: [
            {
              id: '301',
              name: 'Deadlift',
              description: 'Conventional deadlift',
              sets: [
                { id: '1', weight: '225', reps: '8' },
                { id: '2', weight: '275', reps: '6' },
                { id: '3', weight: '315', reps: '4' },
                { id: '4', weight: '315', reps: '4' },
                { id: '5', weight: '275', reps: '6' }
              ]
            },
            {
              id: '302',
              name: 'Pull-ups',
              description: 'Bodyweight pull-ups',
              sets: [
                { id: '1', weight: 'BW', reps: '10' },
                { id: '2', weight: 'BW', reps: '8' },
                { id: '3', weight: 'BW', reps: '8' },
                { id: '4', weight: 'BW', reps: '7' },
                { id: '5', weight: 'BW', reps: '6' }
              ]
            }
          ]
        }
      ];
    }
    // For new users, show empty workouts
    return [];
  }
}

export default new GoogleSheetsService();
 