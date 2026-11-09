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
  const newTask = await prisma.Task.create({
    data: {
      title: value.title,
      isCompleted: value.isCompleted,
      userId: req.user.id,
      priority: value.priority,
    },
    select: { title: true, isCompleted: true, id: true, priority: true }, // specify the column values to return
  });
  res.status(201).json(newTask);
};

const index = async (req, res) => {
  // Parse pagination parameters
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  // Build where clause with optional search filter
  const whereClause = { userId: req.user.id };

  const getOrderBy = (query) => {
    const validSortFields = [
      "title",
      "priority",
      "createdAt",
      "id",
      "isCompleted",
    ];
    const sortBy = query.sortBy || "createdAt";
    const sortDirection = query.sortDirection === "asc" ? "asc" : "desc";

    if (validSortFields.includes(sortBy)) {
      return { [sortBy]: sortDirection };
    }
    return { createdAt: "desc" }; // default fallback
  };

  if (req.query.find) {
    whereClause.title = {
      contains: req.query.find, // Matches %find% pattern
      mode: "insensitive", // Case-insensitive search (ILIKE in PostgreSQL)
    };
  }

  // Get tasks with pagination and eager loading
  const tasks = await prisma.Task.findMany({
    where: whereClause,
    select: {
      id: true,
      title: true,
      isCompleted: true,
      priority: true,
      createdAt: true,
      User: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    skip: skip,
    take: limit,
    orderBy: getOrderBy(req.query),
  });

  // Get total count for pagination metadata
  const totalTasks = await prisma.Task.count({
    where: whereClause,
  });

  // Build pagination object with complete metadata
  // Hint: The test expects page, limit, total, pages, hasNext, hasPrev
  // Use Math.ceil() to calculate pages, and compare page * limit with total for hasNext
  const pagination = {
    // ... you need to build this object
    page,
    limit,
    total: totalTasks,
    pages: Math.ceil(totalTasks / limit),
    hasNext: page * limit < totalTasks,
    hasPrev: page > 1,
  };

  if (!tasks.length) {
    return res.status(404).json({ message: "No tasks were found." });
  }
  // Return tasks with pagination information
  res.status(200).json({
    // ... you need to return tasks and pagination
    tasks,
    pagination,
  });
};

const show = async (req, res) => {
  const task = await prisma.Task.findUnique({
    where: { userId: req.user.id, id: parseInt(req.params.id) },
    select: {
      id: true,
      title: true,
      isCompleted: true,
      priority: true,
      createdAt: true,
      User: {
        select: {
          name: true,
          email: true,
        },
      },
    },
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
    const task = await prisma.Task.update({
      data: value,
      where: {
        id: parseInt(req.params.id),
        userId: req.user.id,
      },
      select: { title: true, isCompleted: true, id: true, priority: true },
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
    const task = await prisma.Task.delete({
      where: {
        id: parseInt(req.params.id),
        userId: req.user.id,
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

// Bulk create with validation
const bulkCreate = async (req, res, next) => {
  const { tasks } = req.body;

  // Validate the tasks array
  if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
    return res.status(400).json({
      error: "Invalid request data. Expected an array of tasks.",
    });
  }

  // Validate all tasks before insertion
  const validTasks = [];
  for (const task of tasks) {
    const { error, value } = taskSchema.validate(task);
    if (error) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.details,
      });
    }
    validTasks.push({
      title: value.title,
      isCompleted: value.isCompleted || false,
      priority: value.priority || "medium",
      userId: req.user.id,
    });
  }

  // Use createMany for batch insertion
  try {
    const result = await prisma.Task.createMany({
      data: validTasks,
      skipDuplicates: false,
    });

    res.status(201).json({
      message: "success!",
      tasksCreated: result.count,
      totalRequested: validTasks.length,
    });
  } catch (err) {
    return next(err);
  }
};

module.exports = { create, index, show, update, deleteTask, bulkCreate };
