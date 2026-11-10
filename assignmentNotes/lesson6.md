# Lesson 6: Using an Object-Relational Mapper (ORM)

In this lesson and assignment, you learn to use the Prisma ORM, instead of writing SQL and passing it to the pg package.

Advantages of an ORM:

- Your code looks more object-oriented, more friendly.
- The ORM figures out the SQL for you.
- The ORM can help if you need to convert support to a different database implementation: PostgreSQL, MySQL, Maria, MSSQL, and even MongoDB.  Note: MongoDB support was dropped for Prisma 7 (although it will eventually be restored.)
- The Prisma ORM provides friendly schema management.  If you have to do schema management using only the pg package, you have to write code to check whether a given schema version is in place, and to migrate to the new version, or to roll the schema back to a given level.

Disadvantages of an ORM:

- You don't learn SQL if you only use the ORM.
- You have to check whether the ORM does the SQL you really want.
- Sometimes the ORM won't do the SQL you want, and you have to write raw SQL and pass it to the ORM.  The Prisma 6 ORM, for example, can't do compound joins, and there is no support for HAVING.  Some of these omissions are addressed in later versions of Prisma, but we haven't updated the class to use a later version yet.
- Porting between database implementations is not going to be transparent, even with the ORM, because database implementations vary.

Prisma 6 has significant SQL limitations.  It won't do compound joins, for example.  It doesn't support HAVING.  This is being fixed for Prisma 8, which will be used in a later version of this class -- but Prisma 8 is quite a bit different.

## Advantages of Prisma ORM Syntax

Compare this version (pg):

```js
  let keys = Object.keys(value);
  keys = keys.map((key) => (key === "isCompleted" ? "is_completed" : key));
  const setClauses = keys.map((key, i) => `${key} = $${i + 1}`).join(", ");
  const idParm = `$${keys.length + 1}`;
  const userParm = `$${keys.length + 2}`;
  const result = await pool.query(
    `UPDATE tasks SET ${setClauses} 
  WHERE id = ${idParm} AND user_id = ${userParm} RETURNING id, title, is_completed`,
    [...Object.values(value), req.params.id, global.user_id],
  );
  if (!result.rows.length)
    return res.status(404).json({ message: "Task not found." });
  result.rows[0].isCompleted = result.rows[0].is_completed;
  delete result.rows[0].is_completed;
  res.status(200).json(result.rows[0]);
  ```

  with the Prisma version:

  ```js
  try {
    const task = await prisma.task.update({
      data: value,
      where: {
        id: parseInt(req.params.id),
        userId: global.user_id,
      },
      select: { title: true, isCompleted: true, id: true },
    });
    res.status(200).json(task);
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ message: "The task was not found." });
    } else {
      throw err; // pass other errors to the global error handler
    }
  }
```

With the ORM, you use objects, instead of the complicated positional handling of parameters with the pg package.  Also, column names can be mapped to JavaScript friendly versions.

## The Prisma Schema

It should look like this:

```
// This is your Prisma schema file
// Learn more at https://pris.ly/d/prisma-schema

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id             Int      @id @default(autoincrement())
  email          String   @unique @db.VarChar(255)
  name           String   @db.VarChar(30)
  hashedPassword String   @db.VarChar(255) @map("hashed_password")
  createdAt     DateTime @default(now()) @db.Timestamp(6) @map("created_at")
  Task          Task[]
  @@map("users")
}
// note: in the above, 
// Task Task[]
// should probably be 
// tasks Task[].  
// Attributes are usually lower case, and plural for one-to-many relationships.
// But use Task -- because that's what used in the assignment.

model Task {
  id           Int      @id @default(autoincrement())
  title        String   @db.VarChar(255)
  isCompleted Boolean  @default(false) @map("is_completed")
  userId      Int       @map("user_id")
  createdAt   DateTime @default(now()) @db.Timestamp(6) @map("created_at")
  User        User    @relation(fields: [userId], references: [id], onDelete: NoAction, onUpdate: NoAction)
  @@unique([id, userId])
  @@map("tasks")
}
```

The schema uses conventions to make it object-like.  Models are uppercase singular names.  When there is a relation between tables, this is represented as the model name and the related model, which in the case of a one-to-many relationship, may be an array.  Because schema names in SQL are usually lower snake case, you use `@@map` to map to the actual table or row.  Attribute names are camel case, with `@@map` used as needed to map to snake case.  Note the relation lines, which tell Prisma about which columns are foreign keys.  One can specify an action associated with the relation.  For example, one could tell Prisma to delete all the tasks belonging to the user when deleting the user.

## CRUD Operations With Prisma

You will use some of the following functions.  All of these are async.  These are methods on a given model (e.g. User, Task).  The model name is referred to in lower case.

- prisma.model.create
- prisma.model.createMany
- prisma.model.update
- prisma.model.updateMany
- prisma.model.findUnique
- prisma.model.findFirst
- prisma.model.findMany
- prisma.model.delete
- prisma.model.deleteMany

As with SQL, you specify a `where`.  You can also specify which elements are to be returned, with select. As with SQL, you can specify a `groupBy` and do various aggregation functions.  You can also specify the order, the limit, and the offset, but with all of these, the syntax is a little different from native SQL.

You don't do joins, exactly, but you can use select or include to specify that some or all attributes of related objects.  For example, you can specify that a user's tasks to be returned along with the user.  These appear as nested objects, not as long rows, which is what happens with native SQL.

Use the online Prisma reference to get the exact syntax with examples.  **Note:** We are using Prisma 6, so you should use the reference for that version.

### Common Stumbling Blocks

When getting attributes from relations, you can use either select or include.  Suppose the related object has 40 attributes, and you only want 2 of them.  You'd use select and name the ones you want.  Suppose the related object has 40 attributes, and you want them all.  You'd use include.  Suppose you only want 38 of them.  You'd use include with omit.

You use where clauses two places:

(1) To specify which objects from your primary model you want.

(2) To specify which objects from your related models you want.  You may have to repeat the same filter.

Example:

```js
  const usersWithPriorityTasks = await prisma.user.findMany({
    where: {
      Task: { some: { priority: "high" } },
    },
    select: {
      email: true,
      Task: { where: { priority: "high" }, select: { title: true } },
    },
  });
  ```

One catch with `findUnique`:  The columns you search on must have an index that guarantees a unique match.  For tasks, there is such an index, specified with: ` @@unique([id, userId])`.

## A Preview of Lesson 7

You probably found assignment 6 to be pretty quick.  Assignment 7 is a lot tougher.  Start on it soon.  The following Prisma features are addressed in Assignment 7.

- Eager loading / relations: This is the ~~somewhat lame~~ handling of JOIN operations in Prisma 6.
- Aggregation and groupBy: You've practiced this in native SQL.
- Transactions
- Batch operations
- Pagination
- Raw SQL with parameterized queries
- Database schema migration
- Specifying a search filter for tasks
- Sorting support

What makes this a good bit of work is that you have to add additional capabilities to your routes and controllers, so as to use the additional ORM features.  For example, you need to add query parameters for page and sort support to your task index operation, and you need to add a whole new endpoint for data analytics.

