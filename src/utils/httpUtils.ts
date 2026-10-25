import { APIRequestContext, APIResponse, request } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { logger } from './logger';

export enum ContentType {
  JSON = 'application/json',
  FORM_URLENCODED = 'application/x-www-form-urlencoded',
  MULTIPART = 'multipart/form-data',
  TEXT = 'text/plain',
  XML = 'application/xml',
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export type ResponseType = 'auto' | 'json' | 'text' | 'buffer';

const MIME_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.csv': 'text/csv',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain',
  '.json': 'application/json',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

export function mimeTypeOf(filePath: string): string {
  return MIME_TYPES[path.extname(filePath).toLowerCase()] ?? 'application/octet-stream';
}

/** A file (from disk or memory) to send as a multipart part. */
export interface FilePart {
  /** Form field name, e.g. "file" */
  field: string;
  /** Path on disk. Either filePath or buffer must be given. */
  filePath?: string;
  buffer?: Buffer;
  fileName?: string;
  mimeType?: string;
}

export interface RequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean>;
  /** Body for JSON / text / xml requests. */
  body?: unknown;
  /** Key/values for application/x-www-form-urlencoded. */
  form?: Record<string, string | number | boolean>;
  /** Files for multipart/form-data. */
  files?: FilePart[];
  /** Extra text fields sent alongside files in multipart/form-data. */
  fields?: Record<string, string | number | boolean>;
  /** Defaults to JSON (or MULTIPART when files are provided, FORM_URLENCODED when form is provided). */
  contentType?: ContentType | string;
  responseType?: ResponseType;
  timeout?: number;
  failOnStatusCode?: boolean;
}

export interface ApiResponse<T = unknown> {
  status: number;
  statusText: string;
  ok: boolean;
  headers: Record<string, string>;
  body: T;
  durationMs: number;
  raw: APIResponse;
}

export interface HttpUtilsOptions {
  baseURL?: string;
  defaultHeaders?: Record<string, string>;
  authToken?: string;
  timeout?: number;
  ignoreHTTPSErrors?: boolean;
}

export class HttpUtils {
  private authToken?: string;

  constructor(
    private readonly ctx: APIRequestContext,
    private readonly defaultHeaders: Record<string, string> = {},
    authToken?: string,
  ) {
    this.authToken = authToken || undefined;
  }

  /** Create a standalone client (own request context). Remember to call dispose(). */
  static async create(options: HttpUtilsOptions = {}): Promise<HttpUtils> {
    const ctx = await request.newContext({
      baseURL: options.baseURL,
      timeout: options.timeout ?? 30_000,
      ignoreHTTPSErrors: options.ignoreHTTPSErrors ?? false,
    });
    return new HttpUtils(ctx, options.defaultHeaders, options.authToken);
  }

  /** Wrap Playwright's built-in `request` fixture. */
  static fromContext(ctx: APIRequestContext, options: Pick<HttpUtilsOptions, 'defaultHeaders' | 'authToken'> = {}): HttpUtils {
    return new HttpUtils(ctx, options.defaultHeaders, options.authToken);
  }

  setAuthToken(token?: string): void {
    this.authToken = token || undefined;
  }

  async dispose(): Promise<void> {
    await this.ctx.dispose();
  }

  // ---- HTTP verbs -------------------------------------------------------

  get<T = unknown>(url: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    return this.send<T>('GET', url, options);
  }

  post<T = unknown>(url: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    return this.send<T>('POST', url, options);
  }

  put<T = unknown>(url: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    return this.send<T>('PUT', url, options);
  }

  patch<T = unknown>(url: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    return this.send<T>('PATCH', url, options);
  }

  delete<T = unknown>(url: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    return this.send<T>('DELETE', url, options);
  }

  /** Convenience: multipart upload of one or more files (image, excel, csv, pdf, ...). */
  upload<T = unknown>(
    url: string,
    files: FilePart | FilePart[],
    options: Omit<RequestOptions, 'files'> & { method?: 'POST' | 'PUT' | 'PATCH' } = {},
  ): Promise<ApiResponse<T>> {
    const { method = 'POST', ...rest } = options;
    return this.send<T>(method, url, { ...rest, files: Array.isArray(files) ? files : [files] });
  }

  // ---- core -------------------------------------------------------------

  async send<T = unknown>(method: HttpMethod, url: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const contentType = this.resolveContentType(options);
    const headers = this.buildHeaders(contentType, options.headers);

    const requestOptions: Parameters<APIRequestContext['fetch']>[1] = {
      method,
      headers,
      params: options.params,
      timeout: options.timeout,
      failOnStatusCode: options.failOnStatusCode ?? false,
    };

    if (contentType === ContentType.MULTIPART) {
      // Do NOT set Content-Type manually: Playwright adds it together with the boundary.
      delete headers['Content-Type'];
      requestOptions.multipart = this.buildMultipart(options);
    } else if (contentType === ContentType.FORM_URLENCODED) {
      requestOptions.form = options.form ?? {};
    } else if (options.body !== undefined) {
      requestOptions.data =
        contentType === ContentType.JSON || typeof options.body !== 'string'
          ? (options.body as object)
          : options.body;
    }

    logger.debug(`--> ${method} ${url}`, options.params ?? '');
    const started = Date.now();
    const raw = await this.ctx.fetch(url, requestOptions);
    const durationMs = Date.now() - started;
    logger.info(`${method} ${url} -> ${raw.status()} (${durationMs}ms)`);

    const body = (await this.parseBody(raw, options.responseType ?? 'auto')) as T;
    return {
      status: raw.status(),
      statusText: raw.statusText(),
      ok: raw.ok(),
      headers: raw.headers(),
      body,
      durationMs,
      raw,
    };
  }

  // ---- helpers ----------------------------------------------------------

  private resolveContentType(options: RequestOptions): ContentType | string {
    if (options.contentType) return options.contentType;
    if (options.files?.length) return ContentType.MULTIPART;
    if (options.form) return ContentType.FORM_URLENCODED;
    return ContentType.JSON;
  }

  private buildHeaders(contentType: ContentType | string, extra: Record<string, string> = {}): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: 'application/json, text/plain, */*',
      'Content-Type': contentType,
      ...this.defaultHeaders,
      ...extra,
    };
    if (this.authToken && !headers.Authorization) headers.Authorization = `Bearer ${this.authToken}`;
    return headers;
  }

  private buildMultipart(options: RequestOptions) {
    const parts: Record<string, string | number | boolean | { name: string; mimeType: string; buffer: Buffer }> = {
      ...(options.fields ?? {}),
    };
    for (const f of options.files ?? []) {
      if (!f.buffer && !f.filePath) throw new Error(`FilePart "${f.field}" needs filePath or buffer`);
      const name = f.fileName ?? (f.filePath ? path.basename(f.filePath) : f.field);
      parts[f.field] = {
        name,
        mimeType: f.mimeType ?? mimeTypeOf(name),
        buffer: f.buffer ?? fs.readFileSync(path.resolve(f.filePath as string)),
      };
    }
    return parts;
  }

  private async parseBody(res: APIResponse, type: ResponseType): Promise<unknown> {
    if (type === 'buffer') return res.body();
    if (type === 'text') return res.text();
    if (type === 'json') return res.json();
    const ct = res.headers()['content-type'] ?? '';
    const text = await res.text();
    if (text === '') return null;
    if (ct.includes('json')) {
      try {
        return JSON.parse(text);
      } catch {
        return text;
      }
    }
    return text;
  }
}
