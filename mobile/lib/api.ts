import {
  getRefreshToken,
  saveTokens,
  clearTokens,
  getCookieHeader,
  updateAccessCookie,
  saveCookieValues,
} from "@/lib/auth/token";
import { API_URL } from "@/lib/constants";

class ApiClient {
  private baseUrl: string;
  private refreshing: Promise<boolean> | null = null;

  constructor() {
    this.baseUrl = API_URL;
  }

  /**
   * Build request headers.
   * React Native does NOT automatically send httpOnly cookies, so we manually
   * inject the cookie values we stored in SecureStore at login time.
   * Falls back to using the raw refresh token if no access cookie is stored yet.
   */
  private async getHeaders(): Promise<HeadersInit> {
    const cookie = await getCookieHeader();
    if (cookie) {
      return { "Content-Type": "application/json", Cookie: cookie };
    }
    // Fallback: no cookie saved yet — send refresh token as cookie so server
    // can authenticate or at least try the refresh flow
    const refreshToken = await getRefreshToken();
    return {
      "Content-Type": "application/json",
      ...(refreshToken ? { Cookie: `wp_refresh=${refreshToken}` } : {}),
    };
  }

  private async handleResponse(response: Response): Promise<any> {
    const text = await response.text();

    if (response.status === 401) {
      if (!this.refreshing) {
        this.refreshing = this.tryRefresh().finally(() => {
          this.refreshing = null;
        });
      }
      const refreshed = await this.refreshing;
      if (refreshed) {
        throw new Error("RETRY");
      }
      await clearTokens();
      throw new Error("Unauthorized");
    }

    let data: unknown = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = { error: text.trim() || "Request failed" };
      }
    }

    if (!response.ok) {
      throw new Error(this.getErrorMessage(data) || "Request failed");
    }
    return data;
  }

  private getErrorMessage(data: unknown): string | null {
    if (!data || typeof data !== "object") return null;
    const record = data as Record<string, unknown>;
    if (typeof record.error === "string") return record.error;
    if (typeof record.message === "string") return record.message;
    return null;
  }

  private async tryRefresh(): Promise<boolean> {
    try {
      const refreshToken = await getRefreshToken();
      if (!refreshToken) return false;

      const response = await fetch(`${this.baseUrl}/api/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `wp_refresh=${refreshToken}`,
        },
      });

      if (!response.ok) return false;

      const text = await response.text();
      let data: unknown = null;
      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          data = null;
        }
      }
      if (data && typeof data === "object" && typeof (data as Record<string, unknown>).accessToken === "string") {
        const accessToken = (data as Record<string, string>).accessToken;
        await saveTokens(accessToken, refreshToken);
        // Save both cookie values so getHeaders() works correctly on retry
        await saveCookieValues(accessToken, refreshToken);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  private async request(method: string, path: string, body?: any): Promise<any> {
    const headers = await this.getHeaders();
    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    try {
      return await this.handleResponse(response);
    } catch (e: any) {
      if (e.message === "RETRY") {
        const freshHeaders = await this.getHeaders();
        const retryResponse = await fetch(`${this.baseUrl}${path}`, {
          method,
          headers: freshHeaders,
          body: body !== undefined ? JSON.stringify(body) : undefined,
        });
        return this.handleResponse(retryResponse);
      }
      throw e;
    }
  }

  async get(path: string): Promise<any> {
    return this.request("GET", path);
  }

  async post(path: string, body?: any): Promise<any> {
    return this.request("POST", path, body);
  }

  async put(path: string, body?: any): Promise<any> {
    return this.request("PUT", path, body);
  }

  async delete(path: string): Promise<any> {
    return this.request("DELETE", path);
  }

  async upload(path: string, formData: FormData): Promise<any> {
    const cookie = await getCookieHeader();
    const headers: Record<string, string> = {};
    if (cookie) {
      headers["Cookie"] = cookie;
    } else {
      const refreshToken = await getRefreshToken();
      if (refreshToken) headers["Cookie"] = `wp_refresh=${refreshToken}`;
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      method: "POST",
      headers,
      body: formData,
    });

    try {
      return await this.handleResponse(response);
    } catch (e: any) {
      if (e.message === "RETRY") {
        const freshCookie = await getCookieHeader();
        const retryHeaders: Record<string, string> = {};
        if (freshCookie) {
          retryHeaders["Cookie"] = freshCookie;
        } else {
          const rt = await getRefreshToken();
          if (rt) retryHeaders["Cookie"] = `wp_refresh=${rt}`;
        }
        const retryResponse = await fetch(`${this.baseUrl}${path}`, {
          method: "POST",
          headers: retryHeaders,
          body: formData,
        });
        return this.handleResponse(retryResponse);
      }
      throw e;
    }
  }
}

export const api = new ApiClient();
