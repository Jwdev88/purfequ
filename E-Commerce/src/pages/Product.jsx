import React, { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";
import RelatedProducts from "../components/RelatedProducts";
import { Stars } from "lucide-react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Product = (token) => {
  const { productId } = useParams();
  const { products, addToCart, formatIDR } = useContext(ShopContext);
  const [productData, setProductData] = useState(null);
  const [image, setImage] = useState("");
  const [selectedVariants, setSelectedVariants] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // Fetch product data
  useEffect(
    () => {
      if (!products.length) return;

      const foundProduct = products.find((item) => item._id === productId);
      if (foundProduct) {
        setProductData(foundProduct);
        setImage(foundProduct.images?.[0] || "");
        initializeVariants(foundProduct);
      } else {
        setProductData(null);
      }

      setIsLoading(false);
    },
    [productId, products],
    [token]
  );

  // Initialize default variants
  const initializeVariants = (product) => {
    const initialVariants = {};
    product.variants?.forEach((variant) => {
      initialVariants[variant.name] = variant.options?.[0]?._id || null;
    });
    setSelectedVariants(initialVariants);
  };

  // Get variant price based on selection
  const getVariantPrice = () => {
    if (!productData || !productData.variants?.length) {
      return productData?.price || 0;
    }

    let variantPrice = productData.price;
    productData.variants.forEach((variant) => {
      const selectedOptionId = selectedVariants[variant.name];
      const optionData = variant.options.find(
        (option) => option._id === selectedOptionId
      );
      if (optionData?.price !== undefined) {
        variantPrice = optionData.price;
      }
    });
    return variantPrice;
  };

  // Validate all variants are selected
  const validateVariantSelection = (productData, selectedVariants) => {
    if (!productData || !productData.variants) return false;

    const missingVariants = productData.variants.filter(
      (variant) => !selectedVariants[variant.name]
    );

    if (missingVariants.length > 0) {
      const missingNames = missingVariants.map((v) => v.name).join(", ");
      toast.error(`Please select options for: ${missingNames}`);
      return false;
    }

    return true;
  };

  // Handle adding product to cart
  const handleAddToCart = () => {
    if (!productData) return;
  
    // Validasi varian sebelum ditambahkan ke cart
    if (!validateVariantSelection(productData, selectedVariants)) return;
  
    addToCart(productData._id, selectedVariants)
      .then((result) => {
        if (result.success) {
          toast.success(`${productData.name} added to cart.`);
        } else {
          toast.error(result.message);
        }
      })
      .catch((err) => console.error("Error in handleAddToCart:", err));
  };
  

  // Handle variant selection
  const handleVariantChange = (variantName, selectedOptionId) => {
    setSelectedVariants({
      ...selectedVariants,
      [variantName]: selectedOptionId,
    });

    const selectedVariant = productData.variants.find(
      (variant) => variant.name === variantName
    );
    const selectedOption = selectedVariant?.options.find(
      (option) => option._id === selectedOptionId
    );

    if (selectedOption?.image) setImage(selectedOption.image);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  if (!productData) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Product not found.</p>
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
            {formatIDR(getVariantPrice())}
          </p>
          <p className="mt-2">
            <span className="font-semibold">Category: </span>
            {productData.category.name}
          </p>
          <p className="mt-4">{productData.description}</p>

          {/* Variants */}
          {productData.variants?.length > 0 && (
            <div className="mt-4">
              <p className="font-serif font-semibold">Select Variants</p>
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
                          selectedVariants[variant.name] === option._id
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
            className="mt-4 bg-black text-white px-6 py-2 rounded hover:bg-gray-800"
          >
            Add to Cart
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
