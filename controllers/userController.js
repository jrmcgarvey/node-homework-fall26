const { userSchema } = require("../validation/userSchema");
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
  const { password: _, ...valueWithoutPassword } = value;
  global.users.push({
    ...valueWithoutPassword,
    hashedPassword: await hashPassword(value.password),
  });
  global.user_id = value;
  res.status(201).json(valueWithoutPassword);
};

const logon = async (req, res) => {
  const { email, password } = req.body;
  const user = global.users.find((user) => email == user.email);
  if (!user || !(await comparePassword(password, user.hashedPassword))) {
    return res.status(401).json({ message: "Logon failed" });
  }

  global.user_id = user;
  res.status(200).json({ name: user.name, email: user.email });
};

const logoff = async (_req, res) => {
  global.user_id = null;
  res.status(200).end();
};

module.exports = { register, logon, logoff };
