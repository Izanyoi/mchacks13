import axios from "axios";

const API_URL = "http://localhost:8000";

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface User {
  id: number;
  username: string;
  email: string;
  full_name?: string;
}

export interface Token {
  access_token: string;
  token_type: string;
}

export interface TaskInput {
  name: string;
  priority: number;
  dueDate: string; // ISO string
  estimatedTimeMinutes: number;
  withFriend: boolean;
  start?: string;
  end?: string;
  instances?: number;
  minTime?: string;
  maxTime?: string;
}

export interface Block {
  block_id: number;
  task_id: number;
  start: string; // ISO string
  end: string;   // ISO string
  title: string;
}

export const auth = {
  register: async (username: string, email: string, password: string): Promise<User | void> => {
    try {
      const response = await api.post<User>("/register", {
        username,
        email,
        password,
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 400) {
        // If user exists, try to login
        return;
      }
      throw error;
    }
  },
  login: async (username: string, password: string): Promise<Token> => {
    const formData = new FormData();
    formData.append("username", username);
    formData.append("password", password);
    const response = await api.post<Token>("/token", formData);
    localStorage.setItem("token", response.data.access_token);
    return response.data;
  },
  ensureLoggedIn: async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      // Attempt to register/login a default user for demo purposes
      const username = "demo_user";
      const password = "password123";
      const email = "demo@example.com";

      try {
        await auth.register(username, email, password);
      } catch (e) {
        // Ignore registration error if user exists
      }
      await auth.login(username, password);
    }
  }
};

export const tasks = {
  add: async (task: TaskInput) => {
    await auth.ensureLoggedIn();
    const response = await api.post("/tasks/", task);
    return response.data;
  },
  deleteBlock: async (blockId: number) => {
    await auth.ensureLoggedIn();
    const response = await api.delete(`/tasks/block/${blockId}`);
    return response.data;
  },
};

export const schedule = {
  get: async (): Promise<Block[]> => {
    await auth.ensureLoggedIn();
    const response = await api.get<Block[]>("/schedule/");
    return response.data;
  },
};
