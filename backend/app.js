import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import passport from "passport";
import { connectDB } from "./config/database.js";
import "./config/passport.js";
import authRoutes from "./routes/auth.js";
import employeeRoutes from "./routes/employees.js";
import meetingRoutes from "./routes/meetings.js";
import actionItemRoutes from "./routes/actionItems.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(passport.initialize());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../frontend")));

app.get('/', (req, res) => {
  res.redirect(path.join('/auth.html'));
});

app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/meetings", meetingRoutes);
app.use("/api/action-items", actionItemRoutes);

const PORT = process.env.PORT || 3000;

connectDB().then(() => {
  app.listen(PORT, () =>
    console.log(`Server running on http://localhost:${PORT}`),
  );
});
