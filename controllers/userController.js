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
  let user;
  try {
    user = await prisma.user.create({
      data: { name: value.name, email: value.email, hashedPassword },
      select: { name: true, email: true, id: true }, // specify the column values to return
    });
  } catch (e) {
    if (e.name === "PrismaClientKnownRequestError" && e.code === "P2002") {
      // send the appropriate error back -- the email was already registered
      return res
        .status(400)
        .json({ message: "A user with that email is already registered" });
    }
    throw e; // all other errors get passed to the error handler
  }
  global.user_id = user.id;
  res.status(201).json(user);
};

const logon = async (req, res) => {
  let { email, password } = req.body;
  email = email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
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

module.exports = { register, logon, logoff };
