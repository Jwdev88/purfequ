import React, { useContext, useReducer, useEffect } from "react";
import { ShopContext } from "../context/ShopContext";
import { Link as RouterLink } from "react-router-dom";
import { Sparkles } from "lucide-react";

const initialState = {
  product: null,
  variantPrices: [],
};

const reducer = (state, action) => {
  switch (action.type) {
    case "SET_PRODUCT":
      return {
        ...state,
        product: action.payload,
        variantPrices: action.payload?.variants?.flatMap((variant) =>
        variant.options.map((option) => option.price)
      ) || [],
      };
    default:
      return state;
  }
};

const ProductItem = ({ id, name, price, optionPrices }) => {
  const { formatIDR, products } = useContext(ShopContext);
  const [state, dispatchLocal] = useReducer(reducer, initialState);
  const { product, variantPrices } = state;

  // Determine price
  const formattedPrice = price ? `IDR ${price.toLocaleString()}` : 'Not Available';
  
  // If variant prices exist, show the lowest price
  const formattedOptionPrices = variantPrices.length > 0
    ? `IDR ${Math.min(...variantPrices).toLocaleString()}`
    : formattedPrice;

  useEffect(() => {
    const fetchedProduct = products.find((item) => item._id === id);
    dispatchLocal({ type: "SET_PRODUCT", payload: fetchedProduct });
  }, [products, id]);

  if (!product) return null;

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200 transition-transform transform hover:scale-105">
      <RouterLink to={`/product/${id}`} className="block">
        {/* Image container */}
        <div className="relative w-full h-60">
          <img
            src={product.images?.[0] || "default-image-url.jpg"}
            alt={product.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>

        {/* Product Info */}
        <div className="p-4">
          {/* Product Name */}
          <div className="text-sm font-medium text-gray-800 truncate" title={product.name}>
            {product.name}
          </div>

          {/* Product Price */}
          <div className="font-bold text-gray-800 mt-2">
            {variantPrices.length > 0 ?(
              <>
                {formatIDR(...variantPrices)}
              </>
            ) : (
              formatIDR(product.price||0)
            )
          }
          </div>

          {/* Product Rating */}
          <div className="flex mt-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Sparkles
                key={i}
                className={`w-5 h-5 ${i < Math.floor(product.rating) ? "text-yellow-400" : "text-gray-300"}`}
              />
            ))}
          </div>
        </div>
      </RouterLink>
    </div>
  );
};

export default ProductItem;
