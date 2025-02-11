// LatestCollection.jsx
import React, { useContext, useMemo } from "react";
import { ShopContext } from "../context/ShopContext";
import Title from "./Title";
import ProductItem from "./ProductItem"; // Make sure this is the *updated* ProductItem
import { Link } from 'react-router-dom';

const LatestCollection = () => {
    const { products } = useContext(ShopContext);

    const latestProducts = useMemo(() => {
        if (!products || products.length === 0) {
            return [];
        }
        const sortedProducts = [...products].sort((a, b) => {
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

        return sortedProducts.slice(0, 10); // Consistent with BestSeller
    }, [products]);

    return (
        <section className="py-12 bg-gray-50">
            <div className="container mx-auto px-4">
                <div className="text-center mb-10">
                    <Title text1="LATEST" text2="COLLECTIONS" />
                    <p className="text-gray-500 mt-2">Discover our newest arrivals</p>
                </div>

                {latestProducts.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-6"> {/* Consistent grid */}
                        {latestProducts.map((product) => (
                            <ProductItem
                                key={product._id}
                                id={product._id}
                                image={product.images?.[0]}
                                name={product.name}
                                product={product} // Pass ONLY the product object
                            />
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-gray-500 mt-8">No products found.</p>
                )}
                <div className="text-center mt-12">
                    <Link to="/collection" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-full transition duration-200 shadow-md hover:shadow-lg">
                        View All Products
                    </Link>
                </div>
            </div>
        </section>
    );
};

export default LatestCollection;