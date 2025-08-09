'use client';
import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
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
  const [token, setTokenState] = useState(null);
  const [isTokenInitialized, setIsTokenInitialized] = useState(false);

  // Direct localStorage functions
  const setToken = useCallback((newToken) => {
    console.log('🔍 DIRECT DEBUG: setToken called with:', newToken ? newToken.substring(0, 20) + '...' : 'null');
    if (typeof window !== 'undefined') {
      if (newToken) {
        localStorage.setItem('token', newToken);
        console.log('🔍 DIRECT DEBUG: Token saved to localStorage');
      } else {
        localStorage.removeItem('token');
        console.log('🔍 DIRECT DEBUG: Token removed from localStorage');
      }
    }
    setTokenState(newToken);
  }, []);

  const removeToken = useCallback(() => {
    console.log('🔍 DIRECT DEBUG: removeToken called');
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
    setTokenState(null);
  }, []);

  // Load token from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedToken = localStorage.getItem('token');
      console.log('🔍 DIRECT DEBUG: Loading token from localStorage:', savedToken ? 'Token exists' : 'No token');
      setTokenState(savedToken);
      setIsTokenInitialized(true);
    }
  }, []);

  console.log('🔍 AUTH DEBUG: AuthProvider render:', { 
    user: !!user, 
    token: !!token, 
    loading, 
    isTokenInitialized 
  });

  // Memoized user validation
  const isAuthenticated = useMemo(() => {
    const authenticated = !!user && !!token;
    console.log('🔍 AUTH DEBUG: isAuthenticated calculation:', { user: !!user, token: !!token, authenticated });
    return authenticated;
  }, [user, token]);

  // Memoized user role check
  const isSeller = useMemo(() => {
    return user?.role === 'seller';
  }, [user?.role]);

  const isCustomer = useMemo(() => {
    return user?.role === 'customer';
  }, [user?.role]);

  // Check token validity on mount (only after token is initialized)
  useEffect(() => {
    if (!isTokenInitialized) return; // Wait for token to be initialized

    const checkAuth = async () => {
      console.log('🔍 AUTH DEBUG: checkAuth called');
      console.log('🔍 AUTH DEBUG: token exists:', !!token);
      console.log('🔍 AUTH DEBUG: isTokenInitialized:', isTokenInitialized);
      
      if (token) {
        try {
          console.log('🔍 AUTH DEBUG: Making request to /api/auth/me');
          const response = await fetch('http://localhost:5000/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          console.log('🔍 AUTH DEBUG: Response status:', response.status);
          
          if (response.ok) {
            const data = await response.json();
            console.log('🔍 AUTH DEBUG: User data received:', data.user);
            setUser(data.user);
          } else {
            console.log('🔍 AUTH DEBUG: Token is invalid, removing');
            // Token is invalid, remove it
            removeToken();
            setUser(null);
          }
        } catch (error) {
          console.error('🔍 AUTH DEBUG: Auth check failed:', error);
          removeToken();
          setUser(null);
        }
      } else {
        console.log('🔍 AUTH DEBUG: No token found');
      }
      setLoading(false);
    };

    checkAuth();
  }, [token, removeToken, isTokenInitialized]);

  // Memoized login function
  const login = useCallback(async (email, password) => {
    try {
      console.log('🔍 LOGIN DEBUG: Starting login process:', { email });
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log('🔍 LOGIN DEBUG: Login response:', { status: response.status, data });

      if (!response.ok) {
        // Handle rate limiting specifically
        if (response.status === 429) {
          const retryAfter = data.retryAfter || 900; // 15 minutes default
          throw new Error(`Too many attempts. Please try again in ${Math.ceil(retryAfter / 60)} minutes.`);
        }
        throw new Error(data.message || 'Login failed');
      }

      console.log('🔍 LOGIN DEBUG: Login successful, setting token and user');
      console.log('🔍 LOGIN DEBUG: Token to save:', data.token ? data.token.substring(0, 20) + '...' : 'null');
      console.log('🔍 LOGIN DEBUG: User to save:', data.user);
      
      console.log('🔍 LOGIN DEBUG: Calling setToken...');
      setToken(data.token);
      console.log('🔍 LOGIN DEBUG: setToken called');
      
      console.log('🔍 LOGIN DEBUG: Calling setUser...');
      setUser(data.user);
      console.log('🔍 LOGIN DEBUG: setUser called');
      
      toast.success('Login successful!');
      
      // Add a small delay to ensure token is saved before redirect
      console.log('🔍 LOGIN DEBUG: Waiting 100ms before redirect...');
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Redirect based on role
      if (data.user.role === 'seller') {
        console.log('🔍 LOGIN DEBUG: Redirecting to /seller');
        window.location.href = '/seller';
      } else {
        console.log('🔍 LOGIN DEBUG: Redirecting to /user');
        window.location.href = '/user';
      }
      
      return data;
    } catch (error) {
      console.error('🔍 LOGIN DEBUG: Login error:', error);
      toast.error(error.message || 'Login failed');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setToken]);

  // Memoized register function
  const register = useCallback(async (name, email, password, role = 'customer') => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle rate limiting specifically
        if (response.status === 429) {
          const retryAfter = data.retryAfter || 900;
          throw new Error(`Too many attempts. Please try again in ${Math.ceil(retryAfter / 60)} minutes.`);
        }
        throw new Error(data.message || 'Registration failed');
      }

      setToken(data.token);
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
    } finally {
      setLoading(false);
    }
  }, [setToken]);

  // Memoized logout function
  const logout = useCallback(() => {
    removeToken();
    setUser(null);
    toast.success('Logged out successfully!');
    window.location.href = '/';
  }, [removeToken]);

  // Memoized context value
  const contextValue = useMemo(() => ({
    user,
    loading,
    isAuthenticated,
    isSeller,
    isCustomer,
    login,
    register,
    logout,
  }), [
    user,
    loading,
    isAuthenticated,
    isSeller,
    isCustomer,
    login,
    register,
    logout,
  ]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}; 