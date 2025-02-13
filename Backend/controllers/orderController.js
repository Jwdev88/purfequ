// --- backend/controllers/orderController.js ---
import orderModel from "../models/ordermodel.js";
import UserModel from "../models/userModel.js";
import midtransClient from "midtrans-client";
import { v4 as uuidv4 } from "uuid";

// Initialize Snap (for creating transactions).  Use environment variables!
let snap = new midtransClient.Snap({
    isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true', // Use env var, and convert to boolean
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
            status: "Order Placed", // Initial status
            amount,
            paymentMethod,
            ongkir,
            payment: false, // Initial payment status (updated by webhook)
            transactionToken,  // Store the Midtrans token
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
        const userId = req.user?._id;  // Get userId from authenticated user

        if (!userId) {
            return res.status(400).json({ success: false, message: "Missing userId" });
        }

        // Prepare item details for Midtrans
        const item_details = items.map((item) => ({
            id: item.id || item.productId, // Use a consistent ID
            price: item.price || 0,  // Handle potential missing prices
            quantity: item.quantity,
            name: item.name || "Unnamed Product", // Handle potential missing names
        }));

        // Add shipping cost as an item
        const ongkir_id = uuidv4(); // Use a UUID for the shipping cost item ID
        item_details.push({
            id: ongkir_id, //It can be anything
            price: ongkir,
            quantity: 1,
            name: "Biaya Pengiriman",
        });

        // Calculate the total amount (gross amount)
        const gross_amount = item_details.reduce((total, item) => total + item.price * item.quantity, 0);

        // Generate a unique order ID *without* any prefixes
        const order_id = uuidv4(); //  <--  IMPORTANT:  Use a plain UUID

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
        console.log("parameter:", parameter)

        // Create Midtrans transaction
        const transaction = await snap.createTransaction(parameter);

        if (!transaction || !transaction.token) {
            return res.status(500).json({ success: false, message: "Failed to generate payment token" });
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
        newOrder.status = "pending";
        await newOrder.save()
        // Clear the user's cart (assuming you have a cart in your user model)
        // await UserModel.findByIdAndUpdate(userId, { cartData: [] }); // Clear cart *after* successful order creation

        res.status(201).json({
            success: true,
            message: "Order Placed",
            token: transaction.token,  // Send the Midtrans token to the frontend
            redirect_url: transaction.redirect_url, // And the redirect URL
            orderId: order_id, //  Send the *correct* order ID
        });

    } catch (error) {
        console.error("Error placing Midtrans order:", error);
        res.status(500).json({ success: false, message: "Failed to place order", error: error.message });
    }
};

// Midtrans Notification Handler (Webhook)
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

        console.log(`Order ID: ${orderId}, Transaction Status: ${transactionStatus}, Fraud Status: ${fraudStatus}`);

        let newStatus = "pending"; // Default status
        let paymentStatus = false;   // Default payment status

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
        } // Add more status handling as needed (e.g., 'refund', 'chargeback')

        console.log(`New status to be updated: ${newStatus}`);


        // --- Update Order Status in Database ---
        const updatedOrder = await orderModel.findOneAndUpdate(
            { orderId: orderId },  // Find by orderId (the UUID we generated)
            { status: newStatus, payment: paymentStatus },  // Update status and payment
            { new: true } // Return the updated document
        );

        if (!updatedOrder) {
            console.error(`Order not found for order ID: ${orderId}`);
            return res.status(404).send("Order not found"); // Important: 404 if not found
        }

        console.log("✅ Order updated successfully:", updatedOrder);
        res.status(200).json({ success: true, message: "OK" }); // ALWAYS return 200 OK to Midtrans

    } catch (error) {
        console.error("❌ Error handling notification:", error);
        res.status(500).send("Internal Server Error"); // Generic error for other issues
    }
};


// Fetch All Orders (for Admin Panel)
const allOrders = async (req, res) => {
    try {
        const orders = await orderModel.find({}); // Find *all* orders
        res.json({ success: true, orders });
    } catch (error) {
        console.error("Error fetching all orders:", error);
        res.status(500).json({ success: false, message: "Failed to fetch orders", error: error.message });
    }
};

// Fetch User Orders (for Users)
const userOrders = async (req, res) => {
    try {
        if (!req.user || !req.user._id) {
            return res.status(401).json({ success: false, message: "User not authenticated" });
        }

        const userId = req.user._id;
        const orders = await orderModel.find({ userId }); // Find orders for the specific user

        if (!orders || orders.length === 0) {
            return res.status(404).json({ success: false, message: "No orders found" });
        }

        res.json({ success: true, orders });
    } catch (error) {
        console.error("Error fetching user orders:", error);
        res.status(500).json({ success: false, message: "Failed to fetch orders", error: error.message });
    }
};

// Update Order Status (for Admin Panel)
const updateStatus = async (req, res) => {
    try {
        const { orderId, status } = req.body;
        //  You might want to add validation here to check if 'status' is a valid status

        const updatedOrder = await orderModel.findByIdAndUpdate(orderId, { status }, { new: true });

        if (!updatedOrder) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        res.json({ success: true, message: "Status updated", order: updatedOrder });
    } catch (error) {
        console.error("Error updating order status:", error);
        res.status(500).json({ success: false, message: "Failed to update status", error: error.message });
    }
};



export {
    allOrders,
    userOrders,
    updateStatus,
    placeOrderMidtrans,
    handleNotification,
};