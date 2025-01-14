import React, { useContext, useMemo } from "react";
import { ShopContext } from "../context/ShopContext";
import Title from "./Title";
import ProductItem from "./ProductItem";

const BestSeller = () => {
  const { products } = useContext(ShopContext);

  // Filter best sellers using useMemo
  const bestSellers = useMemo(() => {
    if (!products || !products.length) return [];
    return products.filter((product) => product.bestSeller).slice(0, 5);
  }, [products]);

  return (
    <div className="py-10 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Title */}
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-4xl font-bold text-gray-800 dark:text-gray-200">
            <Title text1="BEST" text2="SELLERS" />
          </h2>
        </div>

        {/* Products Grid */}
        {bestSellers.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {bestSellers.map((product) => (
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
        ) : (
          <p className="text-center text-gray-500 mt-8">No products found.</p>
        )}
      </div>
    </div>
  );
};

export default BestSeller;
