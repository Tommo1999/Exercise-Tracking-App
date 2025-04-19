import  { useState } from 'react';
import { Plus, Save, X } from 'lucide-react';
import { Exercise, Set, CardioEntry } from '../types';

interface ExerciseFormProps {
  onAddExercise: (exercise: Exercise) => void;
  onCancel: () => void;
  defaultType?: 'strength' | 'cardio';
}

export default function ExerciseForm({ onAddExercise, onCancel, defaultType = 'strength' }: ExerciseFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [exerciseType, setExerciseType] = useState<'strength' | 'cardio'>(defaultType);
  
  // Strength training sets
  const [sets, setSets] = useState<Set[]>([
    { id: '1', weight: '', reps: '' },
    { id: '2', weight: '', reps: '' },
    { id: '3', weight: '', reps: '' },
    { id: '4', weight: '', reps: '' },
    { id: '5', weight: '', reps: '' },
  ]);

  // Cardio details
  const [cardio, setCardio] = useState<CardioEntry>({
    id: '1',
    duration: '',
    distance: '',
    intensity: 'Medium',
    caloriesBurned: ''
  });

  const updateSet = (id: string, field: 'weight' | 'reps', value: string) => {
    setSets(sets.map(set => set.id === id ? { ...set, [field]: value } : set));
  };

  const updateCardio = (field: keyof CardioEntry, value: string) => {
    setCardio({ ...cardio, [field]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    if (exerciseType === 'strength') {
      onAddExercise({
        id: Date.now().toString(),
        name,
        description,
        type: 'strength',
        sets
      });
    } else {
      onAddExercise({
        id: Date.now().toString(),
        name,
        description,
        type: 'cardio',
        cardio
      });
    }
    
    // Reset form
    setName('');
    setDescription('');
    setExerciseType('strength');
    setSets([
      { id: '1', weight: '', reps: '' },
      { id: '2', weight: '', reps: '' },
      { id: '3', weight: '', reps: '' },
      { id: '4', weight: '', reps: '' },
      { id: '5', weight: '', reps: '' },
    ]);
    setCardio({
      id: '1',
      duration: '',
      distance: '',
      intensity: 'Medium',
      caloriesBurned: ''
    });
  };

  return (
    <form onSubmit={handleSubmit} className="card">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">
          Add {exerciseType === 'cardio' ? 'Cardio' : 'Strength'} Exercise
        </h3>
        <button 
          type="button" 
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600"
        >
          <X size={20} />
        </button>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Exercise Name*
          </label>
          <input
            type="text"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={exerciseType === 'cardio' ? 'e.g., Running, Cycling, Swimming' : 'e.g., Bench Press, Squats'}
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            className="input min-h-[80px]"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the exercise..."
          ></textarea>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Exercise Type
          </label>
          <div className="flex space-x-4">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="exerciseType"
                checked={exerciseType === 'strength'}
                onChange={() => setExerciseType('strength')}
                className="mr-2"
              />
              <span>Strength Training</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="exerciseType"
                checked={exerciseType === 'cardio'}
                onChange={() => setExerciseType('cardio')}
                className="mr-2"
              />
              <span>Cardio</span>
            </label>
          </div>
        </div>
        
        {exerciseType === 'strength' ? (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Sets (5)</h4>
            <div className="space-y-2">
              <div className="grid grid-cols-8 gap-2 text-sm font-medium text-gray-500">
                <div className="col-span-1">Set</div>
                <div className="col-span-3">Weight</div>
                <div className="col-span-3">Reps</div>
              </div>
              
              {sets.map((set, index) => (
                <div key={set.id} className="grid grid-cols-8 gap-2 items-center">
                  <div className="col-span-1 text-center font-medium">{index + 1}</div>
                  <div className="col-span-3">
                    <input
                      type="text"
                      className="input"
                      value={set.weight}
                      onChange={(e) => updateSet(set.id, 'weight', e.target.value)}
                      placeholder="lbs/kg"
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      type="text"
                      className="input"
                      value={set.reps}
                      onChange={(e) => updateSet(set.id, 'reps', e.target.value)}
                      placeholder="count"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Cardio Details</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration (minutes)
                </label>
                <input
                  type="text"
                  className="input"
                  value={cardio.duration}
                  onChange={(e) => updateCardio('duration', e.target.value)}
                  placeholder="e.g., 30"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Distance (miles/km)
                </label>
                <input
                  type="text"
                  className="input"
                  value={cardio.distance}
                  onChange={(e) => updateCardio('distance', e.target.value)}
                  placeholder="e.g., 5"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Intensity
                </label>
                <select
                  className="input"
                  value={cardio.intensity}
                  onChange={(e) => updateCardio('intensity', e.target.value)}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Calories Burned (optional)
                </label>
                <input
                  type="text"
                  className="input"
                  value={cardio.caloriesBurned || ''}
                  onChange={(e) => updateCardio('caloriesBurned', e.target.value)}
                  placeholder="e.g., 300"
                />
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-6 flex justify-end">
        <button
          type="submit"
          className={`btn flex items-center ${
            exerciseType === 'cardio' 
              ? 'bg-green-600 hover:bg-green-700 text-white' 
              : 'btn-primary'
          }`}
        >
          <Plus size={18} className="mr-1" />
          Add {exerciseType === 'cardio' ? 'Cardio' : 'Strength'} Exercise
        </button>
      </div>

      {exerciseType === 'cardio' && (
        <div className="mt-4">
          <img 
            src="https://images.unsplash.com/photo-1620213391117-0d169a917221?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHwxfHxmaXRuZXNzJTIwY2FyZGlvJTIwd29ya291dCUyMHJ1bm5pbmclMjBleGVyY2lzZSUyMHRyYWNraW5nfGVufDB8fHx8MTc0NDk3MjcwM3ww&ixlib=rb-4.0.3&fit=fillmax&h=600&w=800" 
            alt="Woman getting ready for run" 
            className="w-full h-32 object-cover rounded-md"
          />
          <p className="text-xs text-gray-500 mt-1">
            Track your cardio workouts like running, cycling, swimming, and more
          </p>
        </div>
      )}
    </form>
  );
}
 