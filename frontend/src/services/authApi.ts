import { apiClient } from './api';

export interface GoogleAuthDto {
  accessToken: string;
}

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
  googleAuth: async (data: GoogleAuthDto): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/google', data);
    if (response.accessToken) {
      apiClient.setToken(response.accessToken);
    }
    return response;
  },

  getCurrentUser: async (): Promise<CurrentUser> => {
    return apiClient.get<CurrentUser>('/auth/me');
  },

  logout: () => {
    apiClient.setToken(null);
    localStorage.removeItem('user');
  },
};