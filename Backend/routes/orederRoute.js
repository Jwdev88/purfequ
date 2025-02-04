import express from "express";
import adminAuth from "../middleware/adminAuth.js";
import authUser from "../middleware/Auth.js";
import {
  placeOrder,
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
orderRouter.post("/midtrans", authUser, placeOrderMidtrans);
orderRouter.post('/midtrans-notification', handleNotification);
orderRouter.post('/midtrans-success', handleSuccess);
orderRouter.post('/midtrans-failure', handleFailure);
//user featrues
orderRouter.post("/userorders", authUser, userOrders);
// Log semua route yang terdaftar
orderRouter.stack.forEach((route) => {
  if (route.route) {
    console.log(`Method: ${route.route.stack[0].method.toUpperCase()}, Path: ${route.route.path}`);
  }
});
export default orderRouter;
