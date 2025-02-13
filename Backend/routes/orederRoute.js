import express from "express";
import adminAuth from "../middleware/adminAuth.js";
import authUser from "../middleware/Auth.js";
import {
  allOrders,
  userOrders,
  updateStatus,
  placeOrderMidtrans,
  handleNotification,

} from "../controllers/orderController.js";

const orderRouter = express.Router();
orderRouter.post("/list", adminAuth, allOrders);
orderRouter.post("/status", adminAuth, updateStatus);
orderRouter.post("/midtrans", authUser, placeOrderMidtrans);
orderRouter.post('/midtrans-notification', handleNotification);
orderRouter.post("/userorders", authUser, userOrders);

export default orderRouter;
