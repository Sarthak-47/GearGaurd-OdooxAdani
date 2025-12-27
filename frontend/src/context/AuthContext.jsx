/**
 * Authentication Context
 * Manages user authentication state and provides auth methods
 */

import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Check for existing token on mount
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            fetchUser();
        } else {
            setLoading(false);
        }
    }, []);

    // Fetch current user from API
    const fetchUser = async () => {
        try {
            const response = await api.get('/auth/me');
            setUser(response.data.user);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch user:', err);
            localStorage.removeItem('token');
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    // Login
    const login = async (email, password) => {
        try {
            setError(null);
            const response = await api.post('/auth/login', { email, password });
            const { token, user: userData } = response.data;

            localStorage.setItem('token', token);
            setUser(userData);

            return { success: true };
        } catch (err) {
            const message = err.response?.data?.message || 'Login failed';
            setError(message);
            return { success: false, error: message };
        }
    };

    // Register
    const register = async (data) => {
        try {
            setError(null);
            const response = await api.post('/auth/register', data);
            const { token, user: userData } = response.data;

            localStorage.setItem('token', token);
            setUser(userData);

            return { success: true };
        } catch (err) {
            const message = err.response?.data?.message || 'Registration failed';
            setError(message);
            return { success: false, error: message };
        }
    };

    // Logout
    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    // Update user in context
    const updateUser = (userData) => {
        setUser(userData);
    };

    // Check if user has specific role
    const hasRole = (...roles) => {
        return user && roles.includes(user.role);
    };

    // Check if user is manager
    const isManager = () => hasRole('MANAGER');

    // Check if user is technician
    const isTechnician = () => hasRole('TECHNICIAN');

    const value = {
        user,
        loading,
        error,
        login,
        register,
        logout,
        updateUser,
        hasRole,
        isManager,
        isTechnician,
        isAuthenticated: !!user,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export default AuthContext;
