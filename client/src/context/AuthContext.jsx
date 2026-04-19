import { createContext, useReducer, useEffect } from 'react';
import { authService } from '../services/authService';

export const AuthContext = createContext(null);

const initialState = {
    user: JSON.parse(localStorage.getItem('user')) || null,
    accessToken: null,
    isAuthenticated: false,
    isLoading: true,
};

const authReducer = (state, action) => {
    switch (action.type) {
        case 'LOGIN_SUCCESS':
        case 'REFRESH_TOKEN':
            return {
                ...state,
                user: action.payload.user,
                accessToken: action.payload.accessToken,
                isAuthenticated: true,
                isLoading: false,
            };
        case 'LOGOUT':
        case 'AUTH_ERROR':
            return {
                ...state,
                user: null,
                accessToken: null,
                isAuthenticated: false,
                isLoading: false,
            };
        case 'SET_LOADING':
            return {
                ...state,
                isLoading: action.payload,
            };
        default:
            return state;
    }
};

export const AuthProvider = ({ children }) => {
    const [state, dispatch] = useReducer(authReducer, initialState);

    useEffect(() => {
        let isMounted = true;

        const initAuth = async () => {
            try {
                const data = await authService.refresh();
                if (isMounted) {
                    // Typically refresh only returns accessToken, we might need to fetch user separately 
                    // if not encoded in token or returned. Let's assume we decode token or store user locally.
                    const user = JSON.parse(localStorage.getItem('user'));
                    dispatch({
                        type: 'REFRESH_TOKEN',
                        payload: { accessToken: data.accessToken, user },
                    });
                }
            } catch (error) {
                if (isMounted) {
                    dispatch({ type: 'AUTH_ERROR' });
                }
            }
        };

        initAuth();

        return () => {
            isMounted = false;
        };
    }, []);

    const login = async (email, password) => {
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            const data = await authService.login(email, password);
            localStorage.setItem('user', JSON.stringify(data.user));
            dispatch({
                type: 'LOGIN_SUCCESS',
                payload: { user: data.user, accessToken: data.accessToken },
            });
            return data;
        } catch (error) {
            dispatch({ type: 'SET_LOADING', payload: false });
            throw error;
        }
    };

    const logout = async () => {
        try {
            await authService.logout();
        } finally {
            localStorage.removeItem('user');
            dispatch({ type: 'LOGOUT' });
        }
    };

    return (
        <AuthContext.Provider value={{ ...state, login, logout, dispatch }}>
            {children}
        </AuthContext.Provider>
    );
};
