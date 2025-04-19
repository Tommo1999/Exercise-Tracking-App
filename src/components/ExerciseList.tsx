import  { Trash } from 'lucide-react';
import { Exercise } from '../types';

interface ExerciseListProps {
  exercises: Exercise[];
  onRemoveExercise: (id: string) => void;
}

export default function ExerciseList({ exercises, onRemoveExercise }: ExerciseListProps) {
  return (
    <ul className="space-y-3">
      {exercises.map(exercise => (
        <li key={exercise.id} className="border rounded-md p-3">
          <div className="flex justify-between items-start">
            <div className="w-full">
              <div className="flex items-center">
                <h4 className="font-medium">{exercise.name}</h4>
                <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                  exercise.type === 'cardio' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {exercise.type === 'cardio' ? 'Cardio' : 'Strength'}
                </span>
              </div>
              
              {exercise.description && (
                <p className="text-sm text-gray-600 mt-1">{exercise.description}</p>
              )}
              
              {/* Strength Training Sets */}
              {exercise.type === 'strength' && exercise.sets && (
                <div className="mt-3">
                  <div className="text-xs font-medium text-gray-500 mb-1">Sets:</div>
                  <div className="grid grid-cols-7 gap-2 text-xs text-gray-500">
                    <div className="col-span-1">#</div>
                    <div className="col-span-3">Weight</div>
                    <div className="col-span-3">Reps</div>
                  </div>
                  
                  {exercise.sets.map((set, index) => (
                    <div key={set.id} className="grid grid-cols-7 gap-2 text-sm">
                      <div className="col-span-1">{index + 1}</div>
                      <div className="col-span-3">{set.weight || '-'}</div>
                      <div className="col-span-3">{set.reps || '-'}</div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Cardio Details */}
              {exercise.type === 'cardio' && exercise.cardio && (
                <div className="mt-3">
                  <div className="text-xs font-medium text-gray-500 mb-1">Cardio Details:</div>
                  <div className="grid grid-cols-2 gap-4 text-sm mt-2">
                    <div className="flex items-center">
                      <span className="text-gray-500 mr-2">Duration:</span>
                      <span>{exercise.cardio.duration} min</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-gray-500 mr-2">Distance:</span>
                      <span>{exercise.cardio.distance} mi/km</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-gray-500 mr-2">Intensity:</span>
                      <span>{exercise.cardio.intensity}</span>
                    </div>
                    {exercise.cardio.caloriesBurned && (
                      <div className="flex items-center">
                        <span className="text-gray-500 mr-2">Calories:</span>
                        <span>{exercise.cardio.caloriesBurned}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <button 
              onClick={() => onRemoveExercise(exercise.id)}
              className="text-gray-400 hover:text-red-500 ml-2 flex-shrink-0"
              aria-label="Remove exercise"
            >
              <Trash size={18} />
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
 