import { model } from "mongoose";
import orderModel from "../models/ordermodel.js";
import userModel from "../models/userModel.js";
import midtransClient from "midtrans-client";
import { v4 as uuidv4 } from "uuid";
const currency = "IDR";
const deliveryCharge = 100;


let core = new midtransClient.CoreApi();

// Inisialisasi Core API dengan Server Key
let snap = new midtransClient.Snap({
  isProduction: false,
  serverKey: process.env.MIDTRANS_SERVER_KEY,
});
// COD METHOD
const placeOrder = async (req, res) => {
  try {
    const { userId, items, amount, address } = req.body;

    const orderData = {
      userId,
      items,
      address,
      amount,
      paymentMethod: "COD",
      payment: false,
      date: Date.now(),
    };

    const newOrder = new orderModel(orderData);
    await newOrder.save();

    await userModel.findByIdAndUpdate(userId, { cartData: {} });

    res.json({ success: true, message: "Order Placeced" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const placeOrderMidtrans = async (req, res) => {
  try {
    const { userId, items, amount, address } = req.body;

    // Basic validation (add more as needed)
    if (!userId || !items || !amount || !address) {
      return res.status(400).json({
        success: false,
        message: "Missing required information",
      });
    }
    // if (items.length === 0) {
    //   return res.status(400).json({ success: false, message: "Cart is empty" });
    // }
    // if (amount <= 0) {
    //   return res.status(400).json({ success: false, message: "Invalid amount" });
    // }

    // // ... (generate transaction token and orderData) ...

    // // Execute database operations concurrently (if needed)
    // await Promise.all([
    //   newOrder.save(),
    //   userModel.findByIdAndUpdate(userId, { cartData: [] }),
    // ]);

    // console.log(`Order placed successfully (orderId: ${order_id}, userId: ${userId})`);
    const order_id = uuidv4(); // Generate a UUID for the order ID

    const parameter = {
      transaction_details: {
        order_id: order_id,
        gross_amount: amount,
      },
      credit_card: {
        secure: true,
      },
      customer_details: {
        first_name: address.firstName,
        last_name: address.lastName,
        phone: address.phone,
        email: address.email,
      },
    };

    // Generate token Midtrans Snap
    const transactionToken = await snap.createTransaction(parameter);

    const orderData = {
      orderId: order_id, // Use the generated UUID
      userId,
      items,
      address,
      amount,
      paymentMethod: "Midtrans",
      payment: false,
      transactionToken: transactionToken.token,
      date: Date.now(),
    };

    const newOrder = new orderModel(orderData);
    await newOrder.save();

    // Clear the user's cart (assuming you have cartData in your user model)
    await userModel.findByIdAndUpdate(userId, { cartData: [] });

    // Send Midtrans token to frontend
    res.json({
      success: true,
      message: "Order Placed",
      token: transactionToken.token,
      orderId: order_id, // Include the order ID in the response
    });
  } catch (error) {
    console.error("Error placing order:", error);
    res.status(500).json({ success: false, message: "Failed to place order" });
  }
};
// Stripe METHOD
const placeOrderStripe = async (req, res) => {};

// Razorpay METHOD
const placeOrderRazorpay = async (req, res) => {};

// all orders data for admin panel
const allOrders = async (req, res) => {
  try {
    const orders = await orderModel.find({});
    res.json({ success: true, orders });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// user order data for users
const userOrders = async (req, res) => {
  try {
    const { userId } = req.body;

    const orders = await orderModel.find({ userId });
    res.json({ success: true, orders });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};
// update order status from admin panel
const updateStatus = async (req, res) => {
  try {
    const { orderId, status } = req.body;

    await orderModel.findByIdAndUpdate(orderId, { status });
    res.json({ success: true, message: "Status Update" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};
const handleNotification = async (req, res) => {
  try {
    let notification = req.body;
    let orderId = notification.order_id;
    let transactionStatus = notification.transaction_status;
    let fraudStatus = notification.fraud_status;
    // Lakukan validasi notifikasi di sini

    // Update status order di database
    if (transactionStatus == "capture") {
      if (fraudStatus == "challenge") {
        await orderModel.findOneAndUpdate(
          { transactionToken: orderId },
          { payment: "challenge" }
        );
      } else if (fraudStatus == "accept") {
        await orderModel.findOneAndUpdate(
          { transactionToken: orderId },
          { payment: true }
        );
      }
    } else if (transactionStatus == "settlement") {
      await orderModel.findOneAndUpdate(
        { transactionToken: orderId },
        { payment: true }
      );
    } else if (
      transactionStatus == "cancel" ||
      transactionStatus == "deny" ||
      transactionStatus == "expire"
    ) {
      await orderModel.findOneAndUpdate(
        { transactionToken: orderId },
        { payment: false }
      );
    } else if (transactionStatus == "pending") {
      await orderModel.findOneAndUpdate(
        { transactionToken: orderId },
        { payment: "pending" }
      );
    }

    res.status(200).send("OK");
  } catch (e) {
    console.log("Error:", e);
    res.status(500).send(e);
  }
};
const handleSuccess = async (req, res) => {
  try {
    const orderId = req.query.orderId;

    // Use snap.transaction.status to check the payment status
    const transactionStatus = await snap.transaction.status(orderId); 

    if (transactionStatus.transaction_status === 'settlement') {
      // Payment successful
      await orderModel.findOneAndUpdate({ orderId: orderId }, { payment: true, status: 'Paid' }); 
      res.redirect('/orders'); 
    } else {
      // Payment not successful (pending, failure, etc.)
      await orderModel.findOneAndUpdate({ orderId: orderId }, { status: transactionStatus.transaction_status }); 
      res.redirect('/pending-or-failure-page'); 
    }
  } catch (error) {
    console.error("Error handling success:", error);
    res.status(500).json({ success: false, message: 'Failed to process payment' });
  }
};
const handleFailure = async (req, res) => {
  try {
    const orderId = req.query.orderId;

    // For a more robust solution, you can still check the transaction status here
    const transactionStatus = await snap.transaction.status(orderId);
    console.log("Transaction Status on Failure:", transactionStatus); // Log the status for debugging

    // Update the order status in your database (e.g., to 'Failed')
    await orderModel.findOneAndUpdate({ orderId: orderId }, { status: 'Failed', payment: false }); 

    // Redirect the user to a failure page with an appropriate message
    res.redirect('/failure-page'); 
  } catch (error) {
    console.error("Error handling failure:", error);
    res.status(500).json({ success: false, message: 'Failed to process payment' });
  }
};

export {
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
};
