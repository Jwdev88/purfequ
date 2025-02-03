import React, { useContext } from "react";
import { useParams } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";
import RelatedProducts from "../components/RelatedProducts";
import { Stars } from "lucide-react";
import { useProduct } from "../hooks/useProduct";

const Product = () => {
  const { productId } = useParams();
  const { formatIDR } = useContext(ShopContext);
  const { state, handleVariantChange, handleAddToCart, dispatch } =
    useProduct(productId);

  
  if (state.isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Sedang memuat...</p>
      </div>
    );
  }

  if (!state.productData) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Produk tidak ditemukan.</p>
      </div>
    );
  }

  return (
    <div className="border-t-2 pt-10 px-4 md:px-8 lg:px-16">
      <div className="flex flex-col sm:flex-row gap-12">
        {/* Product Images */}
        <div className="flex-1 flex flex-col sm:flex-row-reverse gap-4">
          <div className="w-full sm:w-[80%]">
            <img
              className="w-full h-auto rounded-lg"
              src={state.selectedImage}
              alt={state.productData.name}
            />
          </div>
          <div className="flex sm:flex-col gap-2 overflow-auto sm:w-[20%]">
            {state.productData.images.map((item, index) => (
              // Product.jsx
              <img
                key={index}
                onClick={() =>
                  dispatch({
                    type: "SET_SELECTED_IMAGE", // Use the string directly
                    payload: item,
                  })
                }
                src={item}
                className={`cursor-pointer w-[20%] sm:w-full rounded-md ${
                  state.selectedImage === item
                    ? "border-2 border-blue-500"
                    : "border"
                }`}
                alt="Thumbnail"
              />
            ))}
          </div>
        </div>

        {/* Product Details */}
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-semibold">
            {state.productData.name}
          </h1>
          <div className="flex items-center mt-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Stars
                key={i}
                className={`w-6 h-6 ${
                  i < Math.floor(state.productData.rating)
                    ? "text-yellow-400"
                    : "text-gray-300"
                }`}
              />
            ))}
            <span className="ml-2 text-lg text-gray-700 dark:text-gray-300">
              {state.productData.rating.toFixed(1)}
            </span>
          </div>
          <p className="mt-2 text-2xl font-semibold text-gray-800">
            {formatIDR(state.selectedVariant?.price || state.productData.price)}
          </p>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            <span className="font-semibold">Category: </span>
            {state.productData.category.name}
          </p>
          <p className="mt-4 text-gray-700 dark:text-gray-300">
            {state.productData.description}
          </p>

          {/* Product Variants */}
          {state.productData.variants?.length > 0 && (
            <div className="mt-4">
              <p className="font-serif font-semibold text-gray-800">
                Select Variant
              </p>
              {state.productData.variants.map((variant) => (
                <div key={variant._id} className="mt-2">
                  <p className="text-gray-700 dark:text-gray-300">
                    {variant.name}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {variant.options.map((option) => (
                      <button
                        key={option._id}
                        onClick={() =>
                          handleVariantChange(variant.name, option, variant._id)
                        }
                        className={`px-4 py-2 border rounded-md ${
                          state.selectedVariant?.optionId === option._id
                            ? "border-blue-500 bg-blue-100"
                            : "border-gray-300 hover:bg-gray-200"
                        }`}
                      >
                        {option.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            disabled={state.isAddingToCart}
            className={`mt-4 px-6 py-2 rounded-md ${
              state.isAddingToCart
                ? "bg-gray-500 text-white cursor-not-allowed"
                : "bg-black text-white hover:bg-gray-800"
            }`}
          >
            {state.isAddingToCart ? "Menambahkan..." : "Tambah ke Keranjang"}
          </button>
        </div>
      </div>

      {/* Related Products */}
      <RelatedProducts
        category={state.productData.category.name}
        subCategory={state.productData.subCategory?.name}
      />
    </div>
  );
};

export default Product;
