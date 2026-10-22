# Lesson 4

You are building the back end for a todo list app.  So, in this lesson, you build code to handle more REST requests, for CRUD operations on a tasks.  As for users, the tasks are stored in an in memory array, but this is a temporary makeshift.  In a later lesson, the tasks, like the user registrations, will be stored in a database.

## Data Model

For task entries, you need the following data:

- title
- id (a unique way of identifying a task emtry).  You need this to be able to get/update/delete a specific task entry
- isCompleted.  A boolean to indicate if the task is done.
- userId.  Who owns this task?  No user should be able to do operations on another user's task

When a task is created, the caller does not specify the id.  That's done on the server side, so that each task gets a unique id.  Also, the caller does not specify the userId.  That is set to the email of the logged on user.  (This is, again, a temporary approach.  When we get to SQL, it will be the record ID of the user record in the database.)

Also, when returning the task entry to the caller, you don't return the userId.

## The Controller

Ok, to do CRUD, you need:

- create
- show (get a task by its ID)
- index (get all tasks for the user)
- update
- deleteTask  You don't use delete, which is a reserved word in JavaScript

## Write Some Code (it will be wrong)

You can now create the taskRouter and taskController.

For the create, you take whatever is in the body, and add an id and a userId to it.  (Hmm, you need the body.  Which middleware has to run before the `app.use()` for your task router?)  For the id of the task entry, there is a little utility routine:

```js
const taskCounter = (() => {
  let lastTaskNumber = 0;
  return () => {
    lastTaskNumber += 1;
    return lastTaskNumber;
  };
})();
```

This is just a way to get a strictly incrementing series of numbers.  Can you understand this code?  The value of `taskCounter` is a function, which is defined inside an outer function.  The outer function returns the inner function, and the outer function also keeps the counter.  *Study this a bit.*  This is called a `closure`.  You might need to create a closure for a job interview.

Also, you need to add userId to the object.  The logged on user is stored in global.user_id, so you can set the `userId` of the task entry to the email in this global.

For show, update, and delete, the id of the task entry is needed.  This is to be passed as a parameter in the URL, viz:

```
GET /api/tasks/243
```

You define this route in your router with a `/%id`, which causes the corresponding value to appear in req.params.id as the request is handled.

So, write the code.  You can either run it or not at this point.  But there are some problems.

## Problem 1.  What if there isn't any logged on user?

Then the call should fail.  The caller should get a 401, unauthorized.  This check should happen before any task operations.  You don't want to put the check for logon in each of the taskController functions, so you use middleware.  This is the auth middleware described in the lesson.  Add that into your code.  The auth middleware should run before any protected routes, and all the task routes should be protected.  But, the auth middleware should not run before public routes.  The `/api/users` routes must be public, not protected -- because, otherwise, you couldn't logon or register unless you were already logged on.

So that the auth middleware only runs for the protected routes, you put it in the app.use() statement for those routes.  This is an *authentication* check.

## Problem 2.  What if the stuff in the body is crap?

You don't want to allow that to be written to data storage.  So, for every write, you have to validate what's in the body.  We are using the Joi validation library, and it has a pretty clear syntax -- what object values are required and optional, and what their datatypes must be, and what kinds of values are permitted.  The validation for task update is a little different than that for task create, because the request might just update a subset of the task entry.

If the validation fails, the caller is returned a 400 status code and an appropriate message.

You need validation for the user register operation as well.  You want to ensure a syntactically valid email, a non-trivial password, and a name.

### A thought about validation

In a number of places in your code, you validate, report the error if any, and proceed with the validated value if no error occurs.  Is there a way to tighten this up with less code?

## Problem 3. Read/update/delete operations for entries that don't belong to the logged on user.

Suppose you get a request for task 211.  You find that one in your tasks array, and return it if found.  Correct?  Nope.  Your find() better check that the userId matches the email of the logged on user.  This is an *authorization* check.

If there isn't any entry where both the id and the userId match the necessary values, you should send a 404 status code.  Why not a 403, forbidden?  Well, that conveys the fact that the record exists to a user that does not own that record.  You want to avoid this.  You might have public records that can be read by everyone, but only updated by the administrator, and that would be a good case for a 403.

## Problem 4. Sanitizing what you return

You don't want to send back the userId when sending one or more task entries to the caller.  Remember to take it out.

## Some coding hints

You are going to use find() and filter() on the tasks array.  To sanitize, you can do stuff like:

```js
const { userId: _, ...sanitizedTask } = task
```

To sanitize an array of entries, you use map().

When updating an entry in the task array, it is best to mutate the entry rather than creating a new one, using Object.assign():

```js
Object.assign(task, update)
```

When deleting an entry, you mutate the tasks array with splice().

### A note about mutating objects and arrays in React

You need to be careful about mutation when writing React applications.  React won't render the resulting change, because it won't have kept track of it.  If you want React to render the change, you need to create a new, modified object and store it in the variable you use in your useEffect statements.

## Final big problem: Passwords in plaintext

Never store passwords in plaintext.  Hackers could capture the passwords.  Rogue application administrators could misuse them.

You don't encrypt the passwords.  It wouldn't help. You have to store the encryption key somewhere, and the hacker could capture that.

Instead you hash the passwords.  A cryptographic routine computes 256 bytes of gobbledygook from the password, and stores that.  You can't get the password back.  But, on next logon, you can repeat the hashing to check the password.

Never write your own cryptography.  Use a standard library.  It is very difficult to write hack-proof cryptography.

## A Preview of Lesson 5

Lesson 5 is long and tough.  This is where you learn about SQL.  We are using the Postgres implementation of SQL, which you should have installed on your laptop.  You will learn about all of the SQL verbs, and you'll practice them.

You'll then use the Postgres pg library for Node, and change all of your code to store user and task information in the database, instead of in memory.

Please start this lesson early in the week.  It will take some time.

SQL skills are valuable on the job market.  One can evolve a career focused on data, which might begin by use of SQL, but might progress to data warehouses, extract/transform/load, and other skills.