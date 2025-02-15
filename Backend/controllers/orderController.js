// --- backend/controllers/orderController.js ---
import orderModel from "../models/ordermodel.js";
import Product from "../models/productModel.js"; // Import Product Model
import midtransClient from "midtrans-client";
import { v4 as uuidv4 } from "uuid";
import mongoose from "mongoose";

// Initialize Snap
let snap = new midtransClient.Snap({
    isProduction: process.env.MIDTRANS_IS_PRODUCTION === "true",
    serverKey: process.env.MIDTRANS_SERVER_KEY,
    clientKey: process.env.MIDTRANS_CLIENT_KEY,
});

// Helper Function to Create an Order
const createOrder = async (
    userId,
    items,
    amount,
    address,
    paymentMethod,
    ongkir,
    transactionToken = null,
    order_id = uuidv4(),
    session = null // Penting:  Terima session
) => {
    try {
        const orderData = {
            userId,
            items, // Simpan items yang sudah dimodifikasi
            address,
            status: "pending",
            amount,
            paymentMethod,
            ongkir,
            payment: false,
            transactionToken,
            orderId: order_id,
            date: Date.now(),
        };

        const newOrder = new orderModel(orderData);
        const savedOrder = await newOrder.save({ session }); // Gunakan session
        return savedOrder;
    } catch (error) {
        console.error("Error creating order:", error);
        throw error;
    }
};

// Place Order with Midtrans Payment
// --- backend/controllers/orderController.js
// ... (other imports and functions) ...

const placeOrderMidtrans = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { items, amount, address, ongkir } = req.body;
        const userId = req.user?._id || req.params.userId || req.query.userId;
        console.log("Received items in placeOrderMidtrans:", items); // Add this

        if (!userId) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ success: false, message: "User tidak ditemukan" });
        }

        const item_details = [];
        const itemsForOrder = []; // Array to store items for the order

        for (const item of items) {
            let product;
            let variantOption;
            let itemForOrder = { ...item }; // Copy the item

            if (item.variant && item.variant.variantId) {
                // --- Product with Variant ---
                product = await Product.findOne({
                    "variants._id": item.variant.variantId,
                    "variants.options._id": item.variant.selectedOption.optionId
                }).session(session);

                if (!product) {
                    await session.abortTransaction();
                    session.endSession();
                    return res.status(404).json({ success: false, message: `Produk tidak ditemukan (variant)` });
                }

                const variant = product.variants.find(v => v._id.toString() === item.variant.variantId.toString());
                if (!variant) {
                    await session.abortTransaction();
                    session.endSession();
                    return res.status(404).json({ success: false, message: "Varian tidak ditemukan" });
                }

                variantOption = variant.options.find(o => o._id.toString() === item.variant.selectedOption.optionId.toString());
                if (!variantOption) {
                    await session.abortTransaction();
                    session.endSession();
                    return res.status(404).json({ success: false, message: `Opsi varian tidak ditemukan` });
                }

                if (variantOption.stock < item.quantity) {
                    await session.abortTransaction();
                    session.endSession();
                    const itemName = `${product.name} - ${variant.name} - ${variantOption.name}`;
                    const truncatedName = itemName.length > 50 ? itemName.substring(0, 47) + "..." : itemName;
                    return res.status(400).json({ 
                        success: false, 
                        message: `Stok tidak cukup untuk produk: ${truncatedName}` 
                    });
                }

                // --- Truncate the name for Midtrans ---
                const itemName = `${product.name} - ${variant.name} - ${variantOption.name}`;
                const truncatedName = itemName.length > 50 ? itemName.substring(0, 47) + "..." : itemName;

                item_details.push({
                    id: variantOption._id.toString(),  // Use optionId (_id of the option)
                    price: variantOption.price,
                    quantity: item.quantity,
                    name: truncatedName, // Use the truncated name
                });

                // --- Prepare item for order (Corrected) ---
                itemForOrder.productId = product._id.toString(); // Store product's _id as a string
                itemForOrder.image = product.images[0];
                itemForOrder.variant = {
                    variantId: variant._id.toString(),  // Store as string
                    variantName: variant.name,
                    selectedOption: {
                        optionId: variantOption._id.toString(), // Store as string
                        optionName: variantOption.name,
                        optionPrice: variantOption.price,
                        optionStock: variantOption.stock,
                        optionSku: variantOption.sku,
                        optionWeight: variantOption.weight,
                    }
                };
                itemsForOrder.push(itemForOrder);

            } else {
                // --- Main Product (No Variant) ---
                console.log("Looking up product by ID (from item.id):", item.id); // Log the ID being used
                product = await Product.findById(item.id).session(session); //  CRITICAL FIX: Use item.id
                if (!product) {
                    await session.abortTransaction();
                    session.endSession();
                    return res.status(404).json({ success: false, message: `Produk tidak ditemukan (main)` });
                }
                console.log("Found product:", product);

                if (product.stock < item.quantity) {
                    await session.abortTransaction();
                    session.endSession();
                    const itemName = product.name;
                    const truncatedName = itemName.length > 50 ? itemName.substring(0, 47) + "..." : itemName;
                    return res.status(400).json({ 
                        success: false, 
                        message: `Stok tidak cukup untuk produk: ${truncatedName}` 
                    });
                }

                const itemName = product.name;
                const truncatedName = itemName.length > 50 ? itemName.substring(0, 47) + "..." : itemName;

                item_details.push({
                    id: product._id.toString(),  // Use product's _id
                    price: product.price,
                    quantity: item.quantity,
                    name: truncatedName,
                });

                // --- Prepare item for order (Corrected) ---
                itemForOrder.productId = product._id.toString(); // Store product's _id as string
                itemForOrder.image = product.images[0];
                itemsForOrder.push(itemForOrder);
            }
        }

        // Add ongkir to item_details
        item_details.push({
            id: "biaya_pengiriman",
            price: ongkir,
            quantity: 1,
            name: "Biaya Pengiriman",
        });

        // Calculate gross_amount
        const gross_amount = item_details.reduce((total, item) => {
            return total + (item.price * item.quantity)
        }, 0);

        // --- Midtrans Transaction Parameters ---
        const parameter = {
            transaction_details: {
                order_id: uuidv4(), // Generate a new order ID
                gross_amount,
            },
            credit_card: {
                secure: true,
            },
            customer_details: {
                first_name: address.firstName,
                last_name: address.lastName,
                email: address.email,
                phone: address.phone,
                shipping_address: {
                    firstName: address.firstName,
                    lastName: address.lastName,
                    email: address.email,
                    phone: address.phone,
                    address: address.address,
                    provinceId: address.provinceId,
                    cityId: address.cityId,
                    state: address.state,
                    postalCode: address.postalCode,
                },
            },
            item_details,
        };

        console.log("Midtrans parameter:", parameter);

        // --- Create Midtrans Transaction ---
        const transaction = await snap.createTransaction(parameter);
        if (!transaction || !transaction.token) {
            await session.abortTransaction();
            session.endSession();
            return res.status(500).json({ success: false, message: "Gagal mengenerate token pembayaran" });
        }

        // --- Create Order (using itemsForOrder) ---
        const newOrder = await createOrder(
            userId,
            itemsForOrder,  // Use the correctly prepared items
            gross_amount,
            address,
            "Midtrans",
            ongkir,
            transaction.token,
            parameter.transaction_details.order_id, // Use consistent order_id
            session
        );

        await session.commitTransaction();
        session.endSession();

        res.status(201).json({
            success: true,
            message: "Pesanan berhasil dibuat",
            token: transaction.token,
            redirect_url: transaction.redirect_url,
            orderId: parameter.transaction_details.order_id,
        });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error("Error placing Midtrans order:", error);
        console.error("Midtrans Error Details:", error.ApiResponse); // Log detailed Midtrans error
        res.status(500).json({ success: false, message: "Gagal membuat pesanan", error: error.message });
    }
};


// ... (rest of orderController.js, including handleNotification, remains the same) ...

// Midtrans Notification Handler
const handleNotification = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const notification = req.body;
        console.log("🔔 Notification received:", notification);

        // --- Validasi Dasar ---
        if (
            !notification.order_id ||
            !notification.transaction_status ||
            !notification.fraud_status
        ) {
            console.error("❌ Invalid notification data:", notification); // Log data yang tidak valid
            return res.status(400).send("Invalid notification data");
        }

        const orderId = notification.order_id;
        const transactionStatus = notification.transaction_status;
        const fraudStatus = notification.fraud_status;
        const paymentType = notification.payment_type;

        // --- Ekstraksi Informasi VA ---
        let vaNumber = null;
        let bank = null;

        if (notification.va_numbers && notification.va_numbers.length > 0) {
            vaNumber = notification.va_numbers[0].va_number;
            bank = notification.va_numbers[0].bank;
        }

        console.log(`ℹ️ Order ID: ${orderId}, Transaction Status: ${transactionStatus}, Fraud Status: ${fraudStatus}, Payment Type: ${paymentType}, VA Number: ${vaNumber}, Bank: ${bank}`);

        let newStatus = "pending";
        let paymentStatus = false;

        // --- Penentuan Status Berdasarkan Notifikasi ---
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

        if (fraudStatus === "challenge") {
            newStatus = "pending"; // Tetap pending jika di-challenge
        } else if (fraudStatus === "deny") {
            newStatus = "failed";
            paymentStatus = false;
        }

        console.log(`ℹ️ New status to be updated: ${newStatus}, Payment status: ${paymentStatus}`);

        // --- Cari dan Perbarui Pesanan ---
        const updatedOrder = await orderModel.findOneAndUpdate(
            { orderId: orderId },
            {
                status: newStatus,
                payment: paymentStatus,
                paymentType,
                vaNumber,
                bank,
            },
            { new: true }
        ).session(session);

        if (!updatedOrder) {
            await session.abortTransaction();
            session.endSession();
            console.error(`❌ Order not found for order ID: ${orderId}`);
            return res.status(404).send("Order not found");
        }

        console.log("✅ Order found and updated (status, payment):", updatedOrder);

        // --- Pengurangan Stok (Hanya Jika Pembayaran Berhasil) ---
        if (newStatus === "paid") {
            console.log("ℹ️ Starting stock reduction...");

            for (const item of updatedOrder.items) {
                console.log(`\n--- Processing item:`, item);
                let product;

                if (item.variant && item.variant.variantId) {
                    // --- Update Stok untuk Varian ---
                    console.log("ℹ️ Item has a variant.  Updating variant stock...");

                    // 1.  Cari Produk
                    product = await Product.findOne({
                        "variants._id": item.variant.variantId,
                        "variants.options._id": item.variant.selectedOption.optionId,
                    }).session(session);


                    if (!product) {
                        await session.abortTransaction();
                        session.endSession();
                        console.error(`❌ Product not found for variant ID: ${item.variant.variantId}, option ID: ${item.variant.selectedOption.optionId}`);
                        throw new Error(`Product not found for variant/option`);
                    }
                    console.log("✅ Product found:", product.name);


                   // 2.  Temukan varian (gunakan _id)
                    const variant = product.variants.find(v => v._id.toString() === item.variant.variantId.toString()); // Use toString()
    
                    if (!variant) {
                      await session.abortTransaction();
                      session.endSession();
                      throw new Error(`Variant not found: ${item.variant.variantId}`);
                    }
                    console.log("✅ Variant found:", variant.name);

                    // 3. Temukan Opsi Varian
                    const option = variant.options.find(o => o._id.toString() === item.variant.selectedOption.optionId.toString()); // Use toString()
                     if (!option) {
                        await session.abortTransaction();
                        session.endSession();
                        throw new Error(`Variant option not found: ${item.variant.selectedOption.optionId}`);
                     }
                    console.log("✅ Option found:", option.name, "Current Stock:", option.stock);

                    // 4.  Validasi Stok (sebelum update)
                    if (option.stock < item.quantity) {
                        await session.abortTransaction();
                        session.endSession();
                        console.error(`❌ Insufficient stock for variant option.  Required: ${item.quantity}, Available: ${option.stock}`);
                        throw new Error(`Insufficient stock for variant option: ${option.name}`);
                    }

                    // 5.  Perbarui Stok (gunakan $inc dan arrayFilters)
                      const updateResult = await Product.updateOne(
                        { _id: product._id },
                        { $inc: { "variants.$[v].options.$[o].stock": -item.quantity } },
                        {
                            arrayFilters: [
                                { "v._id": variant._id },        //  _id dari variant
                                { "o._id": option._id },         //  _id dari option
                            ],
                            session, // Sangat penting:  Gunakan session!
                        }
                    );
                    console.log("🔄 Stock update result:", updateResult);


                    // 6.  Validasi Hasil Update
                    if (updateResult.modifiedCount === 0) {
                        await session.abortTransaction();
                        session.endSession();
                        console.error("❌ Failed to update stock for variant option.  No documents modified.");
                        throw new Error(`Failed to update stock for variant option: ${option.sku}`);
                    }

                    console.log(`✅ Stock updated successfully for variant option.  Reduced by: ${item.quantity}`);


                } else {
                    // --- Update Stok untuk Produk Utama (Tanpa Varian) ---
                    console.log("ℹ️ Item is a main product. Updating main product stock...");

                    // 1. Cari Produk (berdasarkan ID Produk)
                    product = await Product.findById(item.productId).session(session); // Perbaikan: Gunakan item.productId
                    if (!product) {
                        await session.abortTransaction();
                        session.endSession();
                        console.error(`❌ Product not found for ID: ${item.productId}`); // Log productId yang benar
                        throw new Error(`Product not found for ID: ${item.productId}`);
                    }

                    console.log("✅ Product found:", product.name);

                    // 2. Validasi Stok
                    if (product.stock < item.quantity) {
                        await session.abortTransaction();
                        session.endSession();
                        console.error(`❌ Insufficient stock for main product. Required: ${item.quantity}, Available: ${product.stock}`);
                        throw new Error(`Insufficient stock for product: ${product.name}`);
                    }

                    // 3. Perbarui Stok
                    product.stock -= item.quantity;
                    await product.save({ session }); // Gunakan session!

                    console.log(`✅ Main product stock updated successfully. Reduced by: ${item.quantity}`);
                }
            }
            console.log("ℹ️ Stock reduction completed.");
        }

        await session.commitTransaction();
        session.endSession();
        console.log("✅✅✅ Transaction completed successfully.  Order and stock updated.");
        res.status(200).json({ success: true, message: "OK" });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error("❌❌❌ Error handling notification:", error);
        res.status(500).send("Internal Server Error");
    }
};

// ... (fungsi-fungsi lain di orderController TETAP SAMA, KECUALI allOrders, userOrders, updateOrderStatus, updateStatus) ...

// Fetch All Orders (for Admin Panel)
const allOrders = async (req, res) => {
    try {
        const orders = await orderModel.find({}).populate('userId', 'name email'); // Populate user details
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
        const orders = await orderModel.find({ userId }).populate('userId', 'name email'); // Populate user details

        if (!orders || orders.length === 0) {
            return res.status(404).json({ success: false, message: "No orders found" });
        }

        res.json({ success: true, orders });
    } catch (error) {
        console.error("Error fetching user orders:", error);
        res.status(500).json({ success: false, message: "Failed to fetch orders", error: error.message });
    }
};

// Update Order Status (ADMIN ONLY)
const updateOrderStatus = async (req, res) => {
    try {
        const { orderId, status, notes, trackingNumber } = req.body;

        if (!orderId || !status) {
            return res.status(400).json({ success: false, message: "orderId and status are required" });
        }
        if (!["Order Received", "Packing", "In Transit", "Delivered", "failed"].includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status value" });
        }

        const updatedOrder = await orderModel.findOneAndUpdate(
            { orderId: orderId },
            {
                status,
                ...(notes && { notes }),
                ...(trackingNumber && { trackingNumber }),
            },
            { new: true }
        ).populate('userId', 'name email'); // Populate user details

        if (!updatedOrder) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        res.json({ success: true, message: "Order status updated", order: updatedOrder });
    } catch (error) {
        console.error("Error updating order status:", error);
        res.status(500).json({ success: false, message: "Failed to update order status", error: error.message });
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
      ).populate('userId', 'name email'); // Populate user details
  
      if (!updatedOrder) {
        return res.status(404).json({ message: "Order not found" });
      }
  
      res.json({ success: true, message: "Status Update", order: updatedOrder });
    } catch (error) {
      console.log(error);
      res.json({ success: false, message: error.message });
    }
  };
// Export all controller functions
export {
    allOrders,
    userOrders,
    updateStatus,
    placeOrderMidtrans,
    handleNotification,
    updateOrderStatus,
};
    
