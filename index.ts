import nodeFetch from 'node-fetch'

try {
  // tslint:disable-next-line
  fetch
} catch (e) {
  global.fetch = nodeFetch as any
}

export * from './lib/api'
export * from './lib/types'
