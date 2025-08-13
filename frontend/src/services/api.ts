// 1) 환경변수 키 통일: 둘 다 지원, 없으면 /api
const API_BASE_URL = (
  (process.env as any).REACT_APP_API_BASE_URL ??
  (process.env as any).REACT_APP_API_URL ??
  '/api'
).replace(/\/+$/, ''); // 끝 슬래시 제거

function joinPath(base: string, endpoint: string) {
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${base}${path}`;
}

function normalizeToArray<T>(body: any): T[] {
  if (Array.isArray(body)) return body as T[];
  if (Array.isArray(body?.data)) return body.data as T[];
  if (Array.isArray(body?.items)) return body.items as T[];
  if (Array.isArray(body?.results)) return body.results as T[];
  return [];
}

async function parseJsonSafely(res: Response) {
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('application/json')) return null;
  try { return await res.json(); } catch { return null; }
}

export class ApiClient {
  private baseURL: string;
  private token: string | null = null;
  private defaultTimeoutMs = 15000; // 15s

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window === 'undefined') return;
    if (token) localStorage.setItem('accessToken', token);
    else localStorage.removeItem('accessToken');
  }

  private buildUrl(endpoint: string) {
    return joinPath(this.baseURL, endpoint);
  }

  private async _request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = this.buildUrl(endpoint);

    const hasBody = options.body !== undefined && options.body !== null;
    const headers: Record<string, string> = {
      ...(options.headers as any),
    };
    // Body가 있을 때만 Content-Type 기본값
    if (hasBody && !('Content-Type' in headers)) {
      headers['Content-Type'] = 'application/json';
    }
    // JSON 기대
    if (!('Accept' in headers)) headers['Accept'] = 'application/json';
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;

    // 타임아웃
    const ac = typeof AbortController !== 'undefined' ? new AbortController() : undefined;
    const to = ac ? setTimeout(() => ac.abort(), this.defaultTimeoutMs) : undefined;

    try {
      // 리다이렉트 자동 추종 안 함(HTML 섞이는 것 방지)
      const res = await fetch(url, {
        ...options,
        headers,
        redirect: 'manual' as RequestRedirect,
        signal: ac?.signal,
      });

      // 3xx: 이동하지 않고 에러로 처리 (로그인 페이지 비활성 상태)
      if (res.status >= 300 && res.status < 400) {
        const loc = res.headers.get('Location') || '';
        throw new Error(`Redirected (${res.status}) ${loc}`);
      }

      // 401: 토큰만 정리하고 에러
      if (res.status === 401) {
        this.setToken(null);
        throw new Error('Unauthorized');
      }

      if (!res.ok) {
        const errJson = await parseJsonSafely(res);
        if (errJson?.message) {
          throw new Error(Array.isArray(errJson.message) ? errJson.message.join(', ') : errJson.message);
        }
        throw new Error(`HTTP ${res.status} ${res.statusText}`);
      }

      const ct = res.headers.get('content-type') || '';
      if (ct.includes('text/html')) {
        // SPA/HTML이 떨어지는 상황은 비정상 → 에러
        throw new Error('Unexpected HTML response');
      }

      // JSON 우선
      const json = await parseJsonSafely(res);
      if (json !== null) return json;

      // 비-JSON 응답
      const text = await res.text();
      try { return JSON.parse(text); } catch { return text || {}; }
    } finally {
      if (to) clearTimeout(to);
    }
  }

  // ✔ 객체(JSON) 그대로 받고 싶을 때
  async getJSON<T>(endpoint: string): Promise<T> {
    return this._request(endpoint, { method: 'GET' }) as Promise<T>;
  }

  // ✔ 리스트 화면: 항상 배열 보장
  async getList<T>(endpoint: string): Promise<T[]> {
    const body = await this._request(endpoint, { method: 'GET' });
    return normalizeToArray<T>(body);
  }

  // 기존 시그니처 유지(객체/리스트 모두 가능)
  async get<T>(endpoint: string): Promise<T> {
    return this._request(endpoint, { method: 'GET' }) as Promise<T>;
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    return this._request(endpoint, { method: 'POST', body: JSON.stringify(data) }) as Promise<T>;
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    return this._request(endpoint, { method: 'PUT', body: JSON.stringify(data) }) as Promise<T>;
  }

  async patch<T>(endpoint: string, data: any): Promise<T> {
    return this._request(endpoint, { method: 'PATCH', body: JSON.stringify(data) }) as Promise<T>;
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this._request(endpoint, { method: 'DELETE' }) as Promise<T>;
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
