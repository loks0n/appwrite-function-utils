import { IncomingHttpHeaders } from 'http'

interface QueryParams {
  [key: string]: string
}

interface AppwriteHttpHeaders extends IncomingHttpHeaders {
  'x-appwrite-event'?: string | undefined
  'x-appwrite-user-id'?: string | undefined
}

export interface HttpResponse {
  body: string | Buffer
  statusCode: number
  headers: IncomingHttpHeaders
}

export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
  OPTIONS = 'OPTIONS',
  HEAD = 'HEAD',
}

export enum HttpContentType {
  JSON = 'application/json',
  FORM = 'application/x-www-form-urlencoded',
  XML = 'application/xml',
  OCTET_STREAM = 'application/octet-stream',
  YAML = 'application/x-yaml',
  TEXT = 'text/plain',
  HTML = 'text/html',
  EVENT_STREAM = 'text/event-stream',
  MULTIPART = 'multipart/form-data',
}

export interface HttpRequest {
  bodyRaw: string
  body: any
  headers: AppwriteHttpHeaders
  method: HttpMethod
  host: string
  scheme: 'http' | 'https'
  query: QueryParams
  queryString: string
  port: number
  url: string
  path: string
}

export interface HttpResponseHelpers {
  send: (
    body: string | Buffer,
    statusCode?: number,
    headers?: IncomingHttpHeaders
  ) => HttpResponse
  json: (
    obj: any,
    statusCode?: number,
    headers?: IncomingHttpHeaders
  ) => HttpResponse
  empty: () => HttpResponse
  redirect: (
    url: string,
    statusCode?: number,
    headers?: IncomingHttpHeaders
  ) => HttpResponse
}

export interface Context {
  req: HttpRequest
  res: HttpResponseHelpers
  log: (message: any) => void
  error: (message: any) => void
}

export type Function = (
  context: Context
) => Promise<HttpResponse> | HttpResponse
