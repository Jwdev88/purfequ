// app.js (or your main server file)
import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import connectDB from './config/mongodb.js';
import connectCloudinary from './config/cloudinary.js';
import userRouter from './routes/userRoute.js';
import productRouter from './routes/productRoute.js';
import cartRouter from './routes/cartRoute.js';
import orderRouter from './routes/orederRoute.js';  // Corrected typo: orderRoute.js
import rajaOngkirRouter from './routes/rajaOngkirRoute.js';
import categoryRouter from './routes/categoryRoute.js';
import subCategoryRouter from './routes/subCategoryRoute.js';

const app = express();
const port = process.env.PORT || 4000;

// --- Connect to Database and Cloudinary ---
connectDB().catch(err => {
    console.error("Database connection failed:", err);
    process.exit(1); // Exit if database connection fails
});

connectCloudinary().catch(err => {
    console.error("Cloudinary connection failed:", err); // Don't exit for Cloudinary
    // You *might* want to continue even if Cloudinary fails, depending on your app.
});

// --- Middleware ---
app.use(express.json()); // Use express.json() for JSON parsing
app.use(cors());        // Enable CORS

// --- Routes ---
app.get('/', (req, res) => {
    res.send('Server is running');
});

app.use('/api/user', userRouter);
app.use('/api/product', productRouter);
app.use('/api/cart', cartRouter);
app.use('/api/order', orderRouter);
app.use('/api/rajaongkir', rajaOngkirRouter);
app.use('/api/category', categoryRouter);
app.use('/api/subcategory', subCategoryRouter);

// --- 404 Handler (MUST be after your routes) ---
app.use((req, res, next) => {  // Use next
    res.status(404).json({ success: false, message: "Route not found" }); // Send JSON response
});

// --- Error Handler (MUST be after the 404 handler) ---
app.use((err, req, res, next) => {
    console.error(err.stack); // Log the full error stack
    res.status(500).json({ success: false, message: "Internal Server Error", error: err.message }); // More informative
});

app.get('/favicon.ico', (req, res) => {
    res.status(204).end(); // 204 No Content (tidak mengembalikan apapun)
});

// --- Start Server ---
const server = app.listen(port, () => console.log(`Server started on PORT: ${port}`));

// --- Server Timeout ---
server.setTimeout(30000); // Set server timeout (30 seconds is a good starting point)
server.keepAliveTimeout = 60000; // keep alive.