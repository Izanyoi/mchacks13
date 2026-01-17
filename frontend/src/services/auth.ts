import { Token, UserPublic} from '../types';

const API_URL = "http://localhost:8000";

export const login = async (username: string, password: string): Promise<Token> => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    const response = await fetch(`${API_URL}/token`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Login failed');
    }

    return response.json();
};

export const getMe = async (token: string): Promise<UserPublic> => {
    const response = await fetch(`${API_URL}/users/me/`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        if (response.status === 401) {
            localStorage.removeItem('token');
            throw new Error('Session expired. Please log in again.');
        }
        throw new Error('Failed to fetch user profile');
    }

    return response.json();
};

export const register = async (username: string, email: string, password: string, full_name: string): Promise<UserPublic> => {
    const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            username: username,
            email: email,
            password: password,
            full_name
        }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Registration failed');
    }

    return response.json();
};

export const editName = async (token: string, new_name: string): Promise<UserPublic> => {
    const response = await fetch(`${API_URL}/users/me/name?new_name=${encodeURIComponent(new_name)}`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        }
    });

    if (!response.ok) {
        throw new Error('Unable to edit name.');
    }

    return response.json();
};

export const editEmail = async (token: string, new_email: string): Promise<UserPublic> => {
    const response = await fetch(`${API_URL}/users/me/email?new_email=${encodeURIComponent(new_email)}`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        }
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Unable to edit email.');
    }

    return response.json();
};