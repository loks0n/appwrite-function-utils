import {
  Context,
  Function,
  HttpContentType,
  HttpMethod,
  HttpResponse,
} from './types'
import { pathToRegexp } from 'path-to-regexp'

export type RouterConfig = {
  routes: {
    path: string
    methods?: HttpMethod[]
    contentTypes?: HttpContentType[]
    handler: Function
  }[]
  exception: {
    notFound: Function
    methodNotAllowed: Function
    notAcceptable: Function
    server: Function
  }
}

const defaultConfig: RouterConfig = {
  routes: [],
  exception: {
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
  },
}

export function router(config: RouterConfig) {
  config = {
    ...defaultConfig,
    ...config,
  }

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
