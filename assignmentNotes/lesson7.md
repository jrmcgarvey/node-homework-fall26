# Lesson 7: Advanced Prisma ORM Features

In this lesson, you add code to exercise the following ORM capabilities:

- Eager loading / relations: This is the somewhat lame handling of JOIN operations in Prisma 6.
- Aggregation and groupBy: You've practiced this in native SQL.
- Transactions
- Batch operations
- Pagination
- Raw SQL with parameterized queries
- Database schema migration
- Specifying a search filter for tasks
- Sorting support

To do this, you have to extend the capabilities of your app.  The reviset app will return more complicated objects in response to GET requests.  It will also create multiple table entries in response to a single REST request.

## Query Parameters

There are two ways to pass parameters with a REST or HTML request:

- URL parameters
    ```
    GET /api/tasks/342
    ```
    You can pass multiple parameters in this way with a single request.

- Query parameters
    ```
    GET /api/tasks?q=clean&complete=False
    ```
    These are key-value pairs.  Everything in the URL after the `?` is a query parameter, and you can have multiple pairs separated by `&`.  You have to be careful to use only characters that are allowed in a URL.  Express parses the URL and stores the query parameters in `req.query`.

In the assignment, you use query parameters for pagination, sorting, and filtering.

## Copy/Paste with Caution

Most of this assignment involves copy and paste, so that it isn't too hard.  Just be sure that you understand what the code you copy is doing.

## Pagination

Pagination can be done several ways.  One way is to use the SQL OFFSET and LIMIT features.  That's what you'll do, using the Prisma equivalents `skip` and `take`.  The downside is that the pagination can be inconsistent, because the result set may change as pagination occurs.  Some entries may be shown twice or more, and some entries may be skipped.  The alternative is to have a database cursor.  Cursors are not used if there will be much simultaneous access to the database on multiple connections, because the state of the cursor has to be stored in the database, a costly business.

When paginating, you have to return metadata about the pagination state to the caller, along with the data itself.

## Filtering Search Results

Prisma provides a way to invoke the SQL LIKE or ILIKE clauses, using the Prisma equivalent `contains`.

## Compound Objects Returned by a Prisma Query

This is roughly like a JOIN, and JOIN is what is done by Prisma when it issues the actual SQL.  SQL returns a row with data from both joined tables.  Prisma, instead, returns an object with other objects imbedded in it.  For example, you could end up with a user object, where user.tasks is an array of tasks belonging to that user.  Sometimes you use `select` and sometimes `include`, but you are referencing a named relation in the prisma schema.

## Transactions

Transactions in Prisma look like this:

```js
const result = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create(...)
    // other statements
}
```

The code for actual database operations starts with `tx` instead of `prisma`.  At the start of the transaction, Prisma checks out a connection from the pg pool and issues a BEGIN.  There are two ways out of the transaction block: `return` and `throw`.  If a return happens, Prisma does a COMMIT and releases the connection back to the pg pool.  If an error is thrown, Prisma does a ROLLBACK and releases the connection.  You don't code the BEGIN, COMMIT, or ROLLBACK.

Let's consider the banking case.  An account owner is doing a transfer from savings to checking.  Within the transaction, you check to see if there is enough money in savings.  If not, you do a ROLLBACK.  That might be coded as follows:

```js
const transferAmount = xxxx;
const result = await prisma.$transaction(async (tx) => {
    const balance = tx.balance.findUnique(...) // does the account owner have enough money in savings
    if (balance.amount < transferAmount) { // not enough
        const balanceError = new Error("The account doesn't have enough money")
        balanceError.name = "balanceError"; // we give it a name so that the error handler can deal with it.
        throw balanceError; // This will roll back the transaction
    }
    // otherwise proceed with the transfer.
}
```

## Raw SQL in Prisma

You use raw SQL if Prisma does not support the SQL you need, as might be the case for complex joins, HAVING clauses, etc.  Raw SQL in Prisma looks like this:

```js
const users = await prisma.$queryRaw`
  SELECT * FROM "User" 
  WHERE email = ${req.body.email}
`;
```

This looks like string interpolation.  We have said that string interpolation is dangerous for parameters passed to an SQL query, because of the risk of SQL injection.  However, this is tagged string interpolation -- tagged with `$queryRaw`.  Prisma evaluates each of the interpolated strings and sanitizes them so that no SQL injection attack can occur.  Of course, for the simple SQL above, raw SQL would not be necessary.

## Preview of Lesson 8

In lesson 8, we leave databases and SQL behind for a bit, and move on to authentication.  One would not want to store the logged on user in the database, because then you could have only one logged on user.  The logged on user must be associated with the HTTP session somehow.  The HTTP session may be an API call from a server, but we're going to assume this is a browser session, and that there is a browser front end that makes the REST calls to your Node app.

The user should not have to type in credentials with every request.  So, the user logs onto the app, and the app sends back a cookie.  The cookie is http-only (meaning that the front end can't read it), signed, and encrypted.  The signature is provided by your app, so when the cookie comes back with subsequent HTTP requests from the front end, the app can verify the signature.  Finally, the cookie contains enough information to identify the user uniquely, including, in particular, the ID of the user record in the users table.

In addition, various types of security attacks will be discussed, such as Cross Site Request Forgery, Cross Site Scripting, and so on, with protections added into your app for each.
