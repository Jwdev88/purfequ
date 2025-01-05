// Product.jsx
import React, { useContext } from "react";
import { useParams } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";
import RelatedProducts from "../components/RelatedProducts";
import { Stars } from "lucide-react";
import { useProduct } from "../hooks/useProduct";

const Product = () => {
  const { productId } = useParams();
  const { products, addToCart, formatIDR } = useContext(ShopContext);
  const { state, handleVariantChange, handleAddToCart } = useProduct(products, productId, addToCart, formatIDR);

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
    <div className="border-t-2 pt-10">
      <div className="flex flex-col sm:flex-row gap-12">
        <div className="flex-1 flex flex-col sm:flex-row-reverse">
          <div className="w-full sm:w-[80%]">
            <img
              className="w-full h-auto"
              src={state.selectedImage}
              alt={state.productData.name}
            />
          </div>
          <div className="flex sm:flex-col gap-2 overflow-auto sm:w-[20%]">
            {state.productData.images.map((item, index) => (
              <img
                key={index}
                onClick={() => dispatch({ type: actionTypes.SET_SELECTED_IMAGE, payload: item })}
                src={item}
                className={`cursor-pointer w-[20%] sm:w-full ${
                  state.selectedImage === item ? "border-2 border-blue-500" : "border"
                }`}
                alt="Thumbnail"
              />
            ))}
          </div>
        </div>

        <div className="flex-1">
          <h1 className="text-2xl font-semibold">{state.productData.name}</h1>
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
            <span className="ml-2 text-lg">
              {state.productData.rating.toFixed(1)}
            </span>
          </div>
          <p className="mt-2 text-2xl font-semibold">
            {formatIDR(state.selectedVariant?.price || state.productData.price)}
          </p>
          <p className="mt-2">
            <span className="font-semibold">Category: </span>
            {state.productData.category.name}
          </p>
          <p className="mt-4">{state.productData.description}</p>

          {state.productData.variants?.length > 0 && (
            <div className="mt-4">
              <p className="font-serif font-semibold">Select Variant</p>
              {state.productData.variants.map((variant) => (
                <div key={variant._id} className="mt-2">
                  <p>{variant.name}</p>
                  <div className="flex flex-wrap gap-2">
                    {variant.options.map((option) => (
                      <button
                        key={option._id}
                        onClick={() => handleVariantChange(variant.name, option, variant._id)}
                        className={`px-4 py-2 border ${
                          state.selectedVariant?.optionId === option._id
                            ? "border-blue-500"
                            : "border-gray-300"
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

          <button
            onClick={handleAddToCart}
            disabled={state.isAddingToCart}
            className={`mt-4 px-6 py-2 rounded ${
              state.isAddingToCart
                ? "bg-gray-500 text-white cursor-not-allowed"
                : "bg-black text-white hover:bg-gray-800"
            }`}
          >
            {state.isAddingToCart ? "Menambahkan..." : "Tambah ke Keranjang"}
          </button>
        </div>
      </div>

      <RelatedProducts
        category={state.productData.category.name}
        subCategory={state.productData.subCategory?.name}
      />
    </div>
  );
};

export default Product;

