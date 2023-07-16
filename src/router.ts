import {
  Context,
  Function,
  HttpContentType,
  HttpMethod,
  HttpResponse,
} from './types'
import { pathToRegexp } from 'path-to-regexp'

type RouteConfig = {
  path: string
  methods?: HttpMethod[]
  contentTypes?: HttpContentType[]
  handler: Function
}

type ExceptionConfig = {
  notFound: Function
  methodNotAllowed: Function
  notAcceptable: Function
  server: Function
}

type RouterConfig = {
  routes: RouteConfig[]
  exception: ExceptionConfig
}

type PartialRouterConfig = {
  routes?: RouteConfig[]
  exception?: Partial<ExceptionConfig>
}

const defaultExceptions: ExceptionConfig = {
  notFound: (context) => {
    return context.res.json('Not found', 404)
  },
  methodNotAllowed: (context) => {
    return context.res.json('Method not allowed', 405)
  },
  notAcceptable: (context) => {
    return context.res.json('Content type not acceptable', 406)
  },
  server: (context) => {
    return context.res.json('Internal server error', 500)
  },
}

export function router(userConfig: PartialRouterConfig) {
  const config = {
    ...userConfig,
    exception: {
      ...defaultExceptions,
      ...userConfig.exception,
    },
  } as RouterConfig

  return (context: Context): HttpResponse | Promise<HttpResponse> => {
    const matchedPaths = config.routes.filter((route) => {
      return pathToRegexp(route.path).test(context.req.path)
    })

    if (matchedPaths.length === 0) {
      return config.exception.notFound(context)
    }

    const method = context.req.method.toUpperCase() as HttpMethod
    const methodAllowedPaths = matchedPaths.filter((route) => {
      return !route.methods || route.methods.includes(method)
    })

    if (methodAllowedPaths.length === 0) {
      return config.exception.methodNotAllowed(context)
    }

    const contentType =
      (context.req.headers['content-type'] as HttpContentType) ||
      HttpContentType.JSON
    const contentTypeRoute = methodAllowedPaths.find((route) => {
      return !route.contentTypes || route.contentTypes.includes(contentType)
    })

    if (!contentTypeRoute) {
      return config.exception.notAcceptable(context)
    }

    try {
      return contentTypeRoute.handler(context)
    } catch (err) {
      return config.exception.server(context)
    }
  }
}
