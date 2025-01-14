import React, { useContext, useEffect, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import Title from "./Title";
import ProductItem from "./ProductItem";

const LatesCollection = () => {
  const { products } = useContext(ShopContext);
  const [latestProducts, setLatestProducts] = useState([]);

  useEffect(() => {
    setLatestProducts(products.slice(0, 12)); // Show the latest 12 products
  }, [products]);

  return (
    <div className="py-10 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Title */}
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-4xl font-bold text-gray-800 dark:text-gray-200">
            <Title text1="LATEST" text2="COLLECTIONS" />
          </h2>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {latestProducts.map((product) => (
            <div key={product._id}>
              <ProductItem
                id={product._id}
                image={product.images?.[0]}
                name={product.name}
                price={product.price}
                optionPrices={product.variants?.flatMap((variant) =>
                  variant.options.map((option) => option.price)
                )}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LatesCollection;
