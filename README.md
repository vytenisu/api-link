# api-link

Back-end API made easily accessible via auto-generated methods

_by Vytenis Urbonavičius_

This API is an abstraction layer on top of browser _fetch_ API. It allows accessing back-end services by simply calling auto-generated methods.

## Use Case

Let's say there is a REST service which is capable of controlling _devices_. It is capable of retrieving a list of devices by making a request:

```
GET /devices
```

To access this service from front-end in the simplest way possible we can:

```typescript
import {Api} from 'api-link'

...
const api = new Api()
const devices = await api.getDevices()
...
```

Note that _getDevices_ method is auto-generated and it does not need to be explicitly defined. Request method is resolved by convention. By default prefix of the function defines request method to be used. However, should one want to disable this automatic behavior or change the convention to something else - _API Link_ is highly configurable and allows to do so.

## Usage

API Link is exported as a UMD module. When it is not imported but accessed via _window_ instead, it is available under the name of _ApiLink_.

You can find a working example available under _example_ directory in the _api-link_ package.

To launch this example:

- Ensure you have Node.js installed
- Run _server.js_ available under _example_ directory (_node ./example/server.js_)
- Open _./example/client.html_ in a modern browser

Here is a peek at how multiple different API calls are made in the example:

```javascript
const baseUrl = 'http://localhost:3000'
const api = new window.ApiLink.Api({baseUrl})

const makeCalls = async () => {
  responses = {
    getConstant: await api.getConstant(),
    getMirror: await api.getMirror({hello: 'world'}),
    postMirror: await api.postMirror({
      hello: 'world',
      world: 'hello',
    }),
  }
}
```

### Convention

**Important:**
developer has option to disable / change any conventions described below.

By default API method names determine what request method will be used. Following methods are supported:

- GET - when method begins with "get"
- POST - when method begins with "post"
- PUT - when method begins with "put"
- DELETE - when method begins with "delete"

In the above cases prefix is removed from the method name before using it.

Methods are then converted to kebab-case.

If method does not start with one of these prefixes, it is assumed to be "post". It is convenient when one wants to name methods using another verb. For example _syncDevices_ would actually call "_/sync-devices_".

GET requests put arguments to URL query. All other types of requests put arguments to body as a serialized JSON string.

_API Link_ expects response to be sent as JSON.

### Available options

When initializing _Api_, a configuration object can be provided as constructor argument. Here are supported object keys:

- baseUrl - base URL for all instance requests
- fetchConfig - default arguments for browser fetch API
- defaultArgsMapper - hook for injecting default arguments for API calls
- argsDeliveryMapper - hook for overriding logic of how delivery type is applied
- argsValueMapper - hook for overriding argument values
- requestMethodMapper - hook for overriding request and API methods
- apiMethodFormatter - hook for overriding how method names are formatted
- requestBodyMapper - hook for overriding how arguments are serialized for body
- requestQueryMapper - hook for overriding how query arguments are added to URL
- responseMapper - hook for overriding how response is parsed
- overrideFetchArgs - hook for overriding fetch arguments right before execution

Additional documentation can be found under _/docs_ directory inside _API Link_ package.

### Best practices

Before choosing to use _API Link_ one should consider how much configuration and corner-cases would need to be sorted-out in order to make it work for a particular case.

If server does not provide a unified way to reach end-points, using _API Link_ could increase complexity without providing sufficient benefit to justify its usage.

_API Link_ is best when it is used with a tidy and consistent back-end solution.

---

In many cases it might be a good idea to extend _Api_ class provided by _API Link_. There are multiple benefits to this:

- encapsulating configuration within extended class making it very simple to use
- overriding default auto-generated methods and injecting additional functionality before/after calls gives additional flexibility

In order for extension to work properly, it needs to be done in a certain way:

```javascript
class CustomApi extends window.ApiLink.Api {
  constructor() {
    super({baseUrl})
  }

  getDevices() {
    console.log('Injected log before request')
    return this._proxy.getDevices()
  }
}
```

Note that calling _super.getConstant()_ would not work due to the nature of how auto-generated methods are implemented.

---

When dealing with REST services, these services might have a path which accept certain argument as part of the path:

```
/devices/1
```

To support these paths, it is necessary to alter _API Link_ behavior slightly:

```javascript
const api = new Api({
  requestQueryMapper: (args, getQuery) => {
    let query = args.id ? `/${args.id}` : ''
    delete args.id
    query += getQuery(args)
    return query
  },
})
```

This logic would make _API Link_ use _id_ attribute as part of path. So now when API is called, this is going to be the result:

```javascript
api.getDevices({id: 1})
// This calls "/devices/1" - not "/devices?id=1 anymore
```

Another common case is when services have URLs like this:

```
/devices
/devices/1/info
/v2/devices
```

There are multiple ways how to handle such paths:

- If certain sub-path represents "namespaced" end-points, a separate Api instance could be created with _baseUrl_ set to something like "/v1"
- Path can be constructed using _requestMethodMapper_ and _requestQueryMapper_ hooks like this:

```javascript
const api = new Api({
  requestMethodMapper: (methodName, args) => {
    const {requestMethod} = window.ApiLink.resolveMethodByConvention(methodName)

    methodName =
      methodName === 'getDevices' && args.id
        ? `devices/${args.id}/info`
        : methodName

    return {requestMethod, methodName}
  },

  requestQueryMapper: (query, getQuery) => {
    delete query.id
    return getQuery(query)
  },
})
```

Above code would convert path from "/devices?id=123" to "/devices/123/info" when _id_ is provided. Hooks are rather low level to allow maximum flexibility.

---

TypeScript developers will notice that auto-generated methods are not typed. This is because at the moment library has no way of knowing what data types are expected to be used.

Types can be added manually by extending Api class using method described earlier. Ideally, server could be generating definitions which could then be converted to TypeScript interface. However, at this point it is out of scope for _API Link_.
