import React, { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";
import RelatedProducts from "../components/RelatedProducts";
import { Stars } from "lucide-react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Product = () => {
  const { productId } = useParams();
  const { products, addToCart, formatIDR } = useContext(ShopContext);
  const [productData, setProductData] = useState(null);
  const [image, setImage] = useState("");
  const [selectedVariants, setSelectedVariants] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (
      productData?.variants?.length > 0 &&
      Object.keys(selectedVariants).length === 0
    ) {
      const initialVariants = {};
      productData.variants.forEach((variant) => {
        initialVariants[variant.name] = variant.options[0].name;
      });
      setSelectedVariants(initialVariants);
    }
  }, [productData, selectedVariants]);

  const getVariantPrice = () => {
    if (!productData || !productData.variants || productData.variants.length === 0) {
      return productData?.price || 0;
    }

    let variantPrice = productData.price;

    for (const variant of productData.variants) {
      const selectedOption = selectedVariants[variant.name];
      if (selectedOption) {
        const optionData = variant.options.find(option => option.name === selectedOption);
        if (optionData && optionData.price !== undefined) {
          variantPrice = optionData.price;
          break;
        }
      }
    }

    return variantPrice;
  };

  useEffect(() => {
    const foundProduct = products.find((item) => item._id === productId);
    if (foundProduct) {
      setProductData(foundProduct);
      if (foundProduct.images && foundProduct.images.length > 0) {
        setImage(foundProduct.images[0]);
      }
    }
    setIsLoading(false);
  }, [productId, products]);

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
        <p>Produk tidak ditemukan.</p>
      </div>
    );
  }

  const getSelectedVariantId = () => {
    const matchingVariant = productData.variants.find((variant) => {
      const selectedOptionName = selectedVariants[variant.name];
      return selectedOptionName && variant.options.some((option) => option.name === selectedOptionName);
    });

    if (!matchingVariant) {
      toast.error("Please select valid options for all variants.");
    }

    return matchingVariant?._id;
  };

  const handleAddToCart = () => {
    if (
      productData?.variants?.length > 0 &&
      Object.keys(selectedVariants).length !== productData.variants.length
    ) {
      toast.error("Please select all variant options.");
      return;
    }

    const selectedVariantId = getSelectedVariantId();
    if (!selectedVariantId) {
      toast.error("Please select valid options for all variants.");
      return;
    }

    addToCart(productData._id, selectedVariantId);
    toast.success(`"${productData.name}" has been added to the cart.`);
  };

  const handleVariantChange = (variantName, selectedOptionName) => {
    setSelectedVariants({ ...selectedVariants, [variantName]: selectedOptionName });

    const selectedVariant = productData.variants.find(
      (variant) => variant.name === variantName
    );
    const selectedOption = selectedVariant?.options.find(
      (option) => option.name === selectedOptionName
    );

    if (selectedOption?.image) {
      setImage(selectedOption.image);
    }
  };

  return (
    <div className="border-t-2 pt-10 transition-opacity ease-in duration-500 opacity-100">
      <div className="flex gap-12 sm:gap-12 flex-col sm:flex-row">
        <div className="flex-1 flex flex-col-reverse gap-3 sm:flex-row">
          <div className="flex sm:flex-col overflow-x-auto sm:overflow-y-scroll justify-between sm:justify-normal sm:w-[18.7%] w-full scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            {productData.images.map((item, index) => (
              <img
                onClick={() => setImage(item)}
                src={item}
                key={index}
                className="w-[24%] sm:w-full sm:mb-3 flex-shrink-0 cursor-pointer"
                alt=""
              />
            ))}
          </div>
          <div className="w-full sm:w-[80%]">
            <img className="w-full h-auto" src={image} alt={productData.name} />
          </div>
        </div>

        <div className="flex-1">
          <h1 className="font-medium text-2xl gap-1 mt-2">
            {productData.name}
          </h1>

          <div className="mt-4 flex items-center">
            {Array.from({ length: 5 }).map((_, i) => (
              <Stars
                key={i}
                className={`w-6 h-6 ${
                  i < Math.floor(productData.rating)
                    ? "text-yellow-400"
                    : "text-gray-300"
                }`}
                fill="currentColor"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
            <span className="ml-2 text-xl font-semibold text-gray-700"></span>
          </div>
          <p className="mt-2 text-sm font-medium">Product Rating: {productData.rating.toFixed(1)}</p>
          <p className="mt-2 text-2xl font-medium">{formatIDR(getVariantPrice())}</p>

          <p className="mt-2 text-sm font-medium">
            <span className="font-semibold">Kategori: </span>
            {productData.category.name}
          </p>
          <p className="mt-3 text-gray-500 md:w-4/5">
            {productData.description}
          </p>
          <div className="flex flex-col gap-4 my-2">
            {productData.variants && productData.variants.length > 0 && (
              <p className="font-semibold font-serif">Pilihan Varian</p>
            )}
            {productData.variants &&
              productData.variants.length > 0 &&
              productData.variants.map((variant) => (
                <div key={variant._id}>
                  <p>{variant.name}</p>
                  <div className="flex flex-wrap gap-2">
                    {variant.options.map((option) => (
                      <button
                        key={option._id}
                        onClick={() =>
                          handleVariantChange(variant.name, option.name)
                        }
                        className={`size-button border px-3 py-2 rounded-md border-gray-200 hover:bg-gray-100 ${
                          selectedVariants[variant.name] === option.name
                            ? "active-size bg-blue-100 border-blue-500 text-blue-700"
                            : ""
                        }`}
                      >
                        {option.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
          </div>
          <div>
            <button
              onClick={handleAddToCart}
              className="bg-black text-white px-8 py-3 text-sm mt-4 active:bg-gray-700"
            >
              TAMBAH KE KERANJANG
            </button>
          </div>
        </div>
      </div>
      <RelatedProducts
        category={productData.category.name}
        subCategory={productData.subCategory.name}
      />
    </div>
  );
};

export default Product;