// BestSeller.jsx
import React, { useContext, useMemo } from "react";
import { ShopContext } from "../context/ShopContext";
import Title from "./Title";
import ProductItem from "./ProductItem"; // Make sure this is the *updated* ProductItem
import { Link } from 'react-router-dom';

const BestSeller = () => {
    const { products } = useContext(ShopContext);

    const bestSellers = useMemo(() => {
        if (!products || !products.length) return [];
        return products.filter((product) => product.bestSeller).slice(0, 10);
    }, [products]);

    return (
        <section className="py-12 bg-gray-50">
            <div className="container mx-auto px-4">
                <div className="text-center mb-10">
                    <Title text1="BEST" text2="SELLERS" />
                    <p className="text-gray-500 mt-2">Our top-rated products</p>
                </div>

                {bestSellers.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-6"> {/*Consistent grid*/}
                        {bestSellers.map((product) => (
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
                    <p className="text-center text-gray-500 mt-8">No best-selling products found.</p>
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

export default BestSeller;