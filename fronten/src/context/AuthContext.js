'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing token in localStorage
    const token = localStorage.getItem('token');
    if (token) {
      // Verify token with backend
      const verifyToken = async () => {
        try {
          const response = await fetch('http://localhost:5000/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (response.ok) {
            const data = await response.json();
            setUser(data.user);
          } else {
            // Token is invalid, remove it
            localStorage.removeItem('token');
            setUser(null);
          }
        } catch (error) {
          console.error('Token verification failed:', error);
          localStorage.removeItem('token');
          setUser(null);
        } finally {
          setLoading(false);
        }
      };
      
      verifyToken();
    } else {
      setLoading(false);
    }
  }, []);

            const login = async (email, password) => {
            try {
              const response = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
              });

              const data = await response.json();

              if (!response.ok) {
                // Handle rate limiting specifically
                if (response.status === 429) {
                  const retryAfter = data.retryAfter || 900; // 15 minutes default
                  throw new Error(`Too many attempts. Please try again in ${Math.ceil(retryAfter / 60)} minutes.`);
                }
                
                throw new Error(data.message || 'Login failed');
              }

              localStorage.setItem('token', data.token);
              setUser(data.user);
              
              toast.success('Login successful!');
              
              // Redirect based on role
              if (data.user.role === 'seller') {
                window.location.href = '/seller';
              } else {
                window.location.href = '/user';
              }
              
              return data;
            } catch (error) {
              console.error('Login error:', error);
              toast.error(error.message || 'Login failed');
              throw error;
            }
          };

            const register = async (userData) => {
            try {
              const response = await fetch('http://localhost:5000/api/auth/register', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData),
              });

              const data = await response.json();

              if (!response.ok) {
                // Handle rate limiting specifically
                if (response.status === 429) {
                  const retryAfter = data.retryAfter || 900; // 15 minutes default
                  throw new Error(`Too many attempts. Please try again in ${Math.ceil(retryAfter / 60)} minutes.`);
                }
                
                throw new Error(data.message || 'Registration failed');
              }

              localStorage.setItem('token', data.token);
              setUser(data.user);
              
              toast.success('Registration successful!');
              
              // Redirect based on role
              if (data.user.role === 'seller') {
                window.location.href = '/seller';
              } else {
                window.location.href = '/user';
              }
              
              return data;
            } catch (error) {
              console.error('Registration error:', error);
              toast.error(error.message || 'Registration failed');
              throw error;
            }
          };

            const logout = () => {
            localStorage.removeItem('token');
            setUser(null);
            toast.success('Logged out successfully!');
            window.location.href = '/';
          };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 