import axios from 'axios';

// Create Axios Instance
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
    withCredentials: true, // important for sending/receiving httpOnly cookies
});

// Request Interceptor: Attach Access Token
api.interceptors.request.use(
    (config) => {
        // Skip attaching token for login and register
        if (config.url.includes('/auth/login') || config.url.includes('/auth/register')) {
            return config;
        }

        const userTokens = JSON.parse(localStorage.getItem('tokens'));
        if (userTokens?.accessToken) {
            config.headers['Authorization'] = `Bearer ${userTokens.accessToken}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 & Token Refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If it's a 401 and not a retry, and NOT a login/register request
        if (
            error.response?.status === 401 && 
            !originalRequest._retry && 
            !originalRequest.url.includes('/auth/login') &&
            !originalRequest.url.includes('/auth/register')
        ) {
            if (originalRequest.url.includes('/auth/refresh')) {
                return Promise.reject(error);
            }

            originalRequest._retry = true;

            try {
                // Use default axios to avoid infinite loops if the interceptor was global
                const { data } = await axios.post(
                    `${import.meta.env.VITE_API_URL || '/api'}/auth/refresh`,
                    {},
                    { withCredentials: true }
                );

                if (!data.accessToken) {
                    throw new Error('No access token returned');
                }

                // Update local storage
                const tokens = JSON.parse(localStorage.getItem('tokens')) || {};
                tokens.accessToken = data.accessToken;
                localStorage.setItem('tokens', JSON.stringify(tokens));

                // Retry original request with new token
                originalRequest.headers['Authorization'] = `Bearer ${data.accessToken}`;
                return api(originalRequest);
            } catch (err) {
                // Refresh failed or no transition possible -> clear and reject
                localStorage.removeItem('tokens');
                localStorage.removeItem('user');
                // Optional: redirect to login or let the component handle it
                window.location.href = '/login';
                return Promise.reject(err);
            }
        }

        return Promise.reject(error);
    }
);

// Auth Service Actions
export const authService = {
    login: async (email, password) => {
        const { data } = await api.post('/auth/login', { email, password });

        // Storing access token for interceptor usage
        const tokens = { accessToken: data.accessToken };
        localStorage.setItem('tokens', JSON.stringify(tokens));

        return data;
    },
    register: async (userData) => {
        const { data } = await api.post('/auth/register', userData);
        return data;
    },
    logout: async () => {
        await api.post('/auth/logout');
        localStorage.removeItem('tokens');
    },
    refresh: async () => {
        const { data } = await api.post('/auth/refresh');
        if (!data.accessToken) {
            localStorage.removeItem('tokens');
            throw new Error('No refresh token provided');
        }
        const tokens = { accessToken: data.accessToken };
        localStorage.setItem('tokens', JSON.stringify(tokens));
        return data;
    },
    forgotPassword: async (email) => {
        const { data } = await api.post('/auth/forgot-password', { email });
        return data;
    },
    resetPassword: async (token, password) => {
        const { data } = await api.post(`/auth/reset-password/${token}`, { password });
        return data;
    }
};

export default api;
