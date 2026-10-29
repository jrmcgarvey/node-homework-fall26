# Some Review Points for Assignment 4

## Warm Up Question

What's the difference between the two code snippets below, that is, when would they work differently?

```js
// version 1
try {
    // statement 1
    // statement 2
} catch (e) {
    // statement 3
    // statement 4
}
// statement 5
// statement 6
// statement 7
```

```js
// version 2
try {
    // statement 1
    // statement 2
} catch (e) {
    // statement 3
    // statement 4
} finally {
    // statement 5
    // statement 6
}
// statement 7
```

## Quick Summary of Assignment 4

1. Data model

    You always figure this out first.  You needed a title (string) and an isCompleted (boolean).  You also needed an id and a userId, both computed, not given by the caller.  The userId is the email of the logged on user.  So `{ title, isCompleted }` is what should arrive when creating an entry.  `isCompleted` is optional, because your validation will put in a default value.

2. Controller

    Methods to do operations on tasks: create, show, index (get the whole list), update, and deleteTask.

3. Router

    Routes for each of these.  For show, update and deleteTask, you need the id of the task in the URI.  You use a parameter in the route, viz:

    ```
    router.get("/%id", taskController.show);
    ```

    If the caller sends a request like `GET /api/tasks/17`, Express puts the 17 into `req.params.id`.

    **Order matters in your routes.**  Suppose you add support for a `find` endpoint, so that the user can do `GET /api/tasks/find?title=clean*` to find all titles that start with clean.  Then you add the route:

    ```
    router.get("/%id", taskController.show);
    router.get("/find", taskController.find);
    ```

    Will this work?

4. Middleware for authentication check

    The authentication checking middleware looks to see if there is a logged on user.  If not, it sets the status to 401 and sends back a "not authorized" message.  If so, it just calls `next()`.  Be sure you never do both.

    This middleware should be called for protected routes only.  You can do:

    ```js
    app.use("/api/tasks", authMiddleware, taskRouter);
    ```

    How about this alternative?  What's the downside?

    ```js
    app.use("/api/users", userRouter); // public route
    app.use(authMiddleware);
    app.use("/api/tasks", taskRouter); // protected route
    ```

5. Validation

    You use Joi, and set up validation routines to make sure that any added or updated user or task entries comply with the schema you want:

    ```js
    const taskSchema = Joi.object({
        title: Joi.string().trim().min(3).max(30).required(),
        isCompleted: Joi.boolean().default(false).not(null),
    });
    ```

    **Is this enough validation?** Hint: There is a security vulnerability here!

    Anyway, in your controller, you can then do:

    ```js
    const { error, value } = taskSchema.validate(req.body, { abortEarly: false,});
    if (error) {
        return res.status(400).json({
            message: error.message,
        });
    }
    ```

    Which is ok ... but as you have to do this validation multiple places in your code, you are violating DRY.

    Better is this, in your taskController:

    ```js
    if (error) throw error; // where will it go?
    ```

    It goes to your error handler, of course.  So you add a little bit to that function, to give the caller good feedback:

    ```js
    const serverError = async (err, _req, res, next) => {
        if (err.name === "ValidationError") {
            return res.status(400).json(message: err.message);
        }
        // and so on
    }
    ```

6. Authorization
    
    Whenever you operate on data (show, index, update, deleteTask), you need to include the userId in your filter.  A user should not be able to access a different user's data.


## Any questions on Assignment 4?

