# Lesson 5: SQL and the PG Package

## SQL: Database Schema

### Types

- Numeric stuff: INTEGER, BIGINT, DECIMAL, FLOAT, REAL, SERIAL (and some others). SERIAL values are often used for the primary key of a row.  They are autoincremented so that you won't have duplicates.
- Strings: TEXT, VARCHAR.  
- Dates and times: DATE, TIME, TIMESTAMP
- Binary stuff: BLOB.  Yeah, you can store jpegs in a database.  It might not be the most efficent approach.
- Boolean: BOOLEAN
- More complicated stuff: ARRAY, JSON.  Support varies by database, but PostgreSQL does support these.  There are performance and storage costs.  We won't use these.

This is not a comprehensive list.

Every row has a primary key, some way to uniquely identify that row.  A row may have one or several foreign keys.  The foreign key in a given table is the primary key for a row in another table.

### Constraints

- Type: Column values are always constrained by the type of the column.  You can't put a string in an INTEGER field.
- Non-null: Sometimes, but not always, a value is required for a given column.
- Foreign key: If this one is present, the corresponding value must be the primary key for a row that actually exists in the other table.
- Unique: No duplicate values are allowed in the column.  You would not want duplicate userIds for example.

This is not an exhaustive list.  Example: For INTEGER values, you might configure a maximum or minimum value.

### Normalizing Data

Suppose it's 1968.  A data entry clerk has a big stack of mail for orders.  Each has the user's name, address, product name, product quantity, etc.  So, the clerk could put it in the database as follows:

```
Name, Address, Product, Quantity, Date

Hima Gupta, 14 Cherry Tree Lane, Acme Widget, 17, January 24, 1968
Hima Gupta, 14 Cherry Tree Lane, Spacely Sprocket, 18, January 24, 1968
Hima Gupta, 14 Cherry Tree Lane, Acme Widget, 23, February 1, 1968
...
```

This would be bad.  You would have the same data in the database multiple times.  There will be inconsistencies.  If the customer's address changes, you have to change it many places.  So, instead, data is normalized.  When data is normalized, each fact (the customer name, the address, etc, the product name, etc.) is only stored one place.  This requires multiple tables (Customer, Order, Product, etc.) connected by relations (one-to-many, many-to-many), and the connections between entries are in the foreigh keys.

### Indexes

You can specify various indexes on a table.  Storage size and the cost of INSERT operations goes up.  Searches get faster.

## SQL: Database Operations (SELECT, INSERT, UPDATE, JOIN, etc.)

These are covered pretty well in your exercises.

PostgreSQL is always autocommit.  That means that if a BEGIN hasn't been issued on a connection, each operation is committed as it occurs.  If a BEGIN is issued, no writes are committed until the COMMIT, and the whole sequence can be canceled with a ROLLBACK.

It might seem like you don't need to put SELECT operations inside a BEGIN, COMMIT sequence (a transaction).  This is not correct.  Suppose you are handling a withdrawal from a bank account.  You will do a BEGIN, SELECT, UPDATE, COMMIT.  The SELECT tells you if the account holder has enough money.  If you don't do the SELECT within the transaction, the account balance might change before the UPDATE.  If the account holder doesn't have enough money, you do BEGIN, SELECT, ROLLBACK.  The transaction described here requires SERIALIZABLE isolation level for the datatabase, if it is to be reliable.  That is, the amount in the account is locked as the SELECT occurs, and no changes to that value can occur until the COMMIT.

## Using the PG Package in Your App

1. You'll have a pool of connections, established at startup.  This is for performance.  Establishing a connection is expensive.

2. You need to clean up connections if the app is shut down.  Otherwise the process can hang on exit.  The cleanup is added to your shutdown routine.

3. You won't use `global.tasks` or `global.users` any more.  This information will reside in the database.

4. Most pg operations are async, so you need to use `await` with each.  This means that any request handlers within your controller that use these operations must be declared async.

5. Calls to the database may throw errors.  In your app, this might happen if someone attempts to register as a user with an email that is already registered.  You want to catch the error and send an appropriate status code and message.  This is the only expected error that might be thrown.  But unexpected errors can occur, for two reasons: (a) the database might fail, or (b) you have an error in your code.

6. When making pg calls, do you need to catch errors for the "unexpected" case?  No, you can just let them be thrown to the error handler.  The caller would get back a 500 status code.  But, you need to improve the error handler so that you can fix the problem.  As follows:

    ```js
    console.error("A server error occurred.", err.name, err.message);
    console.error(err.stack); // this one will point to the place where the code failed.
    ```

7. Column names in the database should be snake case, not camel case.  So, for example, `isCompleted` is stored in the database as `is_completed`.  You keep it as `isCompleted` when you receive JSON from the caller, or in your response to the caller, but you convert it when reading/writing values to/from the database.

8. Until now, you have stored the whole object for the logged on user in `global.user_id`.  We still need that global.  You do not want to store the logged on user in the database -- we'll have a different place to store that information.  With the conversion to pg, you store `id` from the user record, as reported by the database at logon and register time, in `global.user_id`.  That gives you the value for `user_id` to use in task operations.

You won't use transactions in your app.  But, suppose you need transactional semantics in the future.  You could do that with pg as follows:

```js
const client = await pool.connect();
let res;
try {
    await client.query("BEGIN");
    res = await client.query("INSERT ...");
    await client.query("COMMIT");
} catch (err) {
    await client.query("ROLLBACK"); // don't leave a transaction in unfinished state
    throw err;
} finally {
    client.release(); // always return the client to the pool, or you will have a leak.
}
```

## Check for Understanding

The TDD for assignment 5b cleans out the test database at the start of the test so that the tests work consistently.  Why might the following fail?

```js
  it("clears the users table", async () => {
    await pool.query("DELETE FROM users;");
  });
  it("clears the tasks table", async () => {
    await pool.query("DELETE FROM tasks;");
  });
  ```

## Introduction to Lesson 6

We make you do the conversion to the database twice.  First, you use the pg package, and write SQL.  But, often, this is not the way it is done for production applications.  Instead, you use an ORM.  ORM stands for Object-Relational Mapping.  The ORM maps between operations on JavaScript objects and operations on SQL tables.  The SQL (in most cases) is composed for you.  The ORM we will use is called Prisma.  You need to learn both methods for database access, raw SQL and the ORM.