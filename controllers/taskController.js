const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");
// const pool = require("../db/pg-pool");
const prisma = require("../db/prisma");
// const taskCounter = (() => {
//   let lastTaskNumber = 0;
//   return () => {
//     lastTaskNumber += 1;
//     return lastTaskNumber;
//   };
// })();

const create = async (req, res) => {
  const { error, value } = taskSchema.validate(req.body, {
    abortEarly: false,
  });
  if (error) {
    return res.status(400).json({
      message: error.message,
    });
  }
  // value.user_id = global.user_id.id;
  // value.id = taskCounter();
  // global.tasks.push(value);
  // const result = await pool.query(
  //   `INSERT INTO tasks (title, is_completed, user_id) VALUES ($1, $2, $3) RETURNING id, title, is_completed`,
  //   [value.title, value.isCompleted, global.user_id],
  // );
  // // const { userId: _, ...valueWithoutUserId } = value;
  // const newTask = result.rows[0];
  // newTask.isCompleted = newTask.is_completed;
  // delete newTask.is_completed;
  const newTask = await prisma.task.create({
    data: {
      title: value.title,
      isCompleted: value.isCompleted,
      userId: global.user_id,
    },
    select: { title: true, isCompleted: true, id: true }, // specify the column values to return
  });
  res.status(201).json(newTask);
};

const index = async (_req, res) => {
  // const userTasks = global.tasks
  //   .filter((task) => task.userId == global.user_id.email)
  //   .map((task) => {
  //     const { userId: _, ...taskWithoutUserId } = task;
  //     return taskWithoutUserId;
  //   });

  // const result = await pool.query(
  //   "SELECT title, id, is_completed FROM tasks WHERE user_id = $1",
  //   [global.user_id],
  // );
  // let userTasks = result.rows;
  // if (userTasks.length) {
  //   userTasks = userTasks.map(task => {
  //     const { user_id: _, ...taskWithoutUserId } = task;
  //     return taskWithoutUserId;
  //   })
  // if (!userTasks.length)
  //   return res
  //     .status(404)
  //     .json({ message: "No tasks were found for this user." });
  // userTasks = userTasks.map((task) => {
  //   task.isCompleted = task.is_completed;
  //   delete task.is_completed;
  //   return task;
  // });
  const tasks = await prisma.task.findMany({
    where: {
      userId: global.user_id, // only the tasks for this user!
    },
    select: { title: true, isCompleted: true, id: true },
  });
  if (!tasks.length) {
    return res.status(404).json({message: "No tasks were found."});
  }
  res.status(200).json(tasks);
};

const show = async (req, res) => {
  // const task = global.tasks.find(
  //   (task) => global.user_id.email == task.userId && req.params.id == task.id,
  // );
  // const result = await pool.query(
  //   "SELECT title, id, is_completed FROM tasks WHERE user_id = $1 AND id = $2",
  //   [global.user_id, req.params.id],
  // );
  // const task = result.rows.length ? result.rows[0] : null;
  const task = await prisma.task.findUnique({
    where: { userId: global.user_id, id: parseInt(req.params.id) },
  });
  if (task) {
    //   const { user_id: _, ...taskWithoutUserId } = task;
    // task.isCompleted = task.is_completed;
    // delete task.is_completed;
    return res.status(200).json(task);
  }
  res.status(404).json({ message: "No task was found." });
};

const update = async (req, res) => {
  // const task = global.tasks.find(
  //   (task) => global.user_id.email == task.userId && req.params.id == task.id,
  // );
  const { error, value } = patchTaskSchema.validate(req.body, {
    abortEarly: false,
  });
  if (error) {
    return res.status(400).json({
      message: error.message,
    });
  }
  // let keys = Object.keys(value);
  // keys = keys.map((key) => (key === "isCompleted" ? "is_completed" : key));
  // const setClauses = keys.map((key, i) => `${key} = $${i + 1}`).join(", ");
  // const idParm = `$${keys.length + 1}`;
  // const userParm = `$${keys.length + 2}`;
  // const result = await pool.query(
  //   `UPDATE tasks SET ${setClauses}
  // WHERE id = ${idParm} AND user_id = ${userParm} RETURNING id, title, is_completed`,
  //   [...Object.values(value), req.params.id, global.user_id],
  // );
  // if (!result.rows.length)
  //   return res.status(404).json({ message: "Task not found." });
  // // Object.assign(task, value);
  // // const { userId: _, ...updatedTaskWithoutUserId } = task;
  // result.rows[0].isCompleted = result.rows[0].is_completed;
  // delete result.rows[0].is_completed;
  // res.status(200).json(result.rows[0]);
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
};

const deleteTask = async (req, res) => {
  // const taskIndex = global.tasks.findIndex(
  //   (task) => global.user_id.email == task.userId && req.params.id == task.id,
  // );
  // if (taskIndex < 0) {
  //   return res.status(404).json({ message: "No task was found." });
  // }
  // const oldTask = global.tasks[taskIndex];
  // const result = await pool.query(
  //   "DELETE FROM tasks WHERE user_id = $1 AND id = $2 RETURNING id, title, is_completed",
  //   [global.user_id, req.params.id],
  // );
  // if (!result.rows.length)
  //   return res.status(404).json({ message: "No task was found." });
  // // const { userId: _, ...oldTaskWithoutUserId } = oldTask;
  // // global.tasks.splice(taskIndex, 1);
  // result.rows[0].isCompleted = result.rows[0].is_completed;
  // delete result.rows[0].is_completed;
  // res.status(200).json(result.rows[0]);
  try {
    const task = await prisma.task.delete({
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
};

module.exports = { create, index, show, update, deleteTask };
