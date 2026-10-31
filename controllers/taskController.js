const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");
const prisma = require("../db/prisma");

const create = async (req, res) => {
  const { error, value } = taskSchema.validate(req.body, {
    abortEarly: false,
  });
  if (error) {
    return res.status(400).json({
      message: error.message,
    });
  }
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
  const task = await prisma.task.findUnique({
    where: { userId: global.user_id, id: parseInt(req.params.id) },
  });
  if (task) {
    return res.status(200).json(task);
  }
  res.status(404).json({ message: "No task was found." });
};

const update = async (req, res) => {
  const { error, value } = patchTaskSchema.validate(req.body, {
    abortEarly: false,
  });
  if (error) {
    return res.status(400).json({
      message: error.message,
    });
  }
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
