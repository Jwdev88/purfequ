import React, { useContext, useEffect, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
const ProductItem = ({ id }) => {
  const { formatIDR, products } = useContext(ShopContext);
  const [product, setProduct] = useState({});

  useEffect(() => {
    const fetchProduct = products.find((item) => item._id === id);
    setProduct(fetchProduct);
  }, [products, id]);

  const getVariantPrices = () => {
    if (!product || !product.variants || product.variants.length === 0) {
      return []; // Handle kasus jika tidak ada varian
    }

    const variantPrices = product.variants.flatMap((variant) =>
      variant.options.map((option) => option.price)
    );

    return variantPrices;
  };

  return (
    <Link
      className="block hover:shadow-lg transition-shadow duration-200 overflow-auto rounded-md hover:bg-slate-500/10" 
      to={`/product/${id}`}
      title={product.name}
      alt={`${product.name} - ${product.category} - ${product.subCategory}`}
    >
      <div className="mt-2 flex flex-col gap-4">
        <div className="relative">
          <div className="overflow-hidden rounded-md">
            <img
              className="w-full h-60 object-cover rounded-md"
              src={product.images?.[0] || ""}
              alt={product.name}
            />
          </div>
          <div className="absolute bottom-0 left-0 p-2 bg-white/80 rounded-bl-md">
            <p className="text-sm font-semibold text-gray-800">
              {getVariantPrices().length > 0 ? (
                <>
                  <span className="text-red-500">
                    {formatIDR(Math.min(...getVariantPrices()))}
                  </span>
                  <span className="text-gray-500"> - </span>
                  <span className="text-red-500">
                    {formatIDR(Math.max(...getVariantPrices()))}
                  </span>
                </>
              ) : (
                <span className="text-red-500">
                  {formatIDR(product?.price || 0)}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="text-sm font-semibold text-gray-700 line-clamp-1 overflow-hidden flex-grow">
          {product.name}
        </div>

        <div className="mt-2 flex  items-center mr-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Sparkles
              key={i}
              className={`w-6 h-6 text-yellow-400 fill-current stroke-current stroke-2 rounded-full transition duration-200 ease-in-out hover:scale-110`}
              style={{
                opacity: i < Math.floor(product.rating) ? 1 : 0.2,
              }}
            />
          ))}
        </div>
        <span className="ml-2 text-xl font-semibold text-gray-700">
          {product.rating ? product.rating.toFixed(1) : "N/A"}
        </span>
      </div>
    </Link>
  );
};

export default ProductItem;
