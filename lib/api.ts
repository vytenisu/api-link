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

export type IRequestMethodMapper = (
  methodName: string,
  config: IApiConfig,
) => {
  requestMethod: string
  apiMethodName: string
}

export type IRequestBodyMapper = (body: any) => string

export type IResponseMapper = (response: Response) => Promise<any>

export interface IMethodArgs {
  [argName: string]: any
}

export interface IApiConfig {
  baseUrl?: string
  useMethodConvention?: boolean
  fetchConfig?: IFetchInit
  argsPlaceMapper?: IArgsPlaceMapper
  argsValueMapper?: IArgsValueMapper
  requestMethodMapper?: IRequestMethodMapper
  requestBodyMapper?: IRequestBodyMapper
  responseMapper?: IResponseMapper
}

export const ALLOWED_REQUEST_METHODS = ['GET', 'POST', 'PUT', 'DELETE']
export const DEFAULT_DETECTED_REQUEST_METHOD = 'POST'
export const DEFAULT_STATIC_REQUEST_METHOD = 'GET'

export const resolveRequestMethod = (
  methodName: string,
  config: IApiConfig,
) => {
  const requestMethod =
    ALLOWED_REQUEST_METHODS.find((method) =>
      new RegExp(method.toLocaleLowerCase() + '([^a-z].*)?$').test(methodName),
    ) || DEFAULT_DETECTED_REQUEST_METHOD

  if (
    config.useMethodConvention &&
    (methodName as string).startsWith(requestMethod.toLocaleLowerCase())
  ) {
    let actualMethodName = (methodName as string).substr(requestMethod.length)

    if (
      actualMethodName.charAt(0) === actualMethodName.charAt(0).toUpperCase()
    ) {
      actualMethodName =
        actualMethodName.charAt(0).toLocaleLowerCase() +
        actualMethodName.substr(1)

      methodName = actualMethodName
    }
  }

  return {
    requestMethod,
    apiMethodName: methodName,
  }
}

export interface IApiClass extends Function {
  new (config?: IApiConfig): any
}

export const Api = class {
  constructor(config: IApiConfig = {}) {
    config = {
      baseUrl: '',
      useMethodConvention: true,
      argsPlaceMapper: (requestMethod) =>
        requestMethod === 'GET' ? EArgType.QUERY : EArgType.BODY,
      argsValueMapper: (...[, , value]) => value,
      requestMethodMapper:
        config.useMethodConvention !== false
          ? resolveRequestMethod
          : (apiMethodName) => ({
              requestMethod: DEFAULT_STATIC_REQUEST_METHOD,
              apiMethodName,
            }),
      requestBodyMapper: (body) => JSON.stringify(body),
      responseMapper: (response) => response.json(),
      ...config,
      fetchConfig: {
        requestInit: {
          method: null,
          ...(config.fetchConfig?.requestInit ?? {}),
        },
      },
    }

    return new Proxy(this, {
      get: (...[, methodName]) => async (options: IMethodArgs = {}) => {
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

        const {apiMethodName, requestMethod} = clonedConfig.requestMethodMapper(
          methodName as string,
          clonedConfig,
        )

        requestInit.method = requestMethod
        url += `/${apiMethodName}`

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
          requestInit.body = clonedConfig.requestBodyMapper(bodyArgs) as any
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

        const response = await fetch(url, clonedConfig.fetchConfig.requestInit)

        if (!response.ok || response.status !== 200) {
          throw response
        }

        return clonedConfig.responseMapper(response)
      },
    })
  }
} as IApiClass
