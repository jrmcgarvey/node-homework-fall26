const { userSchema } = require("../validation/userSchema");
// const pool = require("../db/pg-pool");
const prisma = require("../db/prisma");
const crypto = require("crypto");
const util = require("util");
const scrypt = util.promisify(crypto.scrypt);

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = await scrypt(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

async function comparePassword(inputPassword, storedHash) {
  const [salt, key] = storedHash.split(":");
  const keyBuffer = Buffer.from(key, "hex");
  const derivedKey = await scrypt(inputPassword, salt, 64);
  return crypto.timingSafeEqual(keyBuffer, derivedKey);
}

const register = async (req, res) => {
  const { error, value } = userSchema.validate(req.body, {
    abortEarly: false,
  });
  if (error) {
    return res.status(400).json({ message: error.message });
  }
  const hashedPassword = await hashPassword(value.password);
  // let result;
  const { email, name } = value;
  // In your register method, after validation and password hashing:
  // Do the Joi validation, so that value contains the user entry you want.
  // hash the password, and put it in value.hashedPassword
  // delete value.password as that doesn't get stored
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Create user account (similar to Assignment 6, but using tx instead of prisma)
      const newUser = await tx.User.create({
        data: { email, name, hashedPassword },
        select: { id: true, email: true, name: true },
      });

      // Create 3 welcome tasks using createMany
      const welcomeTaskData = [
        {
          title: "Complete your profile",
          userId: newUser.id,
          priority: "medium",
        },
        { title: "Add your first task", userId: newUser.id, priority: "high" },
        { title: "Explore the app", userId: newUser.id, priority: "low" },
      ];
      await tx.Task.createMany({ data: welcomeTaskData });

      // Fetch the created tasks to return them
      const welcomeTasks = await tx.Task.findMany({
        where: {
          userId: newUser.id,
          title: { in: welcomeTaskData.map((t) => t.title) },
        },
        select: {
          id: true,
          title: true,
          isCompleted: true,
          userId: true,
          priority: true,
        },
      });

      return { user: newUser, welcomeTasks };
    });

    // Store the user ID globally for session management (not secure for production)
    global.user_id = result.user.id;

    // Send response with status 201
    res.status(201);
    res.json({
      user: result.user,
      welcomeTasks: result.welcomeTasks,
      transactionStatus: "success",
    });
    return;
  } catch (err) {
    if (err.code === "P2002") {
      // send the appropriate error back -- the email was already registered
      return res.status(400).json({ error: "Email already registered" });
    } else {
      throw err; // the error handler takes care of other errors
    }
  }
};

const logon = async (req, res) => {
  let { email, password } = req.body;
  email = email.toLowerCase();
  const user = await prisma.User.findUnique({ where: { email } });
  if (!user || !(await comparePassword(password, user.hashedPassword))) {
    return res.status(401).json({ message: "Logon failed" });
  }

  global.user_id = user.id;
  res.status(200).json({ name: user.name, email: user.email });
};

const logoff = async (_req, res) => {
  global.user_id = null;
  res.status(200).end();
};

// In userController.js (if you have a show method)
const show = async (req, res) => {
  const userId = parseInt(req.params.id);

  if (isNaN(userId)) {
    return res.status(400).json({ error: "Invalid user ID" });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      Task: {
        where: { isCompleted: false },
        select: {
          id: true,
          title: true,
          priority: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  res.status(200).json(user);
};

module.exports = { register, logon, logoff, show };
