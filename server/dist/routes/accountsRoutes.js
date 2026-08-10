import express from "express";
import { addAccount, getAccount } from "../controllers/accountsControllers.js";
import { protect } from "../middlewares/authMiddleware.js";
import { disconnectAccount } from "../controllers/accountsControllers.js";
const accountsRouter = express.Router();
accountsRouter.get("/", protect, getAccount);
accountsRouter.post("/", protect, addAccount);
accountsRouter.delete("/:id", protect, disconnectAccount);
export default accountsRouter;
