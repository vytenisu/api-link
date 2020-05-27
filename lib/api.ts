import {
  ALLOWED_REQUEST_METHODS,
  DEFAULT_DETECTED_REQUEST_METHOD,
  IApiConfig,
  EArgDeliveryType,
  IMethodArgs,
  IApiClass,
} from './types'

import {paramCase} from 'param-case'

/**
 * Resolves request and API methods based on default API Link convention
 * @param methodName method name as it was written by API consumer
 * @returns mapped request and API methods
 */
export const resolveMethodByConvention = (methodName: string) => {
  const requestMethod =
    ALLOWED_REQUEST_METHODS.find(method =>
      new RegExp(method.toLocaleLowerCase() + '([^a-z].*)?$').test(methodName),
    ) || DEFAULT_DETECTED_REQUEST_METHOD

  if ((methodName as string).startsWith(requestMethod.toLocaleLowerCase())) {
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
    methodName,
  }
}

/**
 * Serializes arguments to a query which can then be added to URL
 * @param args arguments for API
 * @returns query to be appended to URL
 */
export const getQuery = (args: IMethodArgs) => {
  if (Object.keys(args).length) {
    const query = Object.entries(args)
      .map(
        ([name, value]) =>
          `${encodeURIComponent(name)}=${encodeURIComponent(value)}`,
      )
      .join('&')

    return `?${query}`
  }

  return ''
}

/**
 * Formats method name before using it
 * @param methodName initial method name
 * @returns formatted method name
 */
export const formatMethod = (methodName: string) =>
  methodName
    .split('/')
    .map(name => paramCase(name))
    .join('/')

/**
 * Api Link class
 */
export const Api = (class {
  protected _proxy: any

  constructor(config: IApiConfig = {}) {
    config = {
      baseUrl: '',
      defaultArgsMapper: () => ({}),
      argsDeliveryMapper: requestMethod =>
        requestMethod === 'GET'
          ? EArgDeliveryType.QUERY
          : EArgDeliveryType.BODY,
      argsValueMapper: (...[, , value]) => value,
      requestMethodMapper: resolveMethodByConvention,
      apiMethodFormatter: formatMethod,
      requestBodyMapper: body => JSON.stringify(body),
      requestQueryMapper: query => getQuery(query),
      responseMapper: response => response.json(),
      overrideFetchArgs: (url, requestInit) => ({
        url,
        requestInit,
      }),
      ...config,
      fetchConfig: {
        requestInit: {
          method: null,
          ...(config.fetchConfig?.requestInit ?? {}),
        },
      },
    }

    this._proxy = createProxy.call(this, config, true)
    return createProxy.call(this, config)
  }
} as any) as IApiClass

const createProxy = function (config: IApiConfig, ignoreOverrides = false) {
  return new Proxy(this, {
    get: (target, methodName) => {
      if (!ignoreOverrides) {
        if (!Object.is((this as any)[methodName], undefined)) {
          return (this as any)[methodName].bind(this)
        }
      }

      return async (args: IMethodArgs = {}) => {
        const clonedConfig = cloneConfig(config)

        const {requestInit} = clonedConfig.fetchConfig
        let url = clonedConfig.baseUrl

        const {
          methodName: apiMethodName,
          requestMethod,
        } = clonedConfig.requestMethodMapper(methodName as string, args)

        const mergedArgs = mapValues(
          {
            ...clonedConfig.defaultArgsMapper(
              requestMethod,
              methodName as string,
            ),
            ...args,
          },
          clonedConfig,
          methodName as string,
        )

        requestInit.method = requestMethod
        url += `/${clonedConfig.apiMethodFormatter(apiMethodName)}`

        const bodyArgs = getArgsByDeliveryType(
          mergedArgs,
          methodName as string,
          requestMethod,
          clonedConfig,
          EArgDeliveryType.BODY,
        )

        const queryArgs = getArgsByDeliveryType(
          mergedArgs,
          methodName as string,
          requestMethod,
          clonedConfig,
          EArgDeliveryType.QUERY,
        )

        if (Object.keys(bodyArgs).length) {
          requestInit.body = clonedConfig.requestBodyMapper(bodyArgs) as any
        }

        url += clonedConfig.requestQueryMapper(queryArgs, getQuery)

        const {
          url: fetchUrl,
          requestInit: fetchRequestInit,
        } = clonedConfig.overrideFetchArgs(
          url,
          clonedConfig.fetchConfig.requestInit,
        )

        const response = await fetch(fetchUrl, fetchRequestInit)

        if (!response.ok || response.status !== 200) {
          throw response
        }

        return clonedConfig.responseMapper(response)
      }
    },
  })
}

const cloneConfig = (config: IApiConfig) => ({
  ...config,
  fetchConfig: {
    requestInit: {...config.fetchConfig.requestInit},
  },
})

const mapValues = (
  mergedArgs: IMethodArgs,
  config: IApiConfig,
  methodName: string,
) => {
  for (const argName in mergedArgs) {
    if (mergedArgs.hasOwnProperty(argName)) {
      mergedArgs[argName] = config.argsValueMapper(
        methodName as string,
        argName,
        mergedArgs[argName],
      )
    }
  }

  return mergedArgs
}

const getArgsByDeliveryType = (
  args: IMethodArgs,
  methodName: string,
  requestMethod: string,
  config: IApiConfig,
  argType: EArgDeliveryType,
) => {
  const result: IMethodArgs = {}

  Object.entries(args).forEach(([name, value]) => {
    if (
      config.argsDeliveryMapper(
        requestMethod,
        methodName as string,
        name,
        value,
      ) === argType
    ) {
      result[name] = value
    }
  })

  return result
}
