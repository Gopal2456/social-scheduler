import "dotenv/config";
import express from 'express';
import cors from "cors";
import connectDB from "./config/db.js";
import authRouter from "./routes/authRoutes.js";
import socialAuthRouter from "./routes/socialAuthRoute.js";
import accountsRouter from "./routes/accountsRoutes.js";
import postRouter from "./routes/postRoutes.js";
import activityRouter from "./routes/activityRoutes.js";
import { initScheduler } from "./services/schedulerService.js";
const app = express();
// Database connection
await connectDB();
// Middleware
app.use(cors());
app.use(express.json());
const port = process.env.PORT || 3000;
app.get('/', (req, res) => {
    res.send('Server is Live!');
});
app.use('/api/auth', authRouter);
app.use("/api/oauth", socialAuthRouter);
app.use("/api/accounts", accountsRouter);
app.use("/api/posts", postRouter);
app.use("/api/activity", activityRouter);
// Initialize the scheduler
initScheduler();
//global error handler
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).send(err?.response?.data?.message || err.message);
});
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
