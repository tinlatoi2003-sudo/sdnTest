const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./src/config/db");

dotenv.config();
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

// Routes
app.use("/api/auth", require("./src/routes/authRoutes"));
app.use("/api/users", require("./src/routes/userRoutes"));
app.use("/api/reports", require("./src/routes/reportRoutes"));
app.use("/api/notifications", require("./src/routes/notificationRoutes"));
app.use("/api/student", require("./src/routes/studentRoutes"));
app.use("/api/manager", require("./src/routes/managerRoutes"));
app.use("/api/buildings", require("./src/routes/buildingRoutes"));
app.use("/api/rooms", require("./src/routes/roomRoutes"));



// TODO: thêm routes khác ở đây
// app.use("/api/rooms", require("./src/routes/roomRoutes"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
