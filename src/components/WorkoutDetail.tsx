import  { ArrowLeft } from 'lucide-react';
import { Workout } from '../types';
import ExerciseList from './ExerciseList';

interface WorkoutDetailProps {
  workout: Workout;
  onBack: () => void;
}

export default function WorkoutDetail({ workout, onBack }: WorkoutDetailProps) {
  // Calculate workout stats
  const strengthExercises = workout.exercises.filter(ex => ex.type === 'strength');
  const cardioExercises = workout.exercises.filter(ex => ex.type === 'cardio');
  
  const totalSets = strengthExercises.reduce((total, ex) => total + (ex.sets?.length || 0), 0);
  
  const totalCardioMinutes = cardioExercises.reduce((total, ex) => {
    return total + (ex.cardio?.duration ? parseInt(ex.cardio.duration) : 0);
  }, 0);
  
  const totalCardioDistance = cardioExercises.reduce((total, ex) => {
    return total + (ex.cardio?.distance ? parseFloat(ex.cardio.distance) : 0);
  }, 0);

  return (
    <div className="card">
      <div className="flex items-center mb-4">
        <button 
          onClick={onBack}
          className="mr-2 text-gray-500 hover:text-gray-700"
          aria-label="Go back"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-lg font-semibold">{workout.name}</h2>
      </div>
      
      <div className="text-sm text-gray-500 mb-4">
        Date: {workout.date}
      </div>
      
      {/* Workout Summary */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 p-3 rounded-md">
          <h4 className="text-sm font-medium text-blue-700">Strength Training</h4>
          <p className="text-2xl font-bold text-blue-800">{strengthExercises.length}</p>
          <p className="text-sm text-blue-600">Exercises</p>
          <p className="text-sm text-blue-600 mt-1">{totalSets} Total Sets</p>
        </div>
        <div className="bg-green-50 p-3 rounded-md">
          <h4 className="text-sm font-medium text-green-700">Cardio</h4>
          <p className="text-2xl font-bold text-green-800">{cardioExercises.length}</p>
          <p className="text-sm text-green-600">Exercises</p>
          <p className="text-sm text-green-600 mt-1">
            {totalCardioMinutes > 0 ? `${totalCardioMinutes} min` : 'No time recorded'}
          </p>
          <p className="text-sm text-green-600">
            {totalCardioDistance > 0 ? `${totalCardioDistance.toFixed(1)} mi/km` : 'No distance recorded'}
          </p>
        </div>
      </div>
      
      <div className="mt-4">
        <h3 className="text-md font-medium mb-3">Exercises</h3>
        <ExerciseList 
          exercises={workout.exercises} 
          onRemoveExercise={() => {}} // View-only, no removal
        />
      </div>
      
      {cardioExercises.length > 0 && (
        <div className="mt-6 border-t pt-4">
          <img 
            src="https://images.unsplash.com/photo-1489659831163-682b5af42225?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHw0fHxmaXRuZXNzJTIwY2FyZGlvJTIwd29ya291dCUyMHJ1bm5pbmclMjBleGVyY2lzZSUyMHRyYWNraW5nfGVufDB8fHx8MTc0NDk3MjcwM3ww&ixlib=rb-4.0.3&fit=fillmax&h=600&w=800" 
            alt="Running workout" 
            className="w-full h-32 object-cover rounded-md"
          />
        </div>
      )}
    </div>
  );
}
 