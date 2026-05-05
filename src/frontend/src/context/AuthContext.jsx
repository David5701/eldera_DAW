import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(sessionStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    // Setup Axios Interceptor
    useEffect(() => {
        const interceptor = api.interceptors.request.use(
            (config) => {
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        return () => {
            api.interceptors.request.eject(interceptor);
        };
    }, [token]);

    useEffect(() => {
        const fetchUser = async () => {
            if (!token) {
                setLoading(false);
                return;
            }
            try {
                console.log("Fetching user profile...");
                const response = await api.get('/users/me');
                console.log("User profile fetched:", response.data);
                setUser(response.data);
            } catch (error) {
                console.error("Error fetching user", error);
                logout();
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [token]);

    const login = async (username, password) => {
        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);

        try {
            const response = await api.post('/token', formData);
            const { access_token } = response.data;

            console.log("Login successful, token received");
            sessionStorage.setItem('token', access_token);
            setToken(access_token);

            // Fetch user immediately with explicit header to avoid race condition
            const userResponse = await api.get('/users/me', {
                headers: { Authorization: `Bearer ${access_token}` }
            });
            setUser(userResponse.data);

            return true;
        } catch (error) {
            console.error("Login failed", error);
            throw error;
        }
    };

    const logout = () => {
        console.log("Logging out...");
        sessionStorage.removeItem('token');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
