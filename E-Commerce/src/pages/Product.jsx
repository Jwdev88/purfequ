// --- components/Product.jsx ---
import React, { useContext, useEffect, useState,useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";
import { Loader, AlertTriangle } from "lucide-react";
import { useProduct } from "../hooks/useProduct";
import { toast } from "react-toastify";
import { Loader2Icon } from "lucide-react";

const Product = () => {
  const { productId } = useParams();
  const { formatIDR, products, categories, subCategories, fetchData, backendUrl, shopActionTypes} =
    useContext(ShopContext); // Add fetchData and shopActionTypes
  const [displayPrice, setDisplayPrice] = useState("Loading...");
  const [displayStock, setDisplayStock] = useState(0);
  const navigate = useNavigate();

    const { state, handleVariantChange, handleAddToCart, dispatch } =
    useProduct(productId);


    // --- Refetch product data (add this function) ---
    const refetchProductData = useCallback(async () => {
        try {
            await fetchData(
                `${backendUrl}/api/product/list`,  // Refetch ALL products
                shopActionTypes.SET_PRODUCTS,
                "Failed to fetch product data."
            );
        } catch (error) {
            // Error is already handled in fetchData
        }
    }, [fetchData, backendUrl, shopActionTypes]);


  useEffect(() => {
    let priceToDisplay = "Loading...";
    let stockToDisplay = 0;

    if (state.productData) {
      if (state.selectedVariant) {
        const price = state.selectedVariant.price;
        priceToDisplay =
          price === null || isNaN(price)
            ? ""
            : price === 0
            ? "Free"
            : formatIDR(price ?? 0);
        stockToDisplay = state.selectedVariant.stock;
      } else if (
        state.productData.variants &&
        state.productData.variants.length > 0
      ) {
        if (
          state.productData.variants[0].options &&
          state.productData.variants[0].options.length > 0
        ) {
          const price = state.productData.variants[0].options[0].price;
          priceToDisplay =
            price === null || isNaN(price)
              ? ""
              : price === 0
              ? "Free"
              : formatIDR(price ?? 0);
          stockToDisplay = state.productData.variants[0].options[0].stock;
        }
      } else {
        const price = state.productData.price;
        priceToDisplay =
          price === null || isNaN(price)
            ? ""
            : price === 0
            ? "Free"
            : formatIDR(price ?? 0);
        stockToDisplay = state.productData.stock;
      }
    }

    setDisplayPrice(priceToDisplay);
    setDisplayStock(stockToDisplay);
  }, [state.productData, state.selectedVariant, formatIDR]);

  // --- Polling (useEffect) ---
    useEffect(() => {
        const intervalId = setInterval(() => {
            refetchProductData(); // Re-fetch data every 5 seconds
        }, 5000); // 5000 milliseconds = 5 seconds

        // Cleanup function to clear the interval when the component unmounts
        return () => clearInterval(intervalId);
    }, [refetchProductData]); // Dependency on refetchProductData


     const handleBuyNow = () => {
        const token = localStorage.getItem("token");
        if (!token) {
            toast.warn("Silakan login untuk melanjutkan pembelian.", {
                onClose: () => navigate("/login"),
            });
            return;
        }

        const hasVariants = state.productData.variants && state.productData.variants.length > 0;

        if (hasVariants && (!state.selectedVariant || !state.selectedVariant.optionId)) {
            toast.error("Harap pilih varian sebelum melanjutkan pembelian.");
            return;
        }

        let finalStockCheck = true;
        let itemData;

        if (hasVariants) {
             const selectedOption = state.productData.variants
                .flatMap((variant) => variant.options)
                .find((option) => option._id === state.selectedVariant.optionId);

            if (!selectedOption || selectedOption.stock <= 0) {
                toast.error("Varian ini tidak tersedia.");
                finalStockCheck = false;
                return; // Add return here
            }
             itemData = {
                productId: state.productData._id,
                productName: state.productData.name,
                productImages: state.productData.images,
                productPrice: state.productData.price,
                productWeight: state.productData.weight,
                productStock: state.productData.stock, // Initial stock
                productSku: state.productData.sku,
                quantity: 1,
                variant: {
                    variantId: state.selectedVariant.variantId,
                    variantName: state.selectedVariant.variantName,
                    selectedOption: {
                        optionId: selectedOption._id,
                        optionName: selectedOption.name,
                        optionPrice: selectedOption.price,
                        optionStock: selectedOption.stock, // Initial stock
                        optionSku: selectedOption.sku,
                         optionWeight: selectedOption.weight,
                    }
                }
            }
        } else {
            if (state.productData.stock <= 0) {
                toast.error("Produk ini tidak tersedia.");
                return; // Add return here
            }
              itemData = {
                productId: state.productData._id,
                productName: state.productData.name,
                productImages: state.productData.images,
                productPrice: state.productData.price,
                productStock: state.productData.stock,
                productSku: state.productData.sku,
                productWeight: state.productData.weight,
                quantity: 1, // Default quantity = 1
                variant: null, // No variant for main product
            };
        }
        if (!finalStockCheck) return;

        console.log("handleBuyNow - itemData:", itemData);

        localStorage.removeItem('checkoutItems');
        localStorage.setItem('buyNowItem', JSON.stringify(itemData));
        navigate('/place-order');
    };


  if (state.isLoading) {
 
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2Icon className="animate-spin h-16 w-16 mr-4" />
        <span className="text-lg font-semibold">Loading...</span>
      </div>
    ); // Keep this, it handles initial loading
  
  }

  if (state.error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <AlertTriangle className="h-10 w-10 text-red-500 mr-2" />
        <p>{state.error}</p>
      </div>
    );
  }

  if (!state.productData) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Product data not available.</p>
      </div>
    );
  }

  const category = categories.find(
    (cat) => cat._id === state.productData.category
  );
  const categoryName = category ? category.name : "Unknown Category";

  const subCategory = subCategories.find(
    (subCat) => subCat._id === state.productData.subCategory
  );
  const subCategoryName = subCategory ? subCategory.name : "";

  return (
    <section className="py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row gap-12">
          {/* Product Images */}
          <div className="md:w-1/2 flex flex-col md:flex-row gap-4">
            <div className="md:w-1/4 flex md:flex-col gap-2 overflow-auto">
              {state.productData.images.map((item, index) => (
                <img
                  key={index}
                  onClick={() =>
                    dispatch({
                      type: "SET_SELECTED_IMAGE",
                      payload: item,
                    })
                  }
                  src={item}
                  className={`cursor-pointer w-full md:w-full rounded-md ${
                    state.selectedImage === item
                      ? "border-2 border-blue-500"
                      : "border border-gray-300"
                  } hover:border-blue-500 transition-colors`}
                  alt={`Thumbnail ${index + 1}`}
                />
              ))}
            </div>
            <div className="md:w-3/4">
              <img
                className="w-full h-auto rounded-lg"
                src={state.selectedImage}
                alt={state.productData.name}
              />
            </div>
          </div>

          {/* Product Details */}
          <div className="md:w-1/2">
            <h1 className="text-3xl font-semibold mb-2">
              {state.productData.name}
            </h1>

            <p className="text-xl font-bold text-gray-900 mb-4">
              {displayPrice} {/*DISPLAY PRICE */}
            </p>
            <p className="text-gray-600 mb-2">
              <span className="font-semibold">Category: </span>
              {categoryName}
            </p>
            {subCategoryName && (
              <p className="text-gray-600 mb-4">
                <span className="font-semibold">Subcategory: </span>
                {subCategoryName}
              </p>
            )}
             <p className="text-gray-600 mb-4">
                <span className="font-semibold">Stock: </span>
                {displayStock > 0 ? (
                    <span>{displayStock}</span>
                ) : (
                    <span className="text-red-600">Habis</span>
                )}
            </p>

            <p className="text-gray-700 mb-6 whitespace-pre-line">
              {state.productData.description}
            </p>

            {state.productData.variants?.length > 0 && (
              <div className="mb-6">
                <p className="font-semibold text-gray-700 mb-2">Varian</p>
                {state.productData.variants.map((variant) => (
                  <div key={variant._id} className="mb-4">
                    <p className="text-gray-700 mb-2">{variant.name}</p>
                    <div className="overflow-x-auto whitespace-nowrap py-2">
                      <div className="inline-block">
                        {variant.options.map((option) => (
                          <button
                            key={option._id}
                            onClick={() =>
                              handleVariantChange(
                                variant.name,
                                option,
                                variant._id
                              )
                            }
                            disabled={option.stock <= 0}
                            className={`px-4 py-2 border rounded-md text-sm font-medium inline-block mr-2 last:mr-0 ${
                              state.selectedVariant?.variantId ===
                                variant._id &&
                              state.selectedVariant?.optionId === option._id
                                ? "border-blue-500 bg-blue-100 text-blue-600"
                                : "border-gray-300 hover:bg-gray-100 text-gray-700"
                            } ${
                              option.stock <= 0
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                            } transition-colors whitespace-nowrap`}
                          >
                           {option.stock <= 0
                            ? `${option.name} (Habis)`
                            : option.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-4">
            <button
                onClick={handleAddToCart}
                disabled={state.isAddingToCart || displayStock <= 0}
                className={`px-6 py-3 rounded-full  text-white font-bold transition duration-200 ${
                state.isAddingToCart || displayStock <= 0
                    ? "bg-gray-400 cursor-not-allowed" // Greyed out
                    : "bg-blue-600 hover:bg-blue-700" // Normal state
                }`}
            >
                {state.isAddingToCart ? (
                <>
                    <Loader2Icon className="animate-spin h-5 w-5 inline-block mr-2" />
                    Adding...
                </>
                ) : (
                "Add to Cart"
                )}
            </button>

            <button

                onClick={handleBuyNow}
                disabled={displayStock <= 0}
                className={`px-6 py-3 rounded-full  text-white font-bold transition duration-200 ${
                displayStock <= 0
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700"
                }`}
            >
                Beli Langsung
            </button>
            </div>
            

            <div className="mt-4 text-center">
              <Link to="/collection" className="text-blue-600 hover:underline">
                &larr; Back to Collection
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Product;