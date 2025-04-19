import  { Workout } from '../types';

class WorkoutStorage {
  // Get the current user ID
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

  // Get all workouts for the current user
  async getWorkouts(): Promise<Workout[]> {
    try {
      const userId = this.getCurrentUserId();
      if (!userId) return [];
      
      const storageKey = `fittrack_workouts_${userId}`;
      const workoutsStr = localStorage.getItem(storageKey);
      
      if (!workoutsStr) return [];
      
      return JSON.parse(workoutsStr);
    } catch (error) {
      console.error('Error getting workouts:', error);
      return [];
    }
  }

  // Save a workout
  async saveWorkout(workout: Workout): Promise<boolean> {
    try {
      const userId = this.getCurrentUserId();
      if (!userId) return false;
      
      const storageKey = `fittrack_workouts_${userId}`;
      
      // Get existing workouts
      const existingWorkoutsStr = localStorage.getItem(storageKey);
      const workouts = existingWorkoutsStr ? JSON.parse(existingWorkoutsStr) : [];
      
      // Check if workout already exists
      const index = workouts.findIndex((w: Workout) => w.id === workout.id);
      if (index !== -1) {
        // Update existing workout
        workouts[index] = workout;
      } else {
        // Add new workout
        workouts.push(workout);
      }
      
      // Save updated workouts
      localStorage.setItem(storageKey, JSON.stringify(workouts));
      return true;
    } catch (error) {
      console.error('Error saving workout:', error);
      return false;
    }
  }

  // Delete a workout
  async deleteWorkout(workoutId: string): Promise<boolean> {
    try {
      const userId = this.getCurrentUserId();
      if (!userId) return false;
      
      const storageKey = `fittrack_workouts_${userId}`;
      
      // Get existing workouts
      const existingWorkoutsStr = localStorage.getItem(storageKey);
      if (!existingWorkoutsStr) return true; // Nothing to delete
      
      const workouts = JSON.parse(existingWorkoutsStr);
      
      // Filter out the workout to delete
      const updatedWorkouts = workouts.filter((w: Workout) => w.id !== workoutId);
      
      // Save updated workouts
      localStorage.setItem(storageKey, JSON.stringify(updatedWorkouts));
      return true;
    } catch (error) {
      console.error('Error deleting workout:', error);
      return false;
    }
  }

  // Export workouts as JSON file
  async exportWorkoutsAsJSON(): Promise<string | null> {
    try {
      const workouts = await this.getWorkouts();
      
      if (workouts.length === 0) {
        return null;
      }
      
      return JSON.stringify(workouts, null, 2);
    } catch (error) {
      console.error('Error exporting workouts:', error);
      return null;
    }
  }

  // Export workouts as CSV
  async exportWorkoutsAsCSV(): Promise<string | null> {
    try {
      const workouts = await this.getWorkouts();
      
      if (workouts.length === 0) {
        return null;
      }
      
      // Define CSV headers for both strength and cardio
      const headers = [
        'Workout ID', 'Date', 'Workout Name', 
        'Exercise', 'Exercise Type', 'Description',
        // Strength fields
        'Set', 'Weight', 'Reps',
        // Cardio fields
        'Duration (min)', 'Distance', 'Intensity', 'Calories Burned'
      ];
      
      const rows = [headers];
      
      // Convert workouts to CSV rows
      workouts.forEach(workout => {
        workout.exercises.forEach(exercise => {
          if (exercise.type === 'strength' && exercise.sets) {
            // For strength exercises, add each set as a row
            exercise.sets.forEach((set, index) => {
              rows.push([
                workout.id,
                workout.date,
                workout.name,
                exercise.name,
                'Strength',
                exercise.description || '',
                (index + 1).toString(),
                set.weight || '',
                set.reps || '',
                '', '', '', '' // Empty cardio fields
              ]);
            });
          } else if (exercise.type === 'cardio' && exercise.cardio) {
            // For cardio exercises, add a single row
            rows.push([
              workout.id,
              workout.date,
              workout.name,
              exercise.name,
              'Cardio',
              exercise.description || '',
              '', '', '', // Empty strength fields
              exercise.cardio.duration || '',
              exercise.cardio.distance || '',
              exercise.cardio.intensity || '',
              exercise.cardio.caloriesBurned || ''
            ]);
          }
        });
      });
      
      // Convert rows to CSV string
      const csvContent = rows
        .map(row => row.map(cell => `"${cell ? cell.replace(/"/g, '""') : ''}"`).join(','))
        .join('\n');
        
      return csvContent;
    } catch (error) {
      console.error('Error exporting workouts as CSV:', error);
      return null;
    }
  }

  // Import workouts from JSON
  async importWorkoutsFromJSON(jsonString: string): Promise<boolean> {
    try {
      const userId = this.getCurrentUserId();
      if (!userId) return false;
      
      const storageKey = `fittrack_workouts_${userId}`;
      
      // Parse the JSON
      const workouts = JSON.parse(jsonString);
      
      // Validate the data structure
      if (!Array.isArray(workouts)) {
        throw new Error('Invalid data format');
      }
      
      // Basic validation of each workout
      workouts.forEach((workout: any) => {
        if (!workout.id || !workout.date || !workout.name || !Array.isArray(workout.exercises)) {
          throw new Error('Invalid workout data');
        }
        
        // Ensure exercise type is set if missing
        workout.exercises.forEach((exercise: any) => {
          if (!exercise.type) {
            // Determine type based on presence of sets or cardio properties
            if (Array.isArray(exercise.sets)) {
              exercise.type = 'strength';
            } else if (exercise.cardio) {
              exercise.type = 'cardio';
            } else {
              // Default to strength if can't determine
              exercise.type = 'strength';
              exercise.sets = exercise.sets || [];
            }
          }
        });
      });
      
      // Save the workouts
      localStorage.setItem(storageKey, jsonString);
      return true;
    } catch (error) {
      console.error('Error importing workouts:', error);
      return false;
    }
  }
}

export default new WorkoutStorage();
 