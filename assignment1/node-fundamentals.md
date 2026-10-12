# Node.js Fundamentals

## What is Node.js?

Node.js is an implementation of JavaScript that runs native to the operating system.  That is, instead of running in a sandbox (protected environment) within a browser like Chrome or Safari, it is a runtime environment that may be invoked directly from the command line of the OS.

## How does Node.js differ from running JavaScript in the browser?

JavaScript in the browser has access to the resources of the page, in particular, the DOM.  It can be used to update web page elements dynamically, so as to display information to the user.  It can also make remote API calls.  With Node.js, there is no DOM to interpret or to update.  However, Node can act as the server end of a network connection, can access the local file system, can access process information, and can maintain its own set of secrets for resource access, whereas JavaScript in the browser has no way to store secrets.

## What is the V8 engine, and how does Node use it?

The V8 engine is the runtime core of JavaScript, in both the browser and in Node.  Node calls this engine when performing operations such as API calls with fetch, or when writing to the console with console.log, just as JavaScript browser does, but with a different set of capabilities.  The V8 engine manages the event loop within JavaScript, so that a single threaded program can perform asynchronous operations.

## What are some key use cases for Node.js?

One common use is to implement web serving, perhaps web pages (which may contain their own JavaScript, the latter running the browser and not in Node).  It may also implement REST APIs within the web serving engine, or other kinds of network APIs over non-HTTP protocols.  These APIs may access protected resources of the file system or of a database.  It can be also used to write utility programs to run from the command line.

## Explain the difference between CommonJS and ES Modules. Give a code example of each.

By default, Node uses CommonJS.  The most important difference is the use of `require()` instead of `import` to load functions and values exported from other modules.  For Node, ES modules either are given a file extension of `.mjs` or are specified with `type: "module"`.  ES is the direction, and we need to convert this class to it, but our testing engine, Jest, doesn't work well with ES, so we'd need to substitute a different test engine.

**CommonJS (default in Node.js):**
```js
const fs = require("fs");
```

**ES Modules (supported in modern Node.js):**
```js
import fs from "node:fs";
``` 