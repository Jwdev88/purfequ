// --- models/ordermodel.js ---
import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    items: { type: Array, required: true },
    amount: { type: Number, required: true },
    address: { type: Object, required: true },
    ongkir: { type: Number, required: true },
    status: {
        type: String,
        required: true,
        enum: ['pending', 'paid', 'Order Received', 'Packing', 'In Transit', 'Delivered', 'failed'],
        default: 'pending'
    },
    paymentMethod: { type: String, required: true },
    payment: { type: Boolean, required: true, default: false },
    transactionToken: { type: String },
    date: { type: Date, required: true },
    orderId: { type: String, required: true, unique: true },
    notes: { type: String, default: '' },
    trackingNumber: { type: String, default: '' },
    paymentType: { type: String },
    vaNumber: { type: String },  //  <-- Add VA Number field
    bank: { type: String },      //  <-- Add Bank field
}, { timestamps: true });

const orderModel = mongoose.models.order || mongoose.model('order', orderSchema);

export default orderModel;