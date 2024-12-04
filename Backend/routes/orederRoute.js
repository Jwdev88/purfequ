import express from "express";
import adminAuth from "../middleware/adminAuth.js";
import authUser from "../middleware/Auth.js";
import {
  placeOrder,
  placeOrderRazorpay,
  placeOrderStripe,
  allOrders,
  userOrders,
  updateStatus,
  placeOrderMidtrans,
  handleNotification,
  handleSuccess,
  handleFailure,
} from "../controllers/orderController.js";

const orderRouter = express.Router();
// admin features
orderRouter.post("/list", adminAuth, allOrders);
orderRouter.post("/status", adminAuth, updateStatus);

//payment features
orderRouter.post("/place", authUser, placeOrder);
orderRouter.post("/stripe", authUser, placeOrderStripe);
orderRouter.post("/midtrans", authUser, placeOrderMidtrans);
orderRouter.post("/razorpay", authUser, placeOrderRazorpay);
orderRouter.post('/midtrans-notification', handleNotification);
orderRouter.post('/midtrans-success', handleSuccess);
orderRouter.post('/midtrans-failure', handleFailure);
//user featrues
orderRouter.post("/userorders", authUser, userOrders);

export default orderRouter;
