const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Please provide name, email and password." });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res
        .status(400)
        .json({ message: "That email is already registered." });
    }

    const normalizedRole = "student";

    const hashed = await bcrypt.hash(password, 10);

    await User.create({
      name,
      email,
      password: hashed,
      role: normalizedRole,
    });

    res.status(201).json({
      message: "Student registered successfully. You can now sign in.",
    });
  } catch (err) {
    console.error("Register error:", err);
    res
      .status(500)
      .json({ message: "Could not register user. Try again later." });
  }
};


exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Please provide email and password." });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid email or password." });

    if (user.role === "mentor" && !user.mentorApproved) {
      return res.status(403).json({ message: "Your mentor account is awaiting admin approval." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid email or password." });

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ token, role: user.role });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Could not sign you in right now. Try again later." });
  }
};

exports.bootstrapAdmin = async (req, res) => {
  try {
    const providedToken = req.headers["x-bootstrap-token"];
    const expectedToken = process.env.ADMIN_BOOTSTRAP_TOKEN;

    if (!expectedToken || providedToken !== expectedToken) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const existingAdmins = await User.countDocuments({ role: "admin" });
    if (existingAdmins > 0) {
      return res.status(409).json({ message: "Admin already exists" });
    }

    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Please provide name, email and password." });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res
        .status(400)
        .json({ message: "That email is already registered." });
    }

    const hashed = await bcrypt.hash(password, 10);

    await User.create({
      name,
      email,
      password: hashed,
      role: "admin",
      mentorApproved: true
    });

    res.status(201).json({ message: "Admin created successfully." });
  } catch (err) {
    console.error("Bootstrap admin error:", err);
    res.status(500).json({ message: "Could not bootstrap admin. Try again later." });
  }
};

exports.registerMentor = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Please provide name, email and password." });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "That email is already registered." });
    }

    const hashed = await bcrypt.hash(password, 10);

    await User.create({
      name,
      email,
      password: hashed,
      role: "mentor",
      mentorApproved: false
    });

    res.status(201).json({ message: "Mentor registered. Awaiting admin approval." });
  } catch (err) {
    console.error("Register mentor error:", err);
    res.status(500).json({ message: "Could not register mentor. Try again later." });
  }
};
