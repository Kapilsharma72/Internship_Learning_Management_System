require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const connectDB = require("./config/db");


const app = express();
app.use(express.json());

// Basic request logger to aid debugging
app.use((req, res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`${new Date().toISOString()} -> ${req.method} ${req.originalUrl}`);
  }
  next();
});

const allowedOrigins = (process.env.CORS_ORIGINS || process.env.FRONTEND_ORIGIN || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser clients (curl/postman) and same-origin.
      if (!origin) return callback(null, true);
      if (process.env.NODE_ENV !== "production") return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true
  })
);

// Block API calls when DB is not connected (except health check)
app.use((req, res, next) => {
  if (req.path === '/health') return next();
  // During tests we skip the DB-ready check so auth/middleware tests can run without a real DB.
  if (process.env.NODE_ENV === 'test') return next();
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ message: 'Service unavailable: database not connected' });
  }
  next();
});

app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/admin", require("./routes/admin.routes"));
app.use("/api/mentor", require("./routes/mentor.routes"));
app.use("/api/student", require("./routes/student.routes"));
app.use("/api/certificates", require("./routes/certificate.routes"));

// Global error handler to ensure errors return JSON and are logged
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err && err.stack ? err.stack : err);
  if (res.headersSent) return next(err);
  res.status(err && err.status ? err.status : 500).json({ message: 'Internal server error' });
});

// Health check for connectivity tests
app.get('/health', (req, res) => res.json({ ok: true, time: Date.now() }));

const PORT = process.env.PORT || 5001;

async function startServer() {
  // Start the HTTP server regardless of DB status to avoid connection resets from the frontend.
  if (require.main === module) {
    const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use.`);
        console.error('Either stop the process using this port or set a different PORT in your environment.');
        process.exit(1);
      }
      throw err;
    });
  }

  // During tests we avoid attempting a real DB connection to keep tests isolated.
  if (process.env.NODE_ENV !== 'test') {
    try {
      await connectDB();
    } catch (err) {
      console.error('Warning: MongoDB connection failed. Server will continue to run but API endpoints will return 503 until DB is available.');
    }
  }
}

startServer();

module.exports = app;
