const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./src/config/db");

// Load biến môi trường từ file .env
dotenv.config();

// Kết nối MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Route test
app.get("/api/test", (req, res) => {
  res.json({ message: "API is working" });
});

// TODO: Thêm routes ở đây
// app.use("/api/auth", require("./src/routes/authRoutes"));
// app.use("/api/users", require("./src/routes/userRoutes"));
// app.use("/api/rooms", require("./src/routes/roomRoutes"));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
