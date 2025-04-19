import  { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthState } from '../types';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    loading: true
  });

  useEffect(() => {
    // Check for stored auth data on component mount
    const checkAuthStatus = () => {
      const storedUser = localStorage.getItem('fittrack_user');
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          setAuthState({
            isAuthenticated: true,
            user,
            loading: false
          });
        } catch {
          localStorage.removeItem('fittrack_user');
          setAuthState({ isAuthenticated: false, user: null, loading: false });
        }
      } else {
        setAuthState({ isAuthenticated: false, user: null, loading: false });
      }
    };

    checkAuthStatus();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }));
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Get users from local storage
      const storedUsers = localStorage.getItem('fittrack_users') || '[]';
      let users = JSON.parse(storedUsers);
      
      // Add demo users if none exist
      if (users.length === 0) {
        users = [
          { id: '1', email: 'user@example.com', password: 'password', name: 'Demo User' },
          { id: '2', email: 'admin@example.com', password: 'admin123', name: 'Admin User' }
        ];
        localStorage.setItem('fittrack_users', JSON.stringify(users));
      }
      
      // Make email comparison case-insensitive
      const user = users.find((u: any) => 
        u.email.toLowerCase() === email.toLowerCase() && 
        u.password === password
      );
      
      if (user) {
        // Create a copy of user without the password
        const { password: _, ...userData } = user;
        setAuthState({
          isAuthenticated: true,
          user: userData,
          loading: false
        });
        
        // Store user info in localStorage
        localStorage.setItem('fittrack_user', JSON.stringify(userData));
        return true;
      } else {
        setAuthState(prev => ({ ...prev, loading: false }));
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      setAuthState(prev => ({ ...prev, loading: false }));
      return false;
    }
  };

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }));
      
      if (!name.trim() || !email.trim() || !password.trim()) {
        setAuthState(prev => ({ ...prev, loading: false }));
        return false;
      }
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Get existing users from localStorage
      const storedUsers = localStorage.getItem('fittrack_users') || '[]';
      const users = JSON.parse(storedUsers);
      
      // Check if email already exists (case-insensitive)
      const existingUser = users.find((u: any) => 
        u.email.toLowerCase() === email.toLowerCase()
      );
      
      if (existingUser) {
        setAuthState(prev => ({ ...prev, loading: false }));
        return false;
      }
      
      // Create new user
      const newUser = {
        id: `user_${Date.now()}`,
        email,
        password, // In a real app, this would be hashed
        name
      };
      
      // Add user to stored users
      users.push(newUser);
      localStorage.setItem('fittrack_users', JSON.stringify(users));
      
      // No auto-login after registration
      setAuthState({
        isAuthenticated: false,
        user: null,
        loading: false
      });
      
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      setAuthState(prev => ({ ...prev, loading: false }));
      return false;
    }
  };

  const logout = () => {
    // Clear user data from localStorage
    localStorage.removeItem('fittrack_user');
    
    // Update state
    setAuthState({
      isAuthenticated: false,
      user: null,
      loading: false
    });
  };

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        register,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
 