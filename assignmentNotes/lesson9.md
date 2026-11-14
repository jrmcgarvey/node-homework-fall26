# Lesson 9: Security

You need to know how to write tests.  In most shops, no provided test means no merge approval for your PR.  In some shops (test driven development), many tests are written first, based on the design spec, and the app code is written to pass the test.  In all shops, the tests you write for your own code will be augmented with tests others write to the spec -- because the code author misses stuff.  Tests should cover edge and failure cases.  Tests should include security tests for authorization and authentication.  Tests should have comprehensive coverarage: Every line of code you write should be exercised by the test suite.

You'll use two packages, Jest and Supertest.  

Jest loads your test file and runs it, returning the results.  In a test file (`something.test.js`) that Jest will run, you have the ability to organize tests into stanzas, to do operations before or after all the tests in a stanza, and to declare tests.  The stanza declarations and the test declarations include statements that explain what is being tested and what should happen.  Within each test, you make an assertion about what you expect the result to be.

Supertest is a tool you load within a Jest test.  It is used when you want to simulate actual network traffic going to your app.  For testing, sometimes you load individual modules from your app and call them.  With Supertest, you don't do that.  Instead you load the whole app, and call it by sending it a simulated network request.

## The parts of a test

- beforeAll and afterAll: either before/after the entire test suite, or, within a stanza, before/after all the tests in the stanza.  (You can also do beforeEach and afterEach.)
- describe: This function declares a stanza, and includes a statement of what will be tested.  You can nest these.
- it: This function declares a test, and includes a statement of what behavior is expected.  Example:
    ```js
    it("should return false if invalid parameters are passed.", async ()=> { ... });
    ```
- expect: This is the assertion.  You usually want only one per test, so that you get a clear statement of what failed or succeeded in that test.  Example:
    ```js
    expect(result).toEqual(7);
    ```
- matchers: `toEqual(), toNotEqual(), toBeDefined(), toBeGreaterThan()`.  There are a bunch. `rejects.toThrow()` is an interesting one.  You expect a call to throw an error, and you can check what error is returned.

The functions `beforeAll`, `afterAll`, `describe`, and `it` each have a parameter which is a function to call.  That function may be declared async, so that you can do await operations within it.  As follows:

```js
// at the top:
// requires, variable declarations, and other initialization

beforeAll(async() => {
    // some prep here
});

describe("testing logon", async() =>{
    it("doesn't let you logon with a bad password", async()=> {
        // some function call here
        // some expect statement to test the result
    });
    it("does let you logon with a good password", async() =>{
        // some function call here
        // some expect statement
    });
});

afterAll(async() => {
    // some cleanup here
});
```

## Testing Express functions and apps

Sometimes you test a function.  You load the function and call it, and see if you get the right stuff back.

Whoa, but wait a minute.  Suppose you are testing a request handler or middleware.  When you call the function, you need to pass req, res, and sometimes next.  How do you do that? You create mock versions of each.  You can add a body, parameters, cookies and so on to req.  The mock res object supports functions like `res.json()` so that the request handler can write the results. You'll use a package called node-mocks-http to build these mocks.  `jest.fn` is used to build a mock next.  Ok, fine, but how do you know that the middleware or request handler is done? It might be async.  It might do a res.json() in a callback.  It might call `next()` or `next(err)`.  We provide a utility routine called `waitForRequestHandlerCompletion(func, req, res)`.  When `res.json()` is called, an event is posted that it catches, and then the `waitFor...` function returns so you can check the mock res object to see what was written.  It also catches any `next()` invocations.  It doesn't catch thrown errors -- you do that in your test.

The advantage of this kind of testing is you can test individual functions within your app.  But you need end-to-end testing too, which is done with Supertest.  Supertest loads your app and returns an agent function, viz:

```js
const agent = request.agent(app);
```

You can pass GET, POST, DELETE, etc. with the appropriate URLS, and with bodies, headers, and cookies as needed.  The Supertest `request` function doesn't keep track of cookies, so you use the agent function instead for your POST, GET, etc. viz:

```js
let result; // we need several it statements for this result, so we declare it here
it("returns 200", async ()=> {  
    result = agent.post("/successCheck").set("content-type", "application/json").send({message: "here goes."});
    expect(result.status).toBe(200);
})
it("reports success", ()=> {
    expect(result.body.message).toEqual("success!"); 
});
```

Of course some requests don't have headers or a body.

## Setting up the tests

- You use the test database.
- You clear the database at the start, so that your tests are repeatable.
- If you are testing the taskController, you need to create user objects first.
- If you are testing the processing of `/api/task` operations with Supertest, you need to do `/api/user/logon` first, with one of the users you created.  (You also need to test that you can't do these operations without being logged on.)
- You also test basic functions like validation.  This is simpler, as you don't need Supertest, as you don't need mock req and res objects, and as these are synchronous calls.

## Shutting down the tests

You need to clean up at the end, or you may have zombie processes.

1. Disconnect from Prisma.
2. If using Supertest, call `server.close()` on your app.

