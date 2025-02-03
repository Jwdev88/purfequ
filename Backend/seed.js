import * as dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { faker } from "@faker-js/faker";
import Product from "./models/productModel.js";
import Category from "./models/categoryModel.js";
import SubCategory from "./models/subCategoryModel.js";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error("❌ Error: MONGODB_URI is not defined in .env!");
    process.exit(1);
}

// Connect to MongoDB with improved options
mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 30000,
})
    .then(() => console.log("✅ Connected to MongoDB Atlas"))
    .catch((err) => {
        console.error("❌ MongoDB Connection Error:", err);
        process.exit(1);
    });

const generateProducts = async (numProducts) => {
    try {
        const categories = await Category.find();
        const subCategories = await SubCategory.find();

        if (!categories.length || !subCategories.length) {
            console.error("❌ No categories or subcategories found in the database.");
            mongoose.disconnect();
            return;
        }

        let productsToInsert = [];

        for (let i = 0; i < numProducts; i++) {
            const randomCategory = categories[Math.floor(Math.random() * categories.length)];
            const randomSubCategory = subCategories[Math.floor(Math.random() * subCategories.length)];

            const newProductData = {
                name: faker.commerce.productName(),
                description: faker.lorem.paragraph() || "Default Description",
                category: randomCategory._id,
                subCategory: randomSubCategory._id,
                price: parseFloat(faker.commerce.price()),
                discount: faker.number.int({ min: 0, max: 50 }),
                stock: faker.number.int({ min: 0, max: 1000 }),
                weight: faker.number.int({ min: 100, max: 5000 }),
                minOrder: 1,
                images: [faker.image.url(), faker.image.url()],
                variants: [],
                bestSeller: faker.datatype.boolean(),
                rating: faker.number.int({ min: 1, max: 5 }),
            };

            const numVariants = faker.number.int({ min: 0, max: 3 });
            for (let j = 0; j < numVariants; j++) {
                const newVariant = {
                    name: faker.lorem.word(),
                    options: [],
                };

                const numOptions = faker.number.int({ min: 1, max: 3 });
                for (let k = 0; k < numOptions; k++) {
                    newVariant.options.push({
                        name: faker.lorem.word(),
                        sku: faker.string.alphanumeric(8).toUpperCase(),
                        price: parseFloat(faker.commerce.price()),
                        stock: faker.number.int({ min: 0, max: 1000 }),
                        weight: faker.number.int({ min: 100, max: 5000 }),
                    });
                }
                newProductData.variants.push(newVariant);
            }

            if (!newProductData.variants.length) {
                newProductData.sku = faker.string.alphanumeric(8).toUpperCase();
            }

            productsToInsert.push(newProductData);
        }

        // Bulk insert for better performance
        const insertedProducts = await Product.insertMany(productsToInsert, { w: "majority" });
        console.log(`✅ Successfully inserted ${insertedProducts.length} products.`);

        // Verify data insertion
        const checkData = await Product.find().limit(5);
        console.log("🔍 Sample Data from DB:", checkData);
    } catch (error) {
        console.error("❌ Error generating products:", error);
    } finally {
        mongoose.disconnect();
        console.log("🔌 MongoDB connection closed.");
    }
};

const numberOfProductsToGenerate = 1000;
generateProducts(numberOfProductsToGenerate);
