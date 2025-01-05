import React, { useContext, useMemo } from "react";
import { ShopContext } from "../context/ShopContext";
import Title from "./Title";
import ProductItem from "./ProductItem";

const BestSeller = () => {
  const { products } = useContext(ShopContext);

  // Menggunakan useMemo untuk memfilter dan mengambil produk best seller hanya jika `products` berubah
  const bestSellers = useMemo(() => {
    if (!products || !products.length) return [];
    return products.filter((product) => product.bestSeller).slice(0, 5);
  }, [products]);

  return (
    <div className="my-10">
      {/* Section Title */}
      <div className="text-center text-3x1 py-8">
        <Title text1={"BEST"} text2={"SELLERS"} />
        <p className="w-3/4 m-auto text-xs sm:text-sm md:text-base text-gray-600">
          Discover our best-selling products carefully selected to meet your needs. Quality and satisfaction guaranteed!
        </p>
      </div>

      {/* Rendering Best Products */}
      {bestSellers.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 gap-y-6">
          {bestSellers.map((product) => (
            <ProductItem
              key={product._id}
              id={product._id}
              image={product.image}
              name={product.name}
              price={product.price}
            />
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-500 mt-10">
          <p>No best-selling products found.</p>
        </div>
      )}
    </div>
  );
};

export default BestSeller;
