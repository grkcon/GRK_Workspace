const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('accessToken');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('accessToken', token);
    } else {
      localStorage.removeItem('accessToken');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    console.log('API Base URL:', this.baseURL); // 베이스 URL 확인
    console.log('Endpoint:', endpoint); // 엔드포인트 확인
    console.log('Full URL:', url); // 전체 URL 확인
    
    const headers: any = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const config: RequestInit = {
      headers,
      ...options,
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired or invalid
        this.setToken(null);
        window.location.href = '/login';
      }
      
      // 에러 응답 본문을 읽어서 더 상세한 정보 제공
      try {
        const errorData = await response.json();
        if (errorData.message) {
          // 배열인 경우 (유효성 검증 에러)
          if (Array.isArray(errorData.message)) {
            throw new Error(errorData.message.join(', '));
          }
          // 문자열인 경우
          throw new Error(errorData.message);
        }
      } catch (parseError) {
        // JSON 파싱 실패시 기본 에러
      }
      
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // 응답 내용이 비어있는 경우 처리
    const text = await response.text();
    if (!text) {
      return {} as T;
    }
    
    try {
      return JSON.parse(text);
    } catch (error) {
      // JSON 파싱 실패 시 빈 객체 반환
      console.warn('Failed to parse JSON response:', text);
      return {} as T;
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async patch<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);