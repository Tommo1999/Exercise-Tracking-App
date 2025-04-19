import  { useState, useEffect } from 'react';
import { Activity, HelpCircle, LogOut } from 'lucide-react';
import { Workout } from './types';
import WorkoutList from './components/WorkoutList';
import WorkoutForm from './components/WorkoutForm';
import WorkoutDetail from './components/WorkoutDetail';
import DownloadButton from './components/DownloadButton';
import FileImport from './components/FileImport';
import CardioSection from './components/CardioSection';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import WorkoutStorage from './services/WorkoutStorage';

function AppContent() {
  const { isAuthenticated, user, logout } = useAuth();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  
  useEffect(() => {
    if (isAuthenticated) {
      fetchWorkouts();
    }
  }, [isAuthenticated]);
  
  const fetchWorkouts = async () => {
    setLoading(true);
    try {
      const data = await WorkoutStorage.getWorkouts();
      setWorkouts(data);
    } catch (error) {
      console.error('Failed to fetch workouts:', error);
      showNotification('Failed to load workouts', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSaveWorkout = async (workout: Workout) => {
    setLoading(true);
    try {
      const success = await WorkoutStorage.saveWorkout(workout);
      if (success) {
        await fetchWorkouts();
        showNotification('Workout saved successfully!', 'success');
      } else {
        showNotification('Failed to save workout', 'error');
      }
    } catch (error) {
      console.error('Error saving workout:', error);
      showNotification('Failed to save workout', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteWorkout = async (workoutId: string) => {
    setLoading(true);
    try {
      const success = await WorkoutStorage.deleteWorkout(workoutId);
      if (success) {
        if (selectedWorkout?.id === workoutId) {
          setSelectedWorkout(null);
        }
        await fetchWorkouts();
        showNotification('Workout deleted successfully!', 'success');
      } else {
        showNotification('Failed to delete workout', 'error');
      }
    } catch (error) {
      console.error('Error deleting workout:', error);
      showNotification('Failed to delete workout', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleImportSuccess = () => {
    fetchWorkouts();
    showNotification('Data imported successfully!', 'success');
  };

  // If user is not authenticated, render login page
  if (!isAuthenticated) {
    return <Login />;
  }

  // User is authenticated, render protected content
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity size={24} className="text-primary" />
            <h1 className="text-xl font-bold text-gray-900">FitTrack</h1>
          </div>
          
          <div className="flex items-center">
            {user && (
              <div className="mr-4 text-sm text-gray-600">
                Welcome, {user.name}
              </div>
            )}
            <button 
              onClick={logout}
              className="btn btn-outline flex items-center text-sm"
            >
              <LogOut size={16} className="mr-1" />
              Logout
            </button>
          </div>
        </div>
      </header>
      
      {notification && (
        <div className={`fixed top-4 right-4 p-3 rounded-md shadow-md z-50 ${
          notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {notification.message}
        </div>
      )}
      
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6">
        {loading && (
          <div className="fixed inset-0 flex items-center justify-center bg-gray-50 bg-opacity-75 z-40">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="md:col-span-2 space-y-6">
            <WorkoutList 
              workouts={workouts} 
              onSelectWorkout={setSelectedWorkout}
              onDeleteWorkout={handleDeleteWorkout}
            />
            
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">Fitness Stats</h2>
              <div className="text-center py-4">
                <Activity size={48} className="mx-auto text-primary mb-2" />
                <p className="text-2xl font-bold">{workouts.length}</p>
                <p className="text-gray-500">Total Workouts</p>
              </div>
              
              <div className="grid grid-cols-2 text-center border-t">
                <div className="py-4">
                  <p className="text-xl font-bold">
                    {workouts.reduce((total, workout) => 
                      total + workout.exercises.filter(ex => ex.type === 'strength').length, 0)}
                  </p>
                  <p className="text-gray-500">Strength Exercises</p>
                </div>
                <div className="py-4 border-l">
                  <p className="text-xl font-bold">
                    {workouts.reduce((total, workout) => 
                      total + workout.exercises.filter(ex => ex.type === 'cardio').length, 0)}
                  </p>
                  <p className="text-gray-500">Cardio Sessions</p>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-md font-medium">Your Data</h3>
                  <DownloadButton />
                </div>
                <div className="mt-4">
                  <FileImport onImportSuccess={handleImportSuccess} />
                </div>
                <div className="mt-3">
                  <img 
                    src="https://images.unsplash.com/photo-1550259979-ed79b48d2a30?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHwxfHxmaXRuZXNzJTIwZ3ltJTIwd2VpZ2h0cyUyMHdvcmtvdXQlMjBkdW1iYmVsbCUyMHRyYWluaW5nfGVufDB8fHx8MTc0NDk3NDc2OXww&ixlib=rb-4.0.3&fit=fillmax&h=400&w=600" 
                    alt="Training session" 
                    className="w-full h-20 object-cover rounded mt-4"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Your data is stored locally and can be exported to reuse on other devices.
                </p>
              </div>
            </div>
          </div>
          
          <div className="md:col-span-3">
            {selectedWorkout ? (
              <WorkoutDetail
                workout={selectedWorkout}
                onBack={() => setSelectedWorkout(null)}
              />
            ) : (
              <>
                <WorkoutForm onSaveWorkout={handleSaveWorkout} />
                <CardioSection workouts={workouts} />
              </>
            )}
          </div>
        </div>
      </main>
      
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6">
          <div className="flex justify-center">
            <p className="text-sm text-gray-500">
              FitTrack - Exercise Tracking App
            </p>
          </div>
          <div className="mt-1 flex justify-center">
            <div className="flex space-x-4">
              <img 
                src="https://images.unsplash.com/photo-1550259979-ed79b48d2a30?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHwxfHxmaXRuZXNzJTIwZ3ltJTIwd2VpZ2h0cyUyMHdvcmtvdXQlMjBkdW1iYmVsbCUyMHRyYWluaW5nfGVufDB8fHx8MTc0NDk3NDc2OXww&ixlib=rb-4.0.3&fit=fillmax&h=400&w=600" 
                alt="Person using fitness tracker" 
                className="w-16 h-10 object-cover rounded"
              />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// The correct way to wrap the component with AuthProvider
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
 