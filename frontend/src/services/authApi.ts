import { apiClient } from './api';


export interface AuthResponse {
  accessToken: string;
  user: {
    id: number;
    email: string;
    name: string;
    role: string;
    profilePicture?: string;
  };
}

export interface CurrentUser {
  id: number;
  email: string;
  name: string;
  role: string;
  profilePicture?: string;
}

export const authApi = {
  getCurrentUser: async (): Promise<CurrentUser> => {
    return apiClient.get<CurrentUser>('/auth/me');
  },

  logout: () => {
    apiClient.setToken(null);
    localStorage.removeItem('user');
  },
};