import React, { useContext, useEffect, useState, useReducer, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";
import RelatedProducts from "../components/RelatedProducts"; // Assuming you have this
import { Stars, Loader, AlertTriangle } from "lucide-react";

const initialState = {
    productData: null,
    selectedImage: null,
    selectedVariant: null,
    isAddingToCart: false,
    isLoading: true,
    error: null,
};

const reducer = (state, action) => {
    switch (action.type) {
        case "SET_PRODUCT_DATA":
            return {
                ...state,
                productData: action.payload,
                selectedImage: action.payload?.images?.[0] || null,
                isLoading: false,
                error: null,
            };
        case "SET_SELECTED_IMAGE":
            return { ...state, selectedImage: action.payload };
        case "SET_SELECTED_VARIANT":
            return { ...state, selectedVariant: action.payload };
        case "SET_IS_ADDING_TO_CART":
            return { ...state, isAddingToCart: action.payload };
        case "SET_LOADING":
            return { ...state, isLoading: action.payload };
        case "SET_ERROR":
            return {
                ...state,
                isLoading: false,
                error: action.payload,
                productData: null,
            };
        default:
            return state;
    }
};

const Product = () => {
    const { productId } = useParams();
    const { formatIDR, addToCart, products, categories, subCategories } = useContext(ShopContext);
    const [state, dispatch] = useReducer(reducer, initialState);
    const [displayPrice, setDisplayPrice] = useState("Loading..."); // Initialize with "Loading..."

    useEffect(() => {
        const fetchProductData = async () => {
            dispatch({ type: "SET_LOADING", payload: true });
            try {
                const product = products.find((p) => p._id === productId);
                if (product) {
                    dispatch({ type: "SET_PRODUCT_DATA", payload: product });
                } else {
                    dispatch({ type: "SET_ERROR", payload: "Product not found" });
                }
            } catch (error) {
                dispatch({ type: "SET_ERROR", payload: "Failed to fetch product" });
            }
        };

        if (products.length > 0) {
            fetchProductData();
        }
    }, [productId, products]);

    // --- Calculate Display Price (useCallback) ---
    const calculateDisplayPrice = useCallback(() => {
        let priceToDisplay = "Price Not Available";

        if (state.productData) { // Ensure productData is loaded
            let minPrice = null;

            // 1. Check for variants and get the minimum price
            if (state.productData.variants && state.productData.variants.length > 0) {
                const allOptionPrices = state.productData.variants.flatMap((variant) =>
                    variant.options.map((option) => option.price)
                );
                 minPrice = Math.min(...allOptionPrices);
            }

            // 2.  Check for a main product price and compare/update minPrice
            if (state.productData.price != null) { // Use != null to catch both null and undefined
                if (minPrice !== null) {
                    minPrice = Math.min(minPrice, state.productData.price); // Compare with variant min
                } else {
                    minPrice = state.productData.price;
                }
            }
            // 3. Format based on minPrice
           if (minPrice === Infinity || minPrice === -Infinity || isNaN(minPrice)) {
                priceToDisplay = 'Price Not Available'; // Handle cases where no prices exist
            }else if (minPrice === 0) {
                priceToDisplay = "Free"; // Or "0", or any other custom message
            }  else if (minPrice !== null){
                priceToDisplay = `From ${formatIDR(minPrice)}`; // Format *before* adding "From"
            }
        }

        return priceToDisplay;

    }, [state.productData, formatIDR]); // Correct dependencies



    // --- useEffect to Update Display Price ---
    useEffect(() => {
        let priceToDisplay = "Price Not Available";

        if (state.selectedVariant) {
            // If a variant IS selected, use its price directly.
            priceToDisplay = formatIDR(state.selectedVariant.optionPrice);
        } else {
            // If NO variant is selected, call calculateDisplayPrice.
            priceToDisplay = calculateDisplayPrice();
        }
        setDisplayPrice(priceToDisplay);

    }, [state.productData, state.selectedVariant, calculateDisplayPrice]); // Depend on calculateDisplayPrice

    const handleVariantChange = useCallback((variantName, option, variantId) => {
        dispatch({
            type: "SET_SELECTED_VARIANT",
            payload: { variantName, optionId: option._id, variantId, optionName: option.name, optionPrice: option.price },
        });
    }, []);

    const handleAddToCart = useCallback(async () => {
        if (!state.productData) return;

        dispatch({ type: "SET_IS_ADDING_TO_CART", payload: true });
        try {
            let variantId = null;
            let optionId = null;
            if (state.selectedVariant) {
                variantId = state.selectedVariant.variantId;
                optionId = state.selectedVariant.optionId;
            }
            await addToCart(state.productData._id, variantId, optionId, 1);
        } catch (error) {
            console.error("Error adding to cart", error);
        } finally {
            dispatch({ type: "SET_IS_ADDING_TO_CART", payload: false });
        }
    }, [state.productData, state.selectedVariant, addToCart]);


    if (state.isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader className="animate-spin h-10 w-10 text-gray-500" />
            </div>
        );
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

    const category = categories.find((cat) => cat._id === state.productData.category);
    const categoryName = category ? category.name : "Unknown Category";

    const subCategory = subCategories.find((subCat) => subCat._id === state.productData.subCategory);
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
                        {/* Rating Stars */}
                        <div className="flex items-center mb-4">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Stars
                                    key={i}
                                    className={`w-5 h-5 ${
                                        i < Math.floor(state.productData.rating || 0)
                                            ? "text-yellow-400"
                                            : "text-gray-300"
                                    }`}
                                />
                            ))}
                            <span className="ml-2 text-sm text-gray-500">
                                ({state.productData.rating || 0})
                            </span>
                        </div>

                         {/* Display Price */}
                        <p className="text-xl font-bold text-gray-900 mb-4">
                            {displayPrice} {/* Use the calculated displayPrice */}
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

                        {/* Product Description */}
                        <p className="text-gray-700 mb-6 whitespace-pre-line">
                            {state.productData.description}
                        </p>

                        {/* --- Product Variants (Horizontal, Wrapping) --- */}
                        {state.productData.variants?.length > 0 && (
                            <div className="mb-6">
                                <p className="font-semibold text-gray-700 mb-2">
                                    Select Variant
                                </p>
                                {state.productData.variants.map((variant) => (
                                    <div key={variant._id} className="mb-4">
                                        <p className="text-gray-700">{variant.name}</p>
                                        {/* Horizontal, wrapping container */}
                                        <div className="flex flex-wrap gap-2">
                                            {variant.options.map((option) => (
                                                <button
                                                    key={option._id}
                                                    onClick={() =>
                                                        handleVariantChange(variant.name, option, variant._id)
                                                    }
                                                    className={`px-4 py-2 border rounded-md text-sm font-medium ${
                                                        state.selectedVariant?.variantId === variant._id &&
                                                        state.selectedVariant?.optionId === option._id
                                                            ? "border-blue-500 bg-blue-100 text-blue-600"
                                                            : "border-gray-300 hover:bg-gray-100 text-gray-700"
                                                    } transition-colors`}
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
                            className={`w-full px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold transition duration-200 ${
                                state.isAddingToCart ? "opacity-50 cursor-not-allowed" : ""
                            }`}
                        >
                            {state.isAddingToCart ? (
                                <>
                                    <Loader className="animate-spin h-5 w-5 inline-block mr-2" />
                                    Adding...
                                </>
                            ) : (
                                "Add to Cart"
                            )}
                        </button>

                        {/* Back to Collection Link */}
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