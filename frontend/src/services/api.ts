// api.ts
// 1) 키 통일: 둘 다 지원하되, BASE_URL 우선 → 없으면 /api
const API_BASE_URL = (
  process.env.REACT_APP_API_BASE_URL ??
  process.env.REACT_APP_API_URL ??
  '/api'
).replace(/\/+$/, ''); // 끝의 슬래시 제거

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('accessToken');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) localStorage.setItem('accessToken', token);
    else localStorage.removeItem('accessToken');
  }

  // 경로 안전 조인
  private buildUrl(endpoint: string) {
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${this.baseURL}${path}`;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = this.buildUrl(endpoint);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as any),
    };
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;

    const response = await fetch(url, { ...options, headers });

    // 에러 응답 처리
    if (!response.ok) {
      if (response.status === 401) {
        this.setToken(null);
        window.location.href = '/login';
      }
      // 가능한 경우 상세 메시지 추출
      try {
        const err = await response.json();
        if (Array.isArray(err?.message)) throw new Error(err.message.join(', '));
        if (typeof err?.message === 'string') throw new Error(err.message);
      } catch { }
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }

    // 본문 처리 (빈 응답/204 대비)
    const ct = response.headers.get('content-type') || '';
    if (!ct) {
      // 예: 204 No Content
      return {} as T;
    }

    if (ct.includes('application/json')) {
      const body: any = await response.json();

      // 2) 배열을 기대하는 사용처 보호: 흔한 래퍼를 풀어 배열로 정규화
      //    - 배열이면 그대로
      //    - {data: []} | {items: []} | {results: []} 면 내부 배열 반환
      if (Array.isArray(body)) return body as T;
      if (Array.isArray(body?.data)) return body.data as T;
      if (Array.isArray(body?.items)) return body.items as T;
      if (Array.isArray(body?.results)) return body.results as T;

      return body as T; // 그 외는 객체 그대로
    }

    // 텍스트/기타
    const text = await response.text();
    try {
      // 일부 서버가 JSON인데 헤더가 틀린 경우 방어
      return JSON.parse(text) as T;
    } catch {
      return (text ? (text as any) : ({} as any)) as T;
    }
  }

  get<T>(endpoint: string) { return this.request<T>(endpoint, { method: 'GET' }); }
  post<T>(endpoint: string, data: any) { return this.request<T>(endpoint, { method: 'POST', body: JSON.stringify(data) }); }
  put<T>(endpoint: string, data: any) { return this.request<T>(endpoint, { method: 'PUT', body: JSON.stringify(data) }); }
  patch<T>(endpoint: string, data: any) { return this.request<T>(endpoint, { method: 'PATCH', body: JSON.stringify(data) }); }
  delete<T>(endpoint: string) { return this.request<T>(endpoint, { method: 'DELETE' }); }
}

export const apiClient = new ApiClient(API_BASE_URL);
