const register = async (req, res) => {
  const { name, email, password } = req.body;
  const user = { name, email, password };
  global.users.push(user);
  global.user_id = user;
  const { password: _, ...userWithoutPassword } = user;
  res.status(201).json(userWithoutPassword);
};

const logon = async (req, res) => {
  const { email, password } = req.body;
  const user = global.users.find(
    (user) => email == user.email && password == user.password,
  );
  if (!user) {
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
