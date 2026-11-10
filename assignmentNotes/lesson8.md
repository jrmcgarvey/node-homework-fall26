# Lesson 8: Security

## Security Introduction

Here are some basic facts about security that every software developer should know:

1. Security is hard.  It is easy to make mistakes.  No developer should create their own cryptography or security techniques.  Use established libraries and security approaches developed by experts.

2. Every developer needs to learn how to make their code secure.  Sometimes you will turn to experts, but there aren't enough security experts in the world to review/correct all the code that is developed.

3. Security vunerabilities are very common.  This site [OWASP Top 10](https://top10.owasp.org/2025/) lists the current biggies.  If an app you develop has a security exposure, you are legally required to disclose this promptly.  In some cases, you have to go public with the information, by publishing it [here:](https://www.cve.org/).

## Fixing Authentication

As you know, we have a teensy weensy security problem in the app.  The user_id is a global.  That means that when a user logged in, any other user that accesses the app accesses all the first user's stuff.

How to fix this?  Well, this is the back end.  Maybe we could just fix the problem in the React front end, configuring certain secrets and the like.  The sad story, however, is:

**You can't fix authentication on the front end.**

Everything in the front end is public information, all loaded into the browser.  Only the back end has a private store.  Only the back end can have secrets.

## How do we fix this?

There are two widely used approaches, and one of them is wrong.  The wrong approach is for the user to log in, and for the back end to provide the front end with a secure token that the front end stores in session storage.  This is bad, because cross site scripting attacks are common, and front ends are often vulnerable.  Therefore, an XSS script could capture the token and pass it to an attacker, who could reuse it to gain access to data.

The right way: This is really the only good approach.  The token is set by the back end on the HTTP session as an HTTP only cookie.  That means that no client side JavaScript can gain access.  However, by specifing credentials: "include" on subsequent REST requests, the client can send the token, so the user does not have to log in with each request.  There are various means to protect the token, such as making sure that, in production, it is never sent except on an HTTPS (SSL protected) connection.

## The downside to cookie credentials

But, there's a downside.  Suppose, while the user is logged into your app, they open another tab and, in that tab, they open an attacker's site.  That site includes JavaScript that sends a POST request to your back end, and specifies credentials: "include".  Unless additional protections are present, the request (maybe a large transfer of funds) is honored by your app.

Browsers have a "same-origin" policy.  Suppose your app is at goodurl.net.  The browser won't let the app loaded from attacker.ru read any data from goodurl.net.  So CRSF attacks are blind.  The attacker can't read the response, but can still do the POST operation.  

There are two levels of protection:

1. CORS (Cross Origin Resource Sharing).  The back end is configured with rules that say which front end URLS are permitted to make which requests.  Before any front end request is sent to the back end, the browser checks by sending a "pre-flight" request.  You could watch these using your browser developer tools -- but we don't get to a discussion of CORS in this class.

2. However, some requests can be sent in "no-CORS" mode, including some POST operations.  Another level of protection is needed.  The standard fix is to send a CSRF token (random gobbledygook) to the front end twice, once in the payload when the user logs in, and once inside the token in the HTTP-only cookie.  This CSRF token is then sent with every subsequent request in an HTTP header, and the back end checks that that header matches what is in the cookie.  No CSRF attacker can get the CSRF token to put in the header.

## The other downside to cookies

Cookies only work for browser front ends.  For server to server connection, API keys are often used.  The requesting server that calls your API can store this key securely.

## JSON Web Tokens

A JSON Web Token is a small JSON document with a digital signature.  Only the possesor of the secret can create a valid signature.  The signature of the JWT is checked for every request.  The JWT also contains the user ID, the CRSF token, an expiry timestamp, and sometimes a little other stuff.  But cookies should stay small, typically less than 1k.

## Other attacks

1. Injection attacks: The caller's request has JavaScript or SQL or other code that is executed with the data is used. To attack your app, such code might be embedded in the user's name or the task title.

2. Denial of service: The caller drives too many requests so that other users can't access the server, or sends poorly formed requests that cause the server to fail.

3. Inappropriate access: The caller sends requests that should not be honored, but there is some hole in the back end.

You will add various pieces of middleware to enable authentication and to prevent attacks.

For production applications, you'd need a package called CORS. This is needed when you have a front end deployed to the cloud, on a different URL from your back end. You'd need a cross origin resource sharing configuration on the back end in order to make things work. We decided that CORS was deep water for this class.

## Packages you'll use

- cookie-parser: Parses the cookie header as it comes in, so that it is in the `req` object
- jsonwebtoken: builds the signed JSON token, or validates the token received with each request.  This requires a secret key.

- helmet: This adds some headers to advise the browser on which operations are allowed.  The amount of protection it provides for REST back ends is limited.
- express-xss-sanitizer: Strips out JavaScript from inbound data to prevent XSS attacks.  You could add code that calls this library for each outbound request as well, in case stored data has imbedded XSS, but we won't go that far.
- express-rate-limit: limits the rate of inbound requests from specific endpoints, to prevent a denial of service attack.

## Implementation Steps

1. Configure the necessary `cookie-parser` middleware.  Also, create a secret key for signing JWTs and for verifying them, and store it in the .env file.

2. When the user registers or logs in, create the signed JWT and set it as a cookie.

3. Replace the current middleware that uses the global user ID to check whether a user is logged on.  New middleware will instead check for the JWT in the cookie, validate it, and store the user ID as stored in the cookie.  You store the user information in req.user, in particular req.user.id.

4. Change task methods to reference req.user.id instead of global.user_id.

5. When the user logs off, clear the cookie.

## A preview of assignment 9

Assignment 9 is about testing. Your kindly mentors have provided TDDs for each step of your app development.  You need to know how to write such tests.  We use a tool called Jest.  Sometimes the tests issue direct calls to your modules.  More complete end-to-end testing is done by actually running your app and sending it simulated HTTP requests, using a package called Supertest (wich is invoked from Jest).

Lesson 9 is a challenging lesson, because there are dozens of tests to write.  Start early!

To get a feel for what tests look like, have a look at the modules in the tdd directory of your homework repository.
