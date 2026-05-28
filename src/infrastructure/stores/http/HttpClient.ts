import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

export class HttpClient {
  private readonly axios: AxiosInstance;

  constructor(baseURL: string, config: AxiosRequestConfig = {}) {
    this.axios = axios.create({ baseURL, timeout: 10_000, ...config });
  }

  async get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
    const { data } = await this.axios.get<T>(url, { params });
    return data;
  }

  async post<T>(url: string, body: unknown): Promise<T> {
    const { data } = await this.axios.post<T>(url, body);
    return data;
  }
}
