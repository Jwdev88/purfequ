import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from './config/mongodb.js';
import connectCloudinary from './config/cloudinary.js';
import userRouter from './routes/userRoute.js';
import productRouter from './routes/productRoute.js';
import cartRouter from './routes/cartRoute.js';
import orderRouter from './routes/orederRoute.js';
import rajaOngkirRouter from './routes/rajaOngkirRoute.js';
import categoryRouter from './routes/categoryRoute.js';
import subCategoryRouter from './routes/subCategoryRoute.js';

//app config
const app = express();
const port= process.env.PORT || 4000;
connectDB()
connectCloudinary()
//middleware
app.use(express.json())
app.use(cors())
//api endpoint
app.use('/api/user',userRouter)
app.use('/api/product',productRouter)
app.use('/api/cart', cartRouter)
app.use('/api/order',orderRouter)
app.use('/api/rajaongkir',rajaOngkirRouter)
app.use('/api/category',categoryRouter)
app.use('/api/subcategory',subCategoryRouter)
// Log semua routes yang terdaftar


app.listen(port,()=>console.log(`Server Started on PORT : `+ port))
