import * as fetchMock from 'fetch-mock'
import {Api} from './api'
import {EArgDeliveryType} from './types'

describe('Api', () => {
  afterEach(() => {
    fetchMock.reset()
  })

  it('works without base url', async () => {
    const expected = 'response'
    fetchMock.post('/test', JSON.stringify(expected))
    const api = new Api()
    const response = await api.test()
    expect(response).toBe(expected)
  })

  it('uses base url', async () => {
    const good = 'good'
    const bad = 'bad'
    fetchMock.post('http://localhost:1234/test', JSON.stringify(good))
    fetchMock.post('/test', JSON.stringify(bad))
    const api = new Api({baseUrl: 'http://localhost:1234'})
    const response = await api.test()
    expect(response).toBe(good)
  })

  it('converts method to kebab-case by default', async () => {
    const expected = 'response'
    fetchMock.post('/test-test', JSON.stringify(expected))
    const api = new Api()
    const response = await api.testTest()
    expect(response).toBe(expected)
  })

  it('does not convert slashes into dashes for method names', async () => {
    const expected = 'response'
    fetchMock.post('/test/test', JSON.stringify(expected))
    const api = new Api()
    const response = await api['test/test']()
    expect(response).toBe(expected)
  })

  it('uses default args', async () => {
    const expected = 'response'
    fetchMock.get('/test?test=123', JSON.stringify(expected))

    const api = new Api({
      defaultArgsMapper: (requestMethod, methodName) => {
        if (requestMethod === 'GET' && methodName === 'getTest') {
          return {test: 123}
        } else {
          return {}
        }
      },
    })

    const actual = await api.getTest()
    expect(actual).toBe(expected)
  })

  it('uses method convention for get', async () => {
    const expected = 'get'
    fetchMock.get('/test', JSON.stringify(expected))
    const api = new Api()
    const response = await api.getTest()
    expect(response).toBe(expected)
  })

  it('uses method convention for post', async () => {
    const expected = 'post'
    fetchMock.post('/test', JSON.stringify(expected))
    const api = new Api()
    const response = await api.postTest()
    expect(response).toBe(expected)
  })

  it('uses method convention for put', async () => {
    const expected = 'put'
    fetchMock.put('/test', JSON.stringify(expected))
    const api = new Api()
    const response = await api.putTest()
    expect(response).toBe(expected)
  })

  it('uses method convention for delete', async () => {
    const expected = 'delete'
    fetchMock.delete('/test', JSON.stringify(expected))
    const api = new Api()
    const response = await api.deleteTest()
    expect(response).toBe(expected)
  })

  it('does not alter method name and uses POST if convention is not followed', async () => {
    const expected = 'post'
    fetchMock.post('/posting', JSON.stringify(expected))
    const api = new Api()
    const response = await api.posting()
    expect(response).toBe(expected)
  })

  it('uses query for GET by default', async () => {
    const expected = 'result'
    fetchMock.get('/test?test=123', JSON.stringify(expected))
    const api = new Api()
    const response = await api.getTest({test: 123})
    expect(response).toBe(expected)
  })

  it('uses body for POST, PUT and DELETE by default', async () => {
    const arg = {test: 123}
    const expected = 'result'

    fetchMock.post(
      (url, options) => url === '/test' && options.body === JSON.stringify(arg),
      JSON.stringify(expected),
    )

    fetchMock.put(
      (url, options) => url === '/test' && options.body === JSON.stringify(arg),
      JSON.stringify(expected),
    )

    fetchMock.delete(
      (url, options) => url === '/test' && options.body === JSON.stringify(arg),
      JSON.stringify(expected),
    )

    const api = new Api()
    expect(await api.postTest(arg)).toBe(expected)
    expect(await api.putTest(arg)).toBe(expected)
    expect(await api.deleteTest(arg)).toBe(expected)
  })

  it('uses delivery mapper', async () => {
    const expected = 'result'
    fetchMock.post('/test?test=123', JSON.stringify(expected))

    const api = new Api({
      argsDeliveryMapper: (requestMethod, methodName, argName, value) => {
        if (
          requestMethod === 'POST' &&
          methodName === 'postTest' &&
          argName === 'test' &&
          value === 123
        ) {
          return EArgDeliveryType.QUERY
        } else {
          return EArgDeliveryType.BODY
        }
      },
    })

    const actual = await api.postTest({test: 123})
    expect(actual).toBe(expected)
  })

  it('uses value mapper', async () => {
    const method = 'test'
    const arg = 'arg'
    const value = '123'
    const overridenValue = 'overridenValue'
    const expected = 'result'

    fetchMock.get(
      `/${method}?${arg}=${overridenValue}`,
      JSON.stringify(expected),
    )

    const api = new Api({
      argsValueMapper: (testMethod, testArg, testValue) =>
        testMethod === 'getTest' && testArg === arg && testValue === value
          ? overridenValue
          : value,
    })

    const response = await api.getTest({[arg]: value})
    expect(response).toBe(expected)
  })

  it('uses request method mapper', async () => {
    const expected = 'result'
    fetchMock.put(`/test`, JSON.stringify(expected))

    const api = new Api({
      requestMethodMapper: (methodName) => {
        if (methodName === 'aaa') {
          return {requestMethod: 'put', methodName: 'test'}
        } else {
          return {requestMethod: 'GET', methodName: methodName}
        }
      },
    })

    const response = await api.aaa()
    expect(response).toBe(expected)
  })

  it('uses request body mapper', async () => {
    const expected = 'result'

    fetchMock.post(
      (url, options) => url === '/test' && options.body === 'body',
      JSON.stringify(expected),
    )

    const api = new Api({
      requestBodyMapper: (body: any) => (body?.test === 123 ? 'body' : body),
    })

    const response = await api.test({test: 123})
    expect(response).toBe(expected)
  })

  it('uses request query mapper', async () => {
    const expected = 'result'

    fetchMock.get('/test/123', JSON.stringify(expected))

    const api = new Api({
      requestQueryMapper: (args, getQuery) =>
        args?.test === 123 ? '/123' : getQuery(args),
    })

    const response = await api.getTest({test: 123})
    expect(response).toBe(expected)
  })

  it('uses response mapper', async () => {
    const response = 'response'
    const expected = 'expected'

    fetchMock.post('/test', JSON.stringify(response))

    const api = new Api({
      responseMapper: async (originalResponse) => {
        const data = await originalResponse.text()

        if (data === JSON.stringify(response)) {
          return expected
        } else {
          return response
        }
      },
    })

    const actual = await api.test()
    expect(actual).toBe(expected)
  })

  it('passes requestInit to fetch', async () => {
    const response = 'response'

    fetchMock.post(
      (url, options) => url === '/test' && (options.headers as any)?.x === 'y',
      JSON.stringify(response),
    )

    const api = new Api({fetchConfig: {requestInit: {headers: {x: 'y'}}}})

    const actual = await api.test()
    expect(actual).toBe(response)
  })

  it('uses fetch args override', async () => {
    const expected = 'result'
    fetchMock.get(`/overriden`, JSON.stringify(expected))

    const api = new Api({
      overrideFetchArgs: (url, requestInit) => {
        if (url === '/test' && requestInit.method === 'POST') {
          return {
            url: '/overriden',
            requestInit: {...requestInit, method: 'GET'},
          }
        } else {
          return {url, requestInit}
        }
      },
    })

    const actual = await api.postTest()
    expect(actual).toBe(expected)
  })

  it('rejects promise in case of problem with request', async () => {
    const expected = 'response'
    fetchMock.post('/test', {status: 500, body: JSON.stringify(expected)})
    const api = new Api()

    let error = false

    try {
      await api.test()
    } catch (e) {
      error = true
    }

    expect(error).toBeTruthy()
  })

  it('allows to extend API class and use "this" context', async () => {
    const expected = 'response'

    const CustomApi = class extends Api {
      testA() {
        return expected
      }
      testB() {
        return this.testA()
      }
    }

    const api = new CustomApi()
    const actual = await api.testB()
    expect(actual).toBe(expected)
  })

  it('allows to extend API class and call parent methods', async () => {
    const responseStart = 'start'
    const responseEnd = 'end'
    fetchMock.post('/test', JSON.stringify(responseStart))

    const CustomApi = class extends Api {
      async test() {
        const response = await this._proxy.test()
        return response + responseEnd
      }
    }

    const api = new CustomApi()
    const actual = await api.test()
    expect(actual).toBe(responseStart + responseEnd)
  })
})
