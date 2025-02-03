import { model } from "mongoose";
import orderModel from "../models/ordermodel.js";
import UserModel from "../models/userModel.js"
import midtransClient from "midtrans-client";
import { v4 as uuidv4 } from "uuid";

let core = new midtransClient.CoreApi();

// Inisialisasi Core API dengan Server Key
let snap = new midtransClient.Snap({
  isProduction: false,
  serverKey: process.env.MIDTRANS_SERVER_KEY,
});

// Common function to create order
const createOrder = async (
  userId,
  items,
  amount,
  address,
  paymentMethod,
  ongkir,
  transactionToken = null
) => {
  let payment = null;

  if (paymentMethod === "COD") {
    payment = false;
  } else if (paymentMethod === "Midtrans") {
    payment = "pending";
  }

  const orderData = {
    userId,
    items,
    address,
    status: "Order Placed",
    amount,
    paymentMethod,
    ongkir, // Simpan ongkir di order
    payment: false,
    transactionToken,
    date: Date.now(),
  };

  const newOrder = new orderModel(orderData);
  await newOrder.save();
  return newOrder;
};

// COD METHOD - Place Order for COD
const placeOrder = async (req, res) => {
  try {
    const { items, amount, address, ongkir } = req.body;
    const userId = req.user._id || req.params.userId || req.query.userId;

    if (!userId) return res.status(400).json({ message: "Missing userId" });
    if (!items || !Array.isArray(items) || items.length === 0)
      return res.status(400).json({ message: "Items are missing or invalid" });
    if (!amount) return res.status(400).json({ message: "Amount is missing" });
    if (!address)
      return res.status(400).json({ message: "Address is missing" });
    if (!ongkir) return res.status(400).json({ message: "Ongkir is missing" });
    // Create COD order with 'payment' set to false
    await createOrder(userId, items, amount, address, "COD", ongkir);

    // Clear the user's cart data

    await UserModel.findByIdAndUpdate(userId, { cartData: [] });
    
    
    res.json({ success: true, message: "Order Placed", paymentMethod: "COD" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Midtrans METHOD - Place Order with Midtrans Payment
// Function to handle placing an order with Midtrans
const placeOrderMidtrans = async (req, res) => {
  try {
    const { items, amount, address, ongkir } = req.body;
    const userId = req.user?._id || req.params.userId || req.query.userId;
    console.log("req body:", items, ongkir, address);

    if (!userId) return res.status(400).json({ message: "Missing userId" });

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
    const order_id = uuidv4();

    const parameter = {
      transaction_details: {
        order_id: order_id,
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
        shipping_address: address,
      },
      item_details,
    };
    console.log("parameter:", parameter);
    const transaction = await snap.createTransaction(parameter);

    if (!transaction || !transaction.token) {
      return res
        .status(500)
        .json({ success: false, message: "Failed to generate payment token" });
    }

    const newOrder = await createOrder(
      userId,
      items,
      gross_amount,
      address,
      "Midtrans",
      ongkir,
      transaction.token
    );
    newOrder.status = "pending";
    await newOrder.save();

    await UserModel.findByIdAndUpdate(userId, { cartData: [] });
    console.log("cartdata:",UserModel);

    res.status(201).json({
      success: true,
      message: "Order Placed",
      token: transaction.token,
      orderId: order_id,
      amount: gross_amount,
      address,
      item_details,
    });
  } catch (error) {
    console.error("Error placing Midtrans order:", error);
    res.status(500).json({ success: false, message: "Failed to place order" });
  }
};

// Fetch all orders for admin panel
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

// Update order status from admin panel
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

// Notification handler for Midtrans payments
// Function to handle payment notification from Midtrans
const handleNotification = async (req, res) => {
  try {
    const notification = req.body;

    // Validasi data yang diterima dari Midtrans
    if (
      !notification.order_id ||
      !notification.transaction_status ||
      !notification.fraud_status
    ) {
      return res.status(400).send("Invalid notification data");
    }

    const orderId = notification.order_id;
    const transactionStatus = notification.transaction_status;
    const fraudStatus = notification.fraud_status;

    // Tentukan status pembayaran berdasarkan transaction_status
    let newStatus = "pending"; // Default status adalah pending
    if (transactionStatus === "settlement") {
      newStatus = "paid"; // Pembayaran berhasil
    } else if (
      transactionStatus === "cancel" ||
      transactionStatus === "expire" ||
      transactionStatus === "deny"
    ) {
      newStatus = "failed"; // Pembayaran gagal
    }

    // Update status order di MongoDB
    const updatedOrder = await orderModel.findOneAndUpdate(
      { transactionToken: orderId }, // Sesuaikan dengan field yang ada di database
      { payment: newStatus === "paid", status: newStatus }, // Update status pembayaran
      { new: true } // Mendapatkan data yang telah diupdate
    );

    // Jika order tidak ditemukan, berikan response 404
    if (!updatedOrder) {
      return res.status(404).send("Order not found");
    }

    // Berikan respon yang lengkap
    res.status(200).json({ success: true, message: "OK" });
  } catch (error) {
    console.error("Error handling notification:", error);
    res.status(500).send("Internal Server Error");
  }
};

// Success handler for Midtrans payment
const handleSuccess = async (req, res) => {
  try {
    const orderId = req.query.orderId;
    const transactionStatus = await snap.transaction.status(orderId);

    if (transactionStatus.transaction_status === "settlement") {
      await orderModel.findOneAndUpdate(
        { transactionToken: orderId },
        { payment: true, status: "paid" }
      );
      res.redirect("/orders"); // Redirect ke halaman order user
    } else {
      await orderModel.findOneAndUpdate(
        { transactionToken: orderId },
        { status: transactionStatus.transaction_status }
      );
      res.redirect("/pending-or-failure-page");
    }
  } catch (error) {
    console.error("Error handling success:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to process payment" });
  }
};

// Failure handler for Midtrans payment
const handleFailure = async (req, res) => {
  try {
    const orderId = req.query.orderId;
    const transactionStatus = await snap.transaction.status(orderId);

    await orderModel.findOneAndUpdate(
      { orderId },
      { status: "Failed", payment: false }
    );
    res.redirect("/failure-page");
  } catch (error) {
    console.error("Error handling failure:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to process payment" });
  }
};

export {
  placeOrder,
  allOrders,
  userOrders,
  updateStatus,
  placeOrderMidtrans,
  handleNotification,
  handleSuccess,
  handleFailure,
};
