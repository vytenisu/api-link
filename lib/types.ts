import {getQuery as getQueryMethod} from './api'

/**
 * Default arguments for browser fetch API
 */
export interface IFetchInit {
  /**
   * Request init argument accepted by browser fetch API
   */
  requestInit?: RequestInit
}

/**
 * Argument delivery types when performing a request
 */
export enum EArgDeliveryType {
  /**
   * Argument delivery as body of request
   */
  BODY = 'BODY',

  /**
   * Argument delivery as query parameters
   */
  QUERY = 'QUERY',
}

/**
 * Hook for overriding logic of how delivery type is applied
 * @param requestMethod request method (GET, POST, PUT, DELETE)
 * @param methodName API method name
 * @param argName API argument name
 * @param value API argument value
 * @returns resolved delivery type
 */
export type IDeliveryMapper = (
  requestMethod: string,
  methodName: string,
  argName: string,
  value: any,
) => EArgDeliveryType

/**
 * Hook for overriding argument values
 * @param methodName API method name
 * @param argName API argument name
 * @param value API argument value
 * @returns mapped API argument value
 */
export type IArgsValueMapper = (
  methodName: string,
  argName: string,
  value: any,
) => any

/**
 * Hook for overriding request and API methods
 * @param methodName API method name
 * @param args object of arguments passed to API Link method
 * @returns mapped request and API methods
 */
export type IMethodMapper = (
  methodName: string,
  args: IMethodArgs,
) => {
  /**
   * Request method (GET, POST, PUT, DELETE)
   */
  requestMethod: string

  /**
   * API method name
   */
  methodName: string
}

/**
 * Hook for overriding how method names are formatted
 * @param methodName API method name before altering
 * @results altered method name
 */
export type IMethodFormatter = (methodName: string) => string

/**
 * Hook for overriding how arguments are serialized for body
 * @param args API arguments for body before serialization
 * @returns serialized body
 */
export type IRequestBodyMapper = (args: {[name: string]: any}) => string

/**
 * Hook for overriding how query argument are serialized for URL
 * @param args API query arguments before preparing a query string
 * @param getQuery helper method for generating default query string
 * @returns prepared query
 */
export type IRequestQueryMapper = (
  args: {[name: string]: any},
  getQuery: typeof getQueryMethod,
) => string

/**
 * Hook for overriding how response is parsed
 * @param response browser fetch API response
 * @returns promise of mapped response
 */
export type IResponseMapper = (response: Response) => Promise<any>

/**
 * Hook for injecting default arguments for API calls
 * @param requestMethod request method (GET, POST, PUT, DELETE)
 * @param methodName API method name
 * @returns default arguments
 */
export type IDefaultArgsMapper = (
  requestMethod: string,
  methodName: string,
) => IMethodArgs

/**
 * Hook for overriding fetch arguments right before execution
 * @param url URL to be used for browser fetch API
 * @param requestInit additional options for browser fetch API
 * @returns mapped arguments for browser fetch API
 */
export type IOverrideFetchArgs = (
  url: string,
  requestInit: RequestInit,
) => {url: string; requestInit: RequestInit}

/**
 * Arguments of auto-generated API method
 */
export interface IMethodArgs {
  [argName: string]: any
}

/**
 * Configuration of API Link
 */
export interface IApiConfig {
  /**
   * Base URL for all instance requests
   */
  baseUrl?: string

  /**
   * Default arguments for browser fetch API
   */
  fetchConfig?: IFetchInit

  /**
   * Pass all method arguments inside "args" key of an object
   * Note that "GET" request and query arguments become invalid in such case
   */
  multipleMethodArgs?: boolean

  /**
   * Hook for injecting default arguments for API calls
   */
  defaultArgsMapper?: IDefaultArgsMapper

  /**
   * Hook for overriding logic of how delivery type is applied
   */
  argsDeliveryMapper?: IDeliveryMapper

  /**
   * Hook for overriding argument values
   */
  argsValueMapper?: IArgsValueMapper

  /**
   * Hook for overriding request and API methods
   */
  requestMethodMapper?: IMethodMapper

  /**
   * Hook for overriding how method names are formatted
   */
  apiMethodFormatter?: IMethodFormatter

  /**
   * Hook for overriding how arguments are serialized for body
   */
  requestBodyMapper?: IRequestBodyMapper

  /**
   * Hook for overriding how query arguments are added to URL
   */
  requestQueryMapper?: IRequestQueryMapper

  /**
   * Hook for overriding how response is parsed
   */
  responseMapper?: IResponseMapper

  /**
   * Hook for overriding fetch arguments right before execution
   */
  overrideFetchArgs?: IOverrideFetchArgs
}

/**
 * Generated API Class
 */
export type IApiClass = new (config?: IApiConfig) => {
  [name: string]: any
  _proxy: {[name: string]: any}
}

/**
 * Supported request methods
 */
export const ALLOWED_REQUEST_METHODS = ['GET', 'POST', 'PUT', 'DELETE']

/**
 * Default request method
 */
export const DEFAULT_DETECTED_REQUEST_METHOD = 'POST'
