export interface IFetchInit {
  requestInit?: RequestInit
}

export enum EArgType {
  BODY = 'BODY',
  QUERY = 'QUERY',
}

export type IArgsPlaceMapper = (
  requestMethod: string,
  methodName: string,
  argName: string,
  value: any,
) => EArgType

export type IArgsValueMapper = (
  methodName: string,
  argName: string,
  value: any,
) => any

export type IArgsMethodMapper = (methodName: string) => string

export type IBodyMapper = (body: any) => string

export type IResponseMapper = (response: Promise<Response>) => Promise<any>

export interface IMethodArgs {
  [argName: string]: any
}

export interface IApiConfig {
  baseUrl?: string
  useMethodConvention?: boolean
  fetchConfig?: IFetchInit
  argsPlaceMapper?: IArgsPlaceMapper
  argsValueMapper?: IArgsValueMapper
  argsMethodMapper?: IArgsMethodMapper
  bodyMapper?: IBodyMapper
  responseMapper?: IResponseMapper
}

export const ALLOWED_REQUEST_METHODS = ['GET', 'POST', 'PUT', 'DELETE']
export const DEFAULT_DETECTED_REQUEST_METHOD = 'POST'
export const DEFAULT_STATIC_REQUEST_METHOD = 'GET'

export const resolveRequestType = (methodName: string) =>
  ALLOWED_REQUEST_METHODS.find((method) =>
    new RegExp(method.toLocaleLowerCase() + '([^a-z].*)?$').test(methodName),
  ) || DEFAULT_DETECTED_REQUEST_METHOD

export class Api {
  constructor(config: IApiConfig = {}) {
    config = {
      baseUrl: '',
      useMethodConvention: true,
      argsPlaceMapper: (requestMethod) =>
        requestMethod === 'GET' ? EArgType.QUERY : EArgType.BODY,
      argsValueMapper: (...[, , value]) => value,
      argsMethodMapper:
        config.useMethodConvention !== false
          ? resolveRequestType
          : () => DEFAULT_STATIC_REQUEST_METHOD,
      bodyMapper: (body) => JSON.stringify(body),
      responseMapper: (response) => response.then((r) => r.json()),
      ...config,
      fetchConfig: {
        requestInit: {
          method: null,
          ...(config.fetchConfig?.requestInit ?? {}),
        },
      },
    }

    return new Proxy(this, {
      get: (...[, methodName]) => (options: IMethodArgs = {}) => {
        const clonedConfig = {
          ...config,
          fetchConfig: {
            requestInit: {...config.fetchConfig.requestInit},
          },
        }

        for (let argName in options) {
          if (options.hasOwnProperty(argName)) {
            options[argName] = clonedConfig.argsValueMapper(
              methodName as string,
              argName,
              options[argName],
            )
          }
        }

        const {requestInit} = clonedConfig.fetchConfig
        let url = clonedConfig.baseUrl

        requestInit.method = clonedConfig.argsMethodMapper(methodName as string)

        if (
          config.useMethodConvention &&
          (methodName as string).startsWith(
            requestInit.method.toLocaleLowerCase(),
          )
        ) {
          let actualMethodName = (methodName as string).substr(
            requestInit.method.length,
          )

          if (
            actualMethodName.charAt(0) ===
            actualMethodName.charAt(0).toUpperCase()
          ) {
            actualMethodName =
              actualMethodName.charAt(0).toLocaleLowerCase() +
              actualMethodName.substr(1)

            url += `/${actualMethodName as string}`
          } else {
            url += `/${methodName as string}`
          }
        } else {
          url += `/${methodName as string}`
        }

        const bodyArgs: IMethodArgs = {}

        Object.entries(options).forEach(([name, value]) => {
          if (
            clonedConfig.argsPlaceMapper(
              requestInit.method,
              methodName as string,
              name,
              value,
            ) === EArgType.BODY
          ) {
            bodyArgs[name] = value
          }
        })

        const queryArgs: IMethodArgs = {}

        Object.entries(options).forEach(([name, value]) => {
          if (
            clonedConfig.argsPlaceMapper(
              requestInit.method,
              methodName as string,
              name,
              value,
            ) === EArgType.QUERY
          ) {
            queryArgs[name] = value
          }
        })

        if (Object.keys(bodyArgs).length) {
          requestInit.body = clonedConfig.bodyMapper(bodyArgs) as any
        }

        if (Object.keys(queryArgs).length) {
          const query = Object.entries(queryArgs)
            .map(
              ([name, value]) =>
                `${encodeURIComponent(name)}=${encodeURIComponent(value)}`,
            )
            .join('&')

          url += `?${query}`
        }

        const promise = fetch(url, clonedConfig.fetchConfig.requestInit)

        return clonedConfig.responseMapper(promise)
      },
    })
  }
}
