// --- components/ProductItem.jsx ---
import React, { useContext, useMemo } from "react";
import { Link as RouterLink } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";

const ProductItem = ({ product }) => {
  const { formatIDR } = useContext(ShopContext);

  if (!product) {
    return null; // Or some placeholder
  }

    // --- Calculate Price to Display (CORRECTED) ---
    const priceToDisplay = useMemo(() => {
    if (product.variants && product.variants.length > 0) {
      // Find the minimum option price across all variants
      const minPrice = product.variants.reduce((min, variant) => {
        const optionPrices = variant.options.map((option) => option.price);
        const variantMin = Math.min(...optionPrices);
        return Math.min(min, variantMin);
      }, Infinity); // Initialize with Infinity

      return minPrice; // Return number
    } else {
      // No variants, use the main product price
      return product.price ?? null; // Return number or null
    }
  }, [product]); // Depend on the entire product object


    // --- Calculate Stock to Display ---
    const stockToDisplay = useMemo(() => {
        if (product.variants && product.variants.length > 0) {
            // Sum the stock of all options across all variants
            return product.variants.reduce((totalStock, variant) => {
                const variantStock = variant.options.reduce((sum, option) => sum + option.stock, 0);
                return totalStock + variantStock;
            }, 0);
        } else {
            // Return the main product stock
            return product.stock ?? 0; // Default to 0 if stock is undefined/null
        }
    }, [product]);

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200 transition-transform transform hover:scale-105">
      <RouterLink to={`/product/${product._id}`} className="block">
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
          <h3 className="text-lg font-semibold text-gray-800 truncate" title={product.name}>
            {product.name}
          </h3>
          {/* Product Price (CORRECTED) */}
            <p className="mt-1 text-gray-600 font-bold">
                {product.variants && product.variants.length > 0 ? (
                    <>
                        From {formatIDR(priceToDisplay)}
                    </>
                ) : (
                  priceToDisplay !== null ? formatIDR(priceToDisplay) : "Not Available" // Use the component
                )}
            </p>
          {/* Display Stock */}
          <p className="text-sm text-gray-500">
            Stock:{" "}
            {stockToDisplay > 0 ? (
              stockToDisplay
            ) : (
              <span className="text-red-500">Out of Stock</span>
            )}
          </p>
        </div>
      </RouterLink>
    </div>
  );
};

export default ProductItem;