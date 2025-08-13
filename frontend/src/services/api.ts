// api.ts

// 1) 키 통일: 둘 다 지원, 없으면 /api
const API_BASE_URL = (
  process.env.REACT_APP_API_BASE_URL ??
  process.env.REACT_APP_API_URL ??
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
    this.token = localStorage.getItem('accessToken');
  }

  setToken(token: string | null) {
    this.token = token;
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
    // Body가 있을 때만 Content-Type 기본값 설정
    if (hasBody && !('Content-Type' in headers)) {
      headers['Content-Type'] = 'application/json';
    }
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;

    // 타임아웃(옵션)
    const ac = typeof AbortController !== 'undefined' ? new AbortController() : undefined;
    const to = ac ? setTimeout(() => ac.abort(), this.defaultTimeoutMs) : undefined;

    try {
      // 3xx 수동 감지 (로그인 리다이렉트 핸들)
      const res = await fetch(url, {
        ...options,
        headers,
        signal: ac?.signal,
        redirect: 'manual' as RequestRedirect,
      });

      if (res.status >= 300 && res.status < 400) {
        const loc = res.headers.get('Location') || '';
        if (loc.includes('/login')) {
          this.setToken(null);
          window.location.href = '/login';
          throw new Error('Redirected to login');
        }
      }

      if (res.status === 401) {
        this.setToken(null);
        window.location.href = '/login';
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
        // 대개 인증 실패로 로그인 HTML이 내려오는 경우
        this.setToken(null);
        window.location.href = '/login';
        throw new Error('Unexpected HTML (probably login page)');
      }

      // JSON 우선
      const json = await parseJsonSafely(res);
      if (json !== null) return json;

      // 비-JSON은 텍스트로
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

  async get<T>(endpoint: string): Promise<T> {
    // 기존 시그니처 유지 (객체/리스트 모두 가능)
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
