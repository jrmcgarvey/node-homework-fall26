# Lesson 3

## The story so far

### HTTP

1.  We're using HTTP protocol.  A requester (browser or app) sends an HTTP request.  It has
    - A verb or method (GET, POST, PATCH, PUT, DELETE, some others)
    - A URL (including a path, sometimes parameters, and sometimes a query string)
    - headers (including the data type for the body, if any, and also cookies)
    - for some requests, a body

2. A response will contain
   - status code (200, 404, etc)
   - headers
   - often, a body

3. If no response comes back, the caller times out

### Express

Express listens on the socket for inbound HTTP requests.  When it gets one, it parses it, and passes it on to any configured middleware and request handlers.  (Your controllers are request handlers.)  You configure your express app with an ordered chain of middleware and requst hander functions that are to be called.  Each is called only if the pattern (method and path, or maybe just path) matches.  (Some middleware won't have a pattern, so those functions are always called.)  Each function is called with a req object (all the stuff from the request) and a response object (which is how the response is sent.)  The middleware functions are also passed a next parameter, which is how each links to the next function in the chain.

Some common properties of the req object:

- req.method
- req.headers
- req.cookies (maybe ... why would this be missing?)
- req.params (if any)
- req.query (if any)
- req.body (maybe ... why would this be missing?)
- req.path

If no pattern is matched, the not-found handler gets called.  This is at the end of the chain, but berfor the error handler.

## Middleware

Middleware happens in the middle -- after the request comes in, but before the response handler is invoked.  Each middleware function is called *in order*.  That is, if a request handler depends on prior processing by middleware, that middleware must be before the request handler in the chain.

There are two ways to insert middleware into the chain.  What are they?

There are many kinds of bundled middleware, like express.json(...) and others for cookie parsing, session data, security protections, and the like.  There is also custom middleware, which you write for your app.

Middleware is called with parameters req, res, and next.  Message handlers are called with parameters req and res -- and (rarely) next.  Req conveys the method, path, and other stuff from the request.  It may also have req.body -- but only if parser middleware, such as express.json(...), has already been called.

Each of these is only called if the pattern matches, which may be any pattern, a path, or a method plus a path.

The error handler, at the end of the chain, has 4 parameters: err, req, res, next.  This is how Express knows it is an error handler.

*Middleware* must do one of the following:
- send a message (res.send() or res.json()).  You probably want to set the status code too.
- throw an error

Middleware must NOT do several of these for one invocation.  Make sure your code path only does one of these, depending on the conditional logic.  If it sends a message and then calls next(), a request handler will then try to send a message, and that will cause an error to be thrown, something about "response headers already sent".  Watch for this one!  You will see it at some point, and now you know what causes it.

*Request handlers* must do one of the following (but not both):
- send a message
- throw an error

The *error handler* must send a message.

Special case: You can't throw an error from middleware or a request hander from inside a callback. That would crash the server.  You call next(err) instead of throwing the error (or allowing it to be thrown).  You call next(err) instead.  If you need next(err) inside a request handler, you specify req, res, next as the parameters for that request handler.

## Time consuming operations

You can do time consuming operations in middleware or request handlers.  Suppose you have to get data from a database.  You could do it this way:

```js
const requestHandler = {(req, res) => 
  const dataObj = getDataSync()
  res.status(200).json(dataObj)
}
```

Well, this is pretty bad.  While you are getting the data, the caller waits, because you haven't responded.  But, because you haven't returned from the request handler, the whole app waits.  All your users wait.  The app won't start processing the next request until the return from the request handler (remember, JavaScript is single threaded!).  Your application will be very slow.  It will not scale.

Fortunately, you have a nice async call you can use instead:

```js
const requestHandler = async {(req, res) =>
    const dataObj = await getData()
    res.status(200).json(dataObj)
}
```

Ok, note first: You can declare your middleware and response handlers to be async.  That works fine in Express.

Now, who waits in this case? The original requester waits ... but not the other users.  As soon as the await statement is reached, `getData()` is dispatched and the function returns so that the next message can be processed.

What happens if getData() throws an error?  In the case above, the error hander catches it.  However, the error handler might not convey a meaningful error message back for some possible events.  So, you can do:

```js
const requestHandler = async {(req, res) =>
    const dataObj 
    try {
        dataObj await getData()
    } catch (err) {
        return res.status(500).json({ message: "Oops, an error calling getData()", error: err})
    }
    res.status(200).json(dataObj)
}
```

Question: Why do you need the `return` above?

## Best practices for status and errors

Use the appropriate status code for the situation:

[http status codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status)

Don't send stack traces and the like to the caller!  Log them instead!  If an unexpected error happens, you *should* log the error and the stack trace, so that you can fix your program error or otherwise correct the situation.