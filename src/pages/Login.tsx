import  { useState } from 'react';
import { Eye, EyeOff, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login, register, loading } = useAuth();
  const [isLogin, setIsLogin] = useState(true); // Default to login view
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (isLogin) {
        const success = await login(formData.email, formData.password);
        if (!success) {
          setError('Invalid email or password');
        }
      } else {
        if (!formData.name.trim()) {
          setError('Name is required');
          return;
        }
        
        // Check if passwords match for registration
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          return;
        }
        
        const success = await register(formData.name, formData.email, formData.password);
        if (!success) {
          setError('Registration failed. Email may already be in use.');
        } else {
          // Clear success message after a delay if user doesn't interact
          setSuccess('Account created successfully! Please sign in with your credentials.');
          // Switch to login view
          setIsLogin(true);
          // Clear form except email (keep it for convenience)
          setFormData({
            name: '',
            email: formData.email,
            password: '',
            confirmPassword: ''
          });
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      setError('An error occurred. Please try again.');
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setSuccess('');
    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row max-w-4xl w-full bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="md:w-1/2 relative">
          <img 
            src="https://images.unsplash.com/photo-1550259979-ed79b48d2a30?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHwxfHxmaXRuZXNzJTIwZ3ltJTIwd2VpZ2h0cyUyMHdvcmtvdXQlMjBkdW1iYmVsbCUyMHRyYWluaW5nfGVufDB8fHx8MTc0NDk3NzQ5Nnww&ixlib=rb-4.0.3&fit=fillmax&h=600&w=800" 
            alt="Person lifting weights in gym" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex flex-col items-center justify-end p-6 text-white">
            <h2 className="text-3xl font-bold mb-2">FitTrack</h2>
            <p className="text-center text-lg mb-1">Your personal workout tracker</p>
            <p className="text-sm text-center opacity-90">Record exercises, sets, reps, and track your progress</p>
          </div>
        </div>

        <div className="md:w-1/2 p-8 md:p-12">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <h2 className="text-center text-2xl font-bold text-gray-900">
              {isLogin ? 'Sign in to your account' : 'Create a new account'}
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              {isLogin 
                ? 'Welcome back! Please sign in to access your workouts' 
                : 'Get started by creating a free account to track your workouts'}
            </p>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-md text-sm">
              {success}
            </div>
          )}

          <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
            {!isLogin && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <div className="mt-1">
                  <input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    required={!isLogin}
                    value={formData.name}
                    onChange={handleChange}
                    className="input"
                    placeholder="Enter your name"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="input"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="input pr-10"
                  placeholder="Enter your password"
                  minLength={6}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 px-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff size={18} className="text-gray-500" />
                  ) : (
                    <Eye size={18} className="text-gray-500" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password field for registration */}
            {!isLogin && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <div className="mt-1 relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required={!isLogin}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="input pr-10"
                    placeholder="Confirm your password"
                    minLength={6}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 px-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} className="text-gray-500" />
                    ) : (
                      <Eye size={18} className="text-gray-500" />
                    )}
                  </button>
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full flex justify-center items-center"
              >
                {loading ? (
                  <span className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></span>
                ) : (
                  <>
                    {isLogin ? (
                      <>
                        <LogIn size={18} className="mr-2" />
                        Sign in
                      </>
                    ) : (
                      <>
                        <UserPlus size={18} className="mr-2" />
                        Create account
                      </>
                    )}
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={toggleMode}
              className="text-sm font-medium text-primary hover:text-primary/80"
            >
              {isLogin
                ? "Don't have an account? Sign up"
                : 'Already have an account? Sign in'}
            </button>
          </div>
          
          <div className="mt-6 border-t pt-4">
            <p className="text-xs text-center text-gray-500">
              Demo accounts: user@example.com / password or admin@example.com / admin123
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
 