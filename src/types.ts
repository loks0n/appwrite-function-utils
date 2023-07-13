import { IncomingHttpHeaders } from 'http'

interface QueryParams {
  [key: string]: string
}

interface AppwriteHttpHeaders extends IncomingHttpHeaders {
  'x-appwrite-event'?: string | undefined
  'x-appwrite-user-id'?: string | undefined
}

interface HttpRequest {
  bodyString: string
  body: any
  headers: AppwriteHttpHeaders
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD'
  host: string
  scheme: 'http' | 'https'
  query: QueryParams
  queryString: string
  port: number
  url: string
  path: string
}

interface HttpResponse {
  body: string | Buffer
  statusCode: number
  headers: IncomingHttpHeaders
}

interface HttpResponseHelpers {
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

interface Context {
  req: HttpRequest
  res: HttpResponseHelpers
  log: (message: any) => void
  error: (message: any) => void
}

export type Function = (
  context: Context
) => Promise<HttpResponse> | HttpResponse
