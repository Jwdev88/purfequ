import orderModel from "../models/ordermodel.js";
import UserModel from "../models/userModel.js";
import midtransClient from "midtrans-client";
import { v4 as uuidv4 } from "uuid";

// Inisialisasi Snap (untuk membuat transaksi)
let snap = new midtransClient.Snap({
  isProduction: false, // Ganti ke true jika sudah production
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY, //  Tambahkan client key!
});

// Function to create order
const createOrder = async (
  userId,
  items,
  amount,
  address,
  paymentMethod,
  ongkir,
  transactionToken = null,
  order_id = null // Add order_id as parameter
) => {
  const orderData = {
    userId,
    items,
    address,
    status: "Order Placed", // Initial status
    amount,
    paymentMethod,
    ongkir,
    payment: false, // Default to false, updated by Midtrans notification
    transactionToken,
    orderId: order_id, // Use passed-in order_id
    date: Date.now(),
  };

  const newOrder = new orderModel(orderData);
  await newOrder.save();
  return newOrder;
};

const placeOrderMidtrans = async (req, res) => {
  try {
    const { items, amount, address, ongkir } = req.body;
    const userId = req.user?._id || req.params.userId || req.query.userId;

    if (!userId) {
      return res.status(400).json({ message: "Missing userId" });
    }

    const item_details = items.map((item) => ({
      id: item.id || item.productId,
      price: item.price || 0,
      quantity: item.quantity,
      name: item.name || "Unnamed Product",
    }));

    const ongkir_id = uuidv4();
    item_details.push({
      id: ongkir_id,
      price: ongkir,
      quantity: 1,
      name: "Biaya Pengiriman",
    });

    const gross_amount = item_details.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
    const order_id = uuidv4(); // Generate unique order_id

    const parameter = {
      transaction_details: {
        order_id: order_id, // Use the generated order_id
        gross_amount: gross_amount,
      },
      credit_card: {
        secure: true,
      },
      customer_details: {
        first_name: address.firstName,
        last_name: address.lastName,
        email: address.email,
        phone: address.phone,
        shipping_address: address, // Use the full address object
      },
      item_details,
    };

    const transaction = await snap.createTransaction(parameter);

    if (!transaction || !transaction.token) {
      return res
        .status(500)
        .json({ success: false, message: "Failed to generate payment token" });
    }

    // Create the order *before* redirecting, with initial status
    const newOrder = await createOrder(
      userId,
      items,
      gross_amount,
      address,
      "Midtrans", // paymentMethod
      ongkir,
      transaction.token,
      order_id // Pass the order_id
    );

    // Set initial status to 'pending'
    newOrder.status = "pending";
    await newOrder.save();

    // Clear user's cart (assuming you have a cart system)
    await UserModel.findByIdAndUpdate(userId, { cartData: [] });

    res.status(201).json({
      success: true,
      message: "Order Placed",
      token: transaction.token, // Midtrans transaction token
      redirect_url: transaction.redirect_url, //  Send redirect_url
      orderId: order_id, //  Consistent order ID
    });
  } catch (error) {
    console.error("Error placing Midtrans order:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to place order",
        error: error.message,
      }); // Include error message
  }
};
// Fetch all orders for admin panel (No changes needed here)
const allOrders = async (req, res) => {
  try {
    const orders = await orderModel.find({});
    res.json({ success: true, orders });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Fetch user orders data for users
const userOrders = async (req, res) => {
  try {
    // Pastikan pengguna sudah terautentikasi
    if (!req.user || !req.user._id) {
      return res
        .status(401)
        .json({ success: false, message: "User not authenticated" });
    }

    const userId = req.user._id; // Mendapatkan userId dari data pengguna yang sudah terautentikasi
    const orders = await orderModel.find({ userId });

    // Cek apakah pesanan ditemukan
    if (!orders || orders.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No orders found" });
    }

    // Mengembalikan data pesanan ke client
    res.json({ success: true, orders });
  } catch (error) {
    // Menangani error dan memberikan respons yang sesuai
    console.error("Error fetching user orders:", error);
    res.status(500).json({ success: false, message: "Failed to fetch orders" });
  }
};

// Update order status from admin panel (No changes needed here)
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
    const notification = req.body;
    console.log("🔔 Notification received:", notification);

    if (
      !notification.order_id ||
      !notification.transaction_status ||
      !notification.fraud_status
    ) {
      console.error("Invalid notification data");
      return res.status(400).send("Invalid notification data");
    }

    const orderId = notification.order_id; // Use order_id from notification
    const transactionStatus = notification.transaction_status;
    const fraudStatus = notification.fraud_status;

    console.log(
      `Order ID: ${orderId}, Transaction Status: ${transactionStatus}, Fraud Status: ${fraudStatus}`
    );

    let newStatus = "pending"; // Default status
    let paymentStatus = false; //  Default payment status

    if (transactionStatus === "settlement" || transactionStatus === "capture") {
      // Handle 'capture' for credit card
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
      paymentStatus = false; // Keep as false for pending
    }
    // Add more status handling as needed (e.g., 'pending', 'expire')

    console.log(`New status to be updated: ${newStatus}`);

    // Update order status in MongoDB *using the orderId, NOT the transactionToken*
    const updatedOrder = await orderModel.findOneAndUpdate(
      { orderId: orderId }, //  Use orderId, NOT transactionToken
      { status: newStatus, payment: paymentStatus }, // Update both status and payment
      { new: true }
    );

    if (!updatedOrder) {
      console.error(`Order not found for order ID: ${orderId}`);
      return res.status(404).send("Order not found");
    }

    console.log("✅ Order updated successfully:", updatedOrder);

    res.status(200).json({ success: true, message: "OK" }); //  Simpler response
  } catch (error) {
    console.error("❌ Error handling notification:", error);
    res.status(500).send("Internal Server Error");
  }
};

export {
  allOrders,
  userOrders,
  updateStatus,
  placeOrderMidtrans,
  handleNotification,
};
