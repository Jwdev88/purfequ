// --- backend/controllers/orderController.js ---
import orderModel from "../models/ordermodel.js";
import UserModel from "../models/userModel.js";
import midtransClient from "midtrans-client";
import { v4 as uuidv4 } from "uuid";

// Initialize Snap (for creating transactions).  Use environment variables!
let snap = new midtransClient.Snap({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === "true", // Use env var, and convert to boolean
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY,
});

// Helper Function to Create an Order (Reusable and Clean)
const createOrder = async (
  userId,
  items,
  amount,
  address,
  paymentMethod,
  ongkir,
  transactionToken = null, // Optional, only for Midtrans
  order_id = null // Optional, but GOOD to include for consistency
) => {
  try {
    const orderData = {
      userId,
      items,
      address,
      status: "pending", // Initial status  <-- CHANGED TO "pending"
      amount,
      paymentMethod,
      ongkir,
      payment: false, // Initial payment status (updated by webhook)
      transactionToken, // Store the Midtrans token
      orderId: order_id, // Use the provided order_id
      date: Date.now(),
    };

    const newOrder = new orderModel(orderData);
    const savedOrder = await newOrder.save(); // Await the save operation
    return savedOrder; // Return the saved order
  } catch (error) {
    console.error("Error creating order:", error);
    throw error; // Re-throw the error to be handled by the caller
  }
};

// Place Order with Midtrans Payment
const placeOrderMidtrans = async (req, res) => {
  try {
    const { items, amount, address, ongkir } = req.body;
    const userId = req.user?._id || req.params.userId || req.query.userId;

    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "Missing userId" });
    }

    // Prepare item details for Midtrans
    const item_details = items.map((item) => ({
      id: item.id || item.productId, // Use a consistent ID
      price: item.price || 0, // Handle potential missing prices
      quantity: item.quantity,
      name: item.name || "Unnamed Product", // Handle potential missing names
    }));
    const shortUUID = uuidv4().replace(/-/g, "").slice(0, 15);

    const ongkir_id = shortUUID; // Use a UUID for the shipping cost item ID
    item_details.push({
      id: ongkir_id, //It can be anything
      price: ongkir,
      quantity: 1,
      name: "Biaya Pengiriman",
    });

    // Calculate the total amount (gross amount)
    const gross_amount = item_details.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
    // Generate a unique order ID *without* any prefixes
    const order_id = shortUUID; //  <--  IMPORTANT:  Use a plain UUID

    // Create Midtrans transaction parameters
    const parameter = {
      transaction_details: {
        order_id: order_id, //  <-- Use the generated UUID here
        gross_amount: gross_amount,
      },
      credit_card: {
        secure: true, // Enable 3D Secure
      },
      customer_details: {
        first_name: address.firstName,
        last_name: address.lastName,
        email: address.email,
        phone: address.phone,
        shipping_address: address, // Pass the full address object
      },
      item_details, // Include item details
    };
    console.log("parameter:", parameter);

    // Create Midtrans transaction
    const transaction = await snap.createTransaction(parameter);

    if (!transaction || !transaction.token) {
      return res
        .status(500)
        .json({ success: false, message: "Failed to generate payment token" });
    }
    // Create the order *before* redirecting to Midtrans, set initial status
    const newOrder = await createOrder(
      userId,
      items,
      gross_amount,
      address,
      "Midtrans",
      ongkir,
      transaction.token,
      order_id // Pass generated order_id
    );

    // Set initial status to pending
    //newOrder.status = "pending"; //redundant, because we set it to pending in createOrder
    //await newOrder.save()
    // Clear the user's cart (assuming you have a cart in your user model)
    // await UserModel.findByIdAndUpdate(userId, { cartData: [] }); // Clear cart *after* successful order creation

    res.status(201).json({
      success: true,
      message: "Order Placed",
      token: transaction.token, // Send the Midtrans token to the frontend
      redirect_url: transaction.redirect_url, // And the redirect URL
      orderId: order_id, //  Send the *correct* order ID
    });
  } catch (error) {
    console.error("Error placing Midtrans order:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to place order",
        error: error.message,
      });
  }
};

// Midtrans Notification Handler (Webhook)
// --- backend/controllers/orderController.js ---
// ... (previous imports and functions) ...

// --- backend/controllers/orderController.js ---
// ... (previous imports and functions) ...

const handleNotification = async (req, res) => {
  try {
    const notification = req.body;
    console.log("🔔 Notification received:", notification);

    // --- Basic Validation (Important) ---
    if (
      !notification.order_id ||
      !notification.transaction_status ||
      !notification.fraud_status
    ) {
      console.error("Invalid notification data");
      return res.status(400).send("Invalid notification data");
    }

    const orderId = notification.order_id;
    const transactionStatus = notification.transaction_status;
    const fraudStatus = notification.fraud_status;
    const paymentType = notification.payment_type; //  <-- Get payment_type

    // --- Extract VA Information (if available) ---
    let vaNumber = null;
    let bank = null;

    if (notification.va_numbers && notification.va_numbers.length > 0) {
      vaNumber = notification.va_numbers[0].va_number; // Get the first VA number
      bank = notification.va_numbers[0].bank; // Get the bank code
    }

    // --- Log Extracted Data ---
    console.log(
      `Order ID: ${orderId}, Transaction Status: ${transactionStatus}, Fraud Status: ${fraudStatus}, Payment Type: ${paymentType}, VA Number: ${vaNumber}, Bank: ${bank}`
    );

    let newStatus = "pending";
    let paymentStatus = false;

    // --- Determine Order Status based on Midtrans Notification ---
    if (transactionStatus === "settlement" || transactionStatus === "capture") {
      newStatus = "paid";
      paymentStatus = true;
    } else if (
      transactionStatus === "cancel" ||
      transactionStatus === "expire" ||
      transactionStatus === "deny"
    ) {
      newStatus = "failed";
      paymentStatus = false;
    } else if (transactionStatus === "pending") {
      newStatus = "pending";
      paymentStatus = false;
    }

    // --- Fraud Status Check ---
    if (fraudStatus === "challenge") {
      newStatus = "pending";
    } else if (fraudStatus === "deny") {
      newStatus = "failed";
      paymentStatus = false;
    }

    console.log(`New status to be updated: ${newStatus}`);

    // --- Find and Update Order ---
    const updatedOrder = await orderModel.findOneAndUpdate(
      { orderId: orderId },
      {
        status: newStatus,
        payment: paymentStatus,
        paymentType, // Save the payment type
        vaNumber, //  <-- Save the VA number
        bank, //  <-- Save the bank code
      },
      { new: true }
    );
    // ... (rest of handleNotification) ...
    if (!updatedOrder) {
      console.error(`Order not found for order ID: ${orderId}`);
      return res.status(404).send("Order not found");
    }

    console.log("✅ Order updated successfully:", updatedOrder);
    res.status(200).json({ success: true, message: "OK" });
  } catch (error) {
    console.error("❌ Error handling notification:", error);
    res.status(500).send("Internal Server Error");
  }
};

// ... (rest of your orderController.js) ...
// Fetch All Orders (for Admin Panel)
const allOrders = async (req, res) => {
  try {
    const orders = await orderModel.find({}); // Find *all* orders
    res.json({ success: true, orders });
  } catch (error) {
    console.error("Error fetching all orders:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to fetch orders",
        error: error.message,
      });
  }
};

// Fetch User Orders (for Users)
const userOrders = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res
        .status(401)
        .json({ success: false, message: "User not authenticated" });
    }

    const userId = req.user._id;
    const orders = await orderModel.find({ userId }); // Find orders for the specific user

    if (!orders || orders.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No orders found" });
    }

    res.json({ success: true, orders });
  } catch (error) {
    console.error("Error fetching user orders:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to fetch orders",
        error: error.message,
      });
  }
};

// Update Order Status (ADMIN ONLY)
const updateOrderStatus = async (req, res) => {
  try {
    const { orderId, status, notes, trackingNumber } = req.body;

    // Input Validation
    if (!orderId || !status) {
      return res
        .status(400)
        .json({ success: false, message: "orderId and status are required" });
    }
    if (
      ![
        "Order Received",
        "Packing",
        "In Transit",
        "Delivered",
        "failed",
      ].includes(status)
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid status value" });
    }

    // Update the order
    const updatedOrder = await orderModel.findOneAndUpdate(
      { orderId: orderId }, // Use the orderId to find the correct order
      {
        status, // Update to the new status
        ...(notes && { notes }), // Conditionally update notes
        ...(trackingNumber && { trackingNumber }), // Conditionally update trackingNumber
      },
      { new: true } // Return the updated document
    );

    if (!updatedOrder) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    res.json({
      success: true,
      message: "Order status updated",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to update order status",
        error: error.message,
      });
  }
};

//Update status by admin
const updateStatus = async (req, res) => {
  try {
    const { orderId, status } = req.body;
    if (!orderId || !status) {
      return res
        .status(400)
        .json({ message: "orderId and status are required" });
    }
    const updatedOrder = await orderModel.findOneAndUpdate(
      { orderId: orderId },
      { status },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({ success: true, message: "Status Update", order: updatedOrder });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};
export {
  allOrders,
  userOrders,
  updateStatus, // Old Update Status
  placeOrderMidtrans,
  handleNotification,
  updateOrderStatus, // new update status
};
