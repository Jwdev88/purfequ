import express from "express";
import adminAuth from "../middleware/adminAuth.js";
import authUser from "../middleware/Auth.js";
import {
  handleNotification,
  placeOrderMidtrans,
  userOrders,
  allOrders,        // For admin
  updateOrderStatus, // NEW: For admin updates
  updateStatus

} from '../controllers/orderController.js';

const orderRouter = express.Router();
orderRouter.post("/list", allOrders);
orderRouter.post("/updatestatus", updateStatus);
orderRouter.post("/updateorderstatus", updateOrderStatus);

orderRouter.post("/midtrans", authUser, placeOrderMidtrans);
orderRouter.post('/notification', handleNotification);
orderRouter.post("/userorders", authUser, userOrders);
export default orderRouter;
