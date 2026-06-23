import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import passport from "passport";
import { getDB } from "../config/database.js";
import { createUser } from "../models/userModel.js";

export async function register(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }
  const db = getDB();
  const existing = await db.collection("users").findOne({ email });
  if (existing)
    return res.status(400).json({ error: "Email already registered" });
  const passwordHash = await bcrypt.hash(password, 10);
  const user = createUser({ email, passwordHash });
  await db.collection("users").insertOne(user);
  res.status(201).json({ message: "Account created" });
}

export async function login(req, res, next) {
  passport.authenticate("local", { session: false }, (err, user, _info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res
        .status(401)
        .json({ error: _info?.message || "Invalid credentials" });
    }
    const token = jwt.sign(
      { userId: user._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );
    res.json({ token });
  })(req, res, next);
}
