import  { useState } from 'react';
import { Calendar, Trash } from 'lucide-react';
import { Workout } from '../types';

interface WorkoutListProps {
  workouts: Workout[];
  onSelectWorkout: (workout: Workout) => void;
  onDeleteWorkout: (workoutId: string) => void;
}

export default function WorkoutList({ workouts, onSelectWorkout, onDeleteWorkout }: WorkoutListProps) {
  const [filter, setFilter] = useState('');
  
  const filteredWorkouts = workouts.filter(workout => 
    workout.name.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Your Workouts</h2>
        <input
          type="text"
          placeholder="Filter workouts..."
          className="input max-w-xs"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>
      
      {filteredWorkouts.length === 0 ? (
        <p className="text-gray-500 text-center py-4">No workouts found. Create your first workout!</p>
      ) : (
        <ul className="space-y-2">
          {filteredWorkouts.map(workout => (
            <li key={workout.id} className="border rounded-md p-3 hover:bg-gray-50">
              <div className="flex justify-between items-center">
                <div 
                  className="flex-1 cursor-pointer"
                  onClick={() => onSelectWorkout(workout)}
                >
                  <h3 className="font-medium">{workout.name}</h3>
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar size={14} className="mr-1" />
                    {workout.date}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {workout.exercises.length} exercise{workout.exercises.length !== 1 ? 's' : ''}
                  </div>
                </div>
                <button 
                  className="text-gray-400 hover:text-red-500"
                  onClick={() => onDeleteWorkout(workout.id)}
                  aria-label="Delete workout"
                >
                  <Trash size={18} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
 