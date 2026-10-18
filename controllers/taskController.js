const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");

const taskCounter = (() => {
  let lastTaskNumber = 0;
  return () => {
    lastTaskNumber += 1;
    return lastTaskNumber;
  };
})();

const create = async (req, res) => {
  const { error, value } = taskSchema.validate(req.body, {
    abortEarly: false,
  });
  if (error) {
    return res.status(400).json({
      message: error.message,
    });
  }
  value.userId = global.user_id.email;
  value.id = taskCounter();
  global.tasks.push(value);
  const { userId: _, ...valueWithoutUserId } = value;
  res.status(201).json(valueWithoutUserId);
};

const index = async (_req, res) => {
  const userTasks = global.tasks
    .filter((task) => task.userId == global.user_id.email)
    .map((task) => {
      const { userId: _, ...taskWithoutUserId } = task;
      return taskWithoutUserId;
    });
  if (userTasks.length) {
    return res.status(200).json(userTasks);
  }
  res.status(404).json({ message: "No tasks were found for this user." });
};

const show = async (req, res) => {
  const task = global.tasks.find(
    (task) => global.user_id.email == task.userId && req.params.id == task.id,
  );
  if (task) {
    const { userId: _, ...taskWithoutUserId } = task;
    return res.status(200).json(taskWithoutUserId);
  }
  res.status(400).json({ message: "No task was found." });
};

const update = async (req, res) => {
  const task = global.tasks.find(
    (task) => global.user_id.email == task.userId && req.params.id == task.id,
  );
  if (!task) {
    return res.status(404).json({ message: "No task was found." });
  }
  const { error, value } = patchTaskSchema.validate(req.body, {
    abortEarly: false,
  });
  if (error) {
    return res.status(400).json({
      message: error.message,
    });
  }
  Object.assign(task, { ...task, ...value });
  const { userId: _, ...updatedTaskWithoutUserId } = task;
  res.status(200).json(updatedTaskWithoutUserId);
};

const deleteTask = async (req, res) => {
  const taskIndex = global.tasks.findIndex(
    (task) => global.user_id.email == task.userId && req.params.id == task.id,
  );
  if (taskIndex < 0) {
    return res.status(404).json({ message: "No task was found." });
  }
  const oldTask = global.tasks[taskIndex];
  const { userId: _, ...oldTaskWithoutUserId } = oldTask;
  global.tasks.splice(taskIndex, 1);
  res.status(200).json(oldTaskWithoutUserId);
};

module.exports = { create, index, show, update, deleteTask };
