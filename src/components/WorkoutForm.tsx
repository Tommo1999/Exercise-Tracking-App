import  { useState } from 'react';
import { Calendar, Plus, CheckCircle, Activity } from 'lucide-react';
import { Exercise, Workout } from '../types';
import ExerciseForm from './ExerciseForm';
import ExerciseList from './ExerciseList';

interface WorkoutFormProps {
  onSaveWorkout: (workout: Workout) => void;
}

export default function WorkoutForm({ onSaveWorkout }: WorkoutFormProps) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [name, setName] = useState('');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [showExerciseForm, setShowExerciseForm] = useState(false);
  const [exerciseFormType, setExerciseFormType] = useState<'strength' | 'cardio'>('strength');

  const handleAddExercise = (exercise: Exercise) => {
    setExercises([...exercises, exercise]);
    setShowExerciseForm(false);
  };

  const handleRemoveExercise = (exerciseId: string) => {
    setExercises(exercises.filter(ex => ex.id !== exerciseId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || exercises.length === 0) return;
    
    onSaveWorkout({
      id: Date.now().toString(),
      date,
      name,
      exercises
    });
    
    // Reset form
    setDate(new Date().toISOString().split('T')[0]);
    setName('');
    setExercises([]);
  };

  const openExerciseForm = (type: 'strength' | 'cardio') => {
    setExerciseFormType(type);
    setShowExerciseForm(true);
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="card">
        <h2 className="text-lg font-semibold mb-4">Create New Workout</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Workout Date
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar size={16} className="text-gray-400" />
              </div>
              <input
                type="date"
                className="input pl-10"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Workout Name*
            </label>
            <input
              type="text"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Upper Body Strength"
              required
            />
          </div>
        </div>
        
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-md font-medium">Exercises</h3>
            {exercises.length > 0 && (
              <button
                type="submit"
                className="btn btn-primary flex items-center"
              >
                <CheckCircle size={18} className="mr-1" />
                Save Workout
              </button>
            )}
          </div>
          
          {exercises.length > 0 ? (
            <ExerciseList exercises={exercises} onRemoveExercise={handleRemoveExercise} />
          ) : (
            <p className="text-gray-500 text-center py-4">No exercises added yet.</p>
          )}
          
          {!showExerciseForm ? (
            <div className="grid grid-cols-2 gap-3 mt-4">
              <button
                type="button"
                onClick={() => openExerciseForm('strength')}
                className="btn btn-outline flex items-center justify-center"
              >
                <Plus size={18} className="mr-1" />
                Add Strength
              </button>
              <button
                type="button"
                onClick={() => openExerciseForm('cardio')}
                className="btn btn-outline bg-green-50 border-green-200 text-green-700 hover:bg-green-100 flex items-center justify-center"
              >
                <Activity size={18} className="mr-1" />
                Add Cardio
              </button>
            </div>
          ) : null}
        </div>
      </form>
      
      {showExerciseForm && (
        <ExerciseForm 
          onAddExercise={handleAddExercise} 
          onCancel={() => setShowExerciseForm(false)}
          defaultType={exerciseFormType}
        />
      )}
    </div>
  );
}
 