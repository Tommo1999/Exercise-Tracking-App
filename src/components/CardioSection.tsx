import  { useState } from 'react';
import { Activity, Plus } from 'lucide-react';
import { Workout } from '../types';
import ExerciseForm from './ExerciseForm';

interface CardioSectionProps {
  workouts: Workout[];
}

export default function CardioSection({ workouts }: CardioSectionProps) {
  const [showCardioForm, setShowCardioForm] = useState(false);
  
  // Get all cardio exercises from all workouts
  const cardioExercises = workouts.flatMap(workout => 
    workout.exercises
      .filter(ex => ex.type === 'cardio' && ex.cardio)
      .map(ex => ({
        ...ex,
        workoutDate: workout.date,
        workoutName: workout.name
      }))
  );

  // Calculate total stats
  const totalCardioSessions = cardioExercises.length;
  
  const totalDuration = cardioExercises.reduce((total, ex) => 
    total + (ex.cardio?.duration ? parseInt(ex.cardio.duration) : 0), 0);
  
  const totalDistance = cardioExercises.reduce((total, ex) => 
    total + (ex.cardio?.distance ? parseFloat(ex.cardio.distance) : 0), 0);
  
  const totalCalories = cardioExercises.reduce((total, ex) => 
    total + (ex.cardio?.caloriesBurned ? parseInt(ex.cardio.caloriesBurned) : 0), 0);

  // Just for display - this doesn't actually add the cardio exercise to a workout
  // This is a demo of how the form will look when adding cardio
  const handleCloseCardioForm = () => {
    setShowCardioForm(false);
  };

  const handleAddCardioDemo = () => {
    // This would normally add a cardio exercise to a workout
    // But this is just a demo view to show the user needs to create a workout first
    alert('To save a cardio exercise, first create a new workout and then add cardio to it.');
    setShowCardioForm(false);
  };
  
  // No cardio data
  if (cardioExercises.length === 0) {
    return (
      <div className="mt-6 card">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Cardio Tracking</h3>
          <button
            onClick={() => setShowCardioForm(true)}
            className="btn bg-green-600 hover:bg-green-700 text-white flex items-center"
          >
            <Plus size={18} className="mr-1" />
            Add Cardio
          </button>
        </div>
        
        {showCardioForm ? (
          <ExerciseForm 
            onAddExercise={handleAddCardioDemo} 
            onCancel={handleCloseCardioForm}
            defaultType="cardio"
          />
        ) : (
          <>
            <div className="flex items-center justify-center flex-col p-8">
              <Activity size={48} className="text-gray-300 mb-4" />
              <p className="text-gray-500 text-center">
                No cardio workouts recorded yet. Add a cardio exercise to see your stats here.
              </p>
            </div>
            <img 
              src="https://images.unsplash.com/photo-1620213391117-0d169a917221?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHwxfHxmaXRuZXNzJTIwY2FyZGlvJTIwd29ya291dCUyMHJ1bm5pbmclMjBleGVyY2lzZSUyMHRyYWNraW5nfGVufDB8fHx8MTc0NDk3MjcwM3ww&ixlib=rb-4.0.3&fit=fillmax&h=600&w=800" 
              alt="Running workout" 
              className="w-full h-32 object-cover rounded-md mt-4"
            />
          </>
        )}
      </div>
    );
  }

  return (
    <div className="mt-6 card">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Cardio Stats</h3>
        <button
          onClick={() => setShowCardioForm(true)}
          className="btn bg-green-600 hover:bg-green-700 text-white flex items-center"
        >
          <Plus size={18} className="mr-1" />
          Add Cardio
        </button>
      </div>
      
      {showCardioForm ? (
        <ExerciseForm 
          onAddExercise={handleAddCardioDemo} 
          onCancel={handleCloseCardioForm}
          defaultType="cardio"
        />
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-green-50 p-3 rounded-md">
              <h4 className="text-xs font-medium text-green-700">Sessions</h4>
              <p className="text-2xl font-bold text-green-800">{totalCardioSessions}</p>
            </div>
            <div className="bg-green-50 p-3 rounded-md">
              <h4 className="text-xs font-medium text-green-700">Duration</h4>
              <p className="text-2xl font-bold text-green-800">{totalDuration} min</p>
            </div>
            <div className="bg-green-50 p-3 rounded-md">
              <h4 className="text-xs font-medium text-green-700">Distance</h4>
              <p className="text-2xl font-bold text-green-800">{totalDistance.toFixed(1)}</p>
              <p className="text-xs text-green-700">miles/km</p>
            </div>
            <div className="bg-green-50 p-3 rounded-md">
              <h4 className="text-xs font-medium text-green-700">Calories</h4>
              <p className="text-2xl font-bold text-green-800">
                {totalCalories > 0 ? totalCalories : '-'}
              </p>
              {totalCalories > 0 && <p className="text-xs text-green-700">kcal</p>}
            </div>
          </div>
          
          <h4 className="font-medium text-sm mb-2">Recent Cardio Workouts</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Date</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Type</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Duration</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Distance</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Intensity</th>
                </tr>
              </thead>
              <tbody>
                {cardioExercises.slice(0, 5).map(exercise => (
                  <tr key={exercise.id} className="border-t">
                    <td className="px-4 py-2 text-gray-800">{exercise.workoutDate}</td>
                    <td className="px-4 py-2 text-gray-800">{exercise.name}</td>
                    <td className="px-4 py-2 text-gray-800">{exercise.cardio?.duration} min</td>
                    <td className="px-4 py-2 text-gray-800">{exercise.cardio?.distance}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        exercise.cardio?.intensity === 'High' 
                          ? 'bg-red-100 text-red-800' 
                          : exercise.cardio?.intensity === 'Medium'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-blue-100 text-blue-800'
                      }`}>
                        {exercise.cardio?.intensity}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-4">
            <img 
              src="https://images.unsplash.com/photo-1548690312-e3b507d8c110?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHwzfHxmaXRuZXNzJTIwY2FyZGlvJTIwd29ya291dCUyMHJ1bm5pbmclMjBleGVyY2lzZSUyMHRyYWNraW5nfGVufDB8fHx8MTc0NDk3MjcwM3ww&ixlib=rb-4.0.3&fit=fillmax&h=600&w=800" 
              alt="Woman with jump rope" 
              className="w-full h-24 object-cover rounded-md"
            />
          </div>
        </>
      )}
    </div>
  );
}
 