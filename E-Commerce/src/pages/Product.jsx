import React, { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";
import RelatedProducts from "../components/RelatedProducts";
import { Stars } from "lucide-react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Product = () => {
  const { productId } = useParams();
  const { products, addToCart, formatIDR, getCartCount } =
    useContext(ShopContext);
  const [productData, setProductData] = useState(null);
  const [image, setImage] = useState("");
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [variantPrice, setVariantPrice] = useState(0);
  const [variantStock, setVariantStock] = useState(0);

  useEffect(() => {
    if (!products.length) return;

    const foundProduct = products.find((item) => item._id === productId);
    if (foundProduct) {
      setProductData(foundProduct);
      setImage(foundProduct.images?.[0] || "");
      resetVariantState();
    } else {
      setProductData(null);
    }

    setIsLoading(false);
  }, [productId, products]);

  const resetVariantState = () => {
    setSelectedVariant(null);
    setVariantPrice(productData?.price || 0);
    setVariantStock(productData?.stock || 0);
  };

  const handleVariantChange = (variantName, selectedOptionId) => {
    const selectedVariant = productData.variants.find(
      (variant) => variant.name === variantName
    );
    const selectedOption = selectedVariant.options.find(
      (option) => option._id === selectedOptionId
    );

    if (!selectedOption) return;

    setSelectedVariant({
      variantName,
      variantId: selectedVariant._id,
      optionId: selectedOptionId,
      optionName: selectedOption.name,
    });

    setVariantPrice(selectedOption.price);
    setVariantStock(selectedOption.stock);
    if (selectedOption.image) setImage(selectedOption.image);
  };

  const validateVariantSelection = () => {
    if (productData?.variants?.length > 0 && !selectedVariant) {
      toast.error("Please select a variant option.");
      return false;
    }
    return true;
  };

  const handleAddToCart = async () => {
    if (!productData) return;
  
    // Validasi varian hanya jika produk memiliki varian
    if (productData.variants?.length > 0 && !validateVariantSelection()) return;
    
    setIsAddingToCart(true);
  
    try {
      const payload = {
        productId: productData._id,
        variantId: productData.variants?.length > 0
          ? [
              {
                variantId: selectedVariant?.variantId || null,
                optionId: selectedVariant?.optionId || null,
              },
            ]
          : [], // Kirim array kosong jika tidak ada varian
        quantity: 1,
      };
  
      await addToCart(productData._id, payload.variantId, payload.quantity);
  
      toast.success(`${productData.name} added to cart.`);
    } catch (err) {
      console.error("Error in handleAddToCart:", err);
      toast.error("An error occurred while adding to cart.");
    } finally {
      setIsAddingToCart(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading...
      </div>
    );
  }

  if (!productData) {
    return (
      <div className="flex justify-center items-center h-screen">
        Product not found.
      </div>
    );
  }

  return (
    <div className="border-t-2 pt-10">
      <div className="flex flex-col sm:flex-row gap-12">
        {/* Product Images */}
        <div className="flex-1 flex flex-col sm:flex-row-reverse">
          <div className="w-full sm:w-[80%]">
            <img className="w-full h-auto" src={image} alt={productData.name} />
          </div>
          <div className="flex sm:flex-col gap-2 overflow-auto sm:w-[20%]">
            {productData.images.map((item, index) => (
              <img
                key={index}
                onClick={() => setImage(item)}
                src={item}
                className={`cursor-pointer w-[20%] sm:w-full ${
                  image === item ? "border-2 border-blue-500" : "border"
                }`}
                alt="Thumbnail"
              />
            ))}
          </div>
        </div>

        {/* Product Details */}
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">{productData.name}</h1>
          <div className="flex items-center mt-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Stars
                key={i}
                className={`w-6 h-6 ${
                  i < Math.floor(productData.rating)
                    ? "text-yellow-400"
                    : "text-gray-300"
                }`}
              />
            ))}
            <span className="ml-2 text-lg">
              {productData.rating.toFixed(1)}
            </span>
          </div>
          <p className="mt-2 text-2xl font-semibold">
            {formatIDR(
              productData.variants?.length > 0
                ? variantPrice
                : productData.price
            )}
          </p>

          <p className="mt-2">
            <span className="font-semibold">Category: </span>
            {productData.category.name}
          </p>
          <p className="mt-4">{productData.description}</p>

          {/* Variants */}
          {/* Variants */}
          {productData.variants?.length > 0 && (
            <div className="mt-4">
              <p className="font-serif font-semibold">Select Variant</p>
              {productData.variants.map((variant) => (
                <div key={variant._id} className="mt-2">
                  <p>{variant.name}</p>
                  <div className="flex flex-wrap gap-2">
                    {variant.options.map((option) => (
                      <button
                        key={option._id}
                        onClick={() =>
                          handleVariantChange(variant.name, option._id)
                        }
                        className={`px-3 py-2 border rounded-md ${
                          selectedVariant?.variantName === variant.name &&
                          selectedVariant?.optionId === option._id
                            ? "bg-blue-100 border-blue-500 text-blue-700"
                            : "border-gray-300 hover:bg-gray-100"
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
            disabled={isAddingToCart}
            className={`mt-4 px-6 py-2 rounded ${
              isAddingToCart
                ? "bg-gray-500 text-white cursor-not-allowed"
                : "bg-black text-white hover:bg-gray-800"
            }`}
          >
            {isAddingToCart ? "Adding..." : "Add to Cart"}
          </button>
        </div>
      </div>

      {/* Related Products */}
      <RelatedProducts
        category={productData.category.name}
        subCategory={productData.subCategory?.name}
      />
    </div>
  );
};

export default Product;
