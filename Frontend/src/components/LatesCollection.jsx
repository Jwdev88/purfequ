import React, { useContext, useMemo } from "react";
import { ShopContext } from "../context/ShopContext";
import Title from "./Title";
import ProductItem from "./ProductItem";
import { Link } from 'react-router-dom';

const LatestCollection = () => {
    const { products } = useContext(ShopContext);

    const latestProducts = useMemo(() => {
        if (!products || products.length === 0) return [];
        return [...products]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 10);
    }, [products]);

    return (
        <section className="py-12 bg-gray-50">
            <div className="container mx-auto px-4">
                {/* Improved SEO Heading */}
                <div className="text-center mb-10">
                    <h2 className="text-3xl font-bold text-gray-900">
                        <Title text1="LATEST" text2="COLLECTIONS" />
                    </h2>
                    <p className="text-gray-600 mt-2">
                        Explore our latest and trendiest arrivals, handpicked just for you.
                    </p>
                </div>

                {/* Products Grid */}
                {latestProducts.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-6">
                        {latestProducts.map((product) => (
                            <ProductItem
                                key={product._id}
                                id={product._id}
                                image={product.images?.[0]}
                                name={product.name}
                                product={product}
                                altText={product.name || "New collection item"} // Ensure alt text
                            />
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-gray-500 mt-8">No products found.</p>
                )}

                {/* View All Products Button */}
                <div className="text-center mt-12">
                    <Link 
                        to="/collection" 
                        className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-full transition duration-200 shadow-md hover:shadow-lg"
                        aria-label="View all latest collection products"
                    >
                        View All Products
                    </Link>
                </div>
            </div>
        </section>
    );
};

export default LatestCollection;
