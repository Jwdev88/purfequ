// Product.js
import React, { useContext, useEffect, useState, useReducer, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";
import RelatedProducts from "../components/RelatedProducts"; // Assuming you have this
import { Stars, Loader, AlertTriangle, XCircle } from "lucide-react"; // Import XCircle
import { toast } from 'react-toastify';
import {
    Box,
    Heading,
    Text,
    Image,
    Flex,
    Button,
    Spinner,
    Badge
} from '@chakra-ui/react';

const initialState = {
    productData: null,
    selectedImage: null,
    selectedVariant: {}, // Store as an object: { variantName: selectedOptionName }
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
                selectedImage: action.payload?.images?.[0] || null, // Optional chaining
                selectedVariant: {}, // Reset selected variant when new product loads
                isLoading: false,
                error: null,
            };
        case "SET_SELECTED_IMAGE":
            return { ...state, selectedImage: action.payload };
        case "SET_SELECTED_VARIANT":
            return {
                ...state,
                selectedVariant: {
                  ...state.selectedVariant,
                    [action.payload.variantName] : action.payload.optionName
                }
            };
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
        case "CLEAR_VARIANT":
              const newState = { ...state };
              delete newState.selectedVariant[action.payload]; // Remove the specific variant
              return newState;
        default:
            return state;
    }
};

const Product = () => {
    const { productId } = useParams();
    const { formatIDR, addToCart, products, categories, subCategories, backendUrl } =
        useContext(ShopContext);
    const [state, dispatch] = useReducer(reducer, initialState);

    const fetchProductData = useCallback(async () => {
        dispatch({ type: "SET_LOADING", payload: true });
        try {
            const response = await fetch(`${backendUrl}/api/products/${productId}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const product = await response.json();

            if (product) {
                 // Initialize selectedVariant based on available options
                const initialSelectedVariant = {};
                if(product.variants && product.variants.length > 0) {
                  product.variants.forEach(variant => {
                    if(variant.options && variant.options.length > 0){
                      initialSelectedVariant[variant.variantName] = variant.options[0].optionName;
                    }
                  });
                }
              dispatch({ type: "SET_PRODUCT_DATA", payload: product });
              dispatch({type: "SET_SELECTED_VARIANT", payload: initialSelectedVariant})
            } else {
                dispatch({ type: "SET_ERROR", payload: "Product not found" });
            }
        } catch (error) {
            console.error("Fetch error:", error);
            dispatch({ type: "SET_ERROR", payload: `Failed to fetch product: ${error.message}` });
        }
    }, [productId, backendUrl]);

    useEffect(() => {
        fetchProductData();
    }, [fetchProductData]);

     // --- getOption ---
    const getOption = (product, variantName, optionName) => {
      if (!product || !product.variants) {
        return null;
      }

      const variant = product.variants.find(v => v.variantName === variantName);
      if (!variant || !variant.options) {
        return null;
      }
      return variant.options.find(o => o.optionName === optionName);
    }


    const handleVariantChange = useCallback((variantName, optionName) => {
        dispatch({
            type: "SET_SELECTED_VARIANT",
            payload: { variantName, optionName },
        });
    }, []);


    const handleAddToCart = useCallback(async () => {
        if (!state.productData) return;

        dispatch({ type: "SET_IS_ADDING_TO_CART", payload: true });
        try {
            const selectedVariants = [];
            // Iterate through the selectedVariant object
            for (const variantName in state.selectedVariant) {
              if(state.selectedVariant.hasOwnProperty(variantName)) {
                const optionName = state.selectedVariant[variantName];

                const selectedOption = getOption(state.productData, variantName, optionName)
                if(!selectedOption){
                   console.error(`Option "${optionName}" for variant "${variantName}" not found.`);
                   toast.error(`Option "${optionName}" for variant "${variantName}" not found.`); // Show a toast message
                  return; // Exit the function. Don't add to cart
                }
                selectedVariants.push({
                  variantName: variantName,
                  selectedOption: {
                     optionName: selectedOption.optionName, // Or just optionName if that's what you store
                    _id: selectedOption._id
                  }
                });
              }
            }

            // Now, pass selectedVariants array

            await addToCart(state.productData._id, selectedVariants, 1);  // Pass selectedVariants
            toast.success('Product added to cart!'); // Show success toast
        } catch (error) {
             toast.error(error.message || "Error adding to cart"); // Use error message
            console.error("Error adding to cart", error);

        } finally {
            dispatch({ type: "SET_IS_ADDING_TO_CART", payload: false });
        }
    }, [state.productData, state.selectedVariant, addToCart, getOption]);




    if (state.isLoading) {
        return (
            <Flex justify="center" align="center" h="50vh">
                <Spinner size="xl" />
            </Flex>
        );
    }

    if (state.error) {
        return (
            <Flex justify="center" align="center" h="50vh" direction="column">
                <AlertTriangle className="h-10 w-10 text-red-500" />
                <Text mt={2}>{state.error}</Text>
            </Flex>
        );
    }

    if (!state.productData) {
        return (
            <Flex justify="center" align="center" h="50vh">
                <Text>Product data not available.</Text>
            </Flex>
        );
    }

  const category = categories.find((cat) => cat._id === state.productData.category);
    const categoryName = category ? category.name : "Unknown Category";

    const subCategory = subCategories.find(
        (subCat) => subCat._id === state.productData.subCategory
    );
    const subCategoryName = subCategory ? subCategory.name : "";

    return (
        <Box as="section" py="12" bg="gray.50">
            <Box maxW="7xl" mx="auto" px={4}>
                <Flex
                    direction={{ base: "column", md: "row" }}
                    gap={{ base: 8, md: 12 }}
                >
                    {/* Product Images */}
                    <Box flex={{ base: "1", md: "1" }} display="flex" flexDirection={{base: 'column', md: 'row'}} gap={{base: '2', md: '4'}}>
                        <Box  display='flex' flexDirection={{base: 'row', md: 'column'}} gap={{base: 2, md: 4}} overflow='auto' w={{base: 'full', md: '25%'}}>
                            {state.productData.images.map((item, index) => (
                                <Image
                                    key={index}
                                    onClick={() =>
                                        dispatch({
                                            type: "SET_SELECTED_IMAGE",
                                            payload: item,
                                        })
                                    }
                                    src={item}
                                    cursor="pointer"
                                    w="full"
                                    rounded="md"
                                    borderWidth={state.selectedImage === item ? "2px" : "1px"}
                                    borderColor={
                                        state.selectedImage === item ? "blue.500" : "gray.300"
                                    }
                                    _hover={{ borderColor: "blue.500" }}
                                    transition="border-color 0.2s"
                                    alt={`Thumbnail ${index + 1}`}
                                     maxH={{base: '70px', md: 'full'}} // Added max height
                                />
                            ))}
                        </Box>
                        <Box flex="1">
                            <Image
                                w="full"
                                h="auto"
                                rounded="lg"
                                src={state.selectedImage}
                                alt={state.productData.name}
                            />
                        </Box>
                    </Box>

                    {/* Product Details */}
                    <Box flex={{ base: "1", md: "1" }}>
                        <Heading as="h1" size="xl" mb={2}>
                            {state.productData.name}
                        </Heading>
                        {/* Rating Stars */}
                        <Flex align="center" mb={4}>
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
                            <Text ml={2} fontSize="sm" color="gray.500">
                                ({state.productData.rating || 0})
                            </Text>
                        </Flex>
                        <Text fontSize="xl" fontWeight="bold" color="gray.900" mb={4}>
                          {state.productData.price
                            ? formatIDR(state.productData.price)
                            : "Price Not Available"}
                        </Text>
                        {/* Display stock information */}
                        <Text color={state.productData.stock > 0 ? 'green.500' : 'red.500'} fontWeight="semibold" mb={2}>
                            {state.productData.stock > 0 ? `In Stock: ${state.productData.stock}` : 'Out of Stock'}
                        </Text>
                        <Text color="gray.600" mb={2}>
                            <Text as="span" fontWeight="semibold">
                                Category:{" "}
                            </Text>
                            {categoryName}
                        </Text>
                        {subCategoryName && (
                            <Text color="gray.600" mb={4}>
                                <Text as="span" fontWeight="semibold">
                                    Subcategory:{" "}
                                </Text>
                                {subCategoryName}
                            </Text>
                        )}

                        {/* Product Description */}
                        <Text whiteSpace="pre-line" color="gray.700" mb={6}>
                            {state.productData.description}
                        </Text>
                        {/*Variant */}
                        {state.productData.variants?.length > 0 && (
                                                    <Box mb={6}>
                                                        <Text fontWeight="semibold" color="gray.700" mb={2}>
                                                            Variants
                                                        </Text>
                                                        {state.productData.variants.map((variant) => (
                                                            <Box key={variant._id} mb={4}>
                                                                <Flex alignItems="center">
                                                                    <Text color="gray.700" mb={1} fontWeight="semibold" mr={2}>
                                                                        {variant.variantName}:
                                                                    </Text>
                                                                    {/* Display selected option */}
                                                                  {state.selectedVariant[variant.variantName] && (
                                                                    <Badge colorScheme="blue" mr={2} mb={1}>
                                                                      {state.selectedVariant[variant.variantName]}
                                                                    </Badge>

                                                                    )}
                                                                  {/* Button to Clear selection */}
                                                                    {state.selectedVariant[variant.variantName] && (
                                                                        <Button
                                                                        size="xs"
                                                                        variant="outline"
                                                                        colorScheme="gray"
                                                                        onClick={() => dispatch({ type: "CLEAR_VARIANT", payload: variant.variantName })}
                                                                          ml={2}
                                                                          mb={1}
                                                                        >
                                                                         <XCircle size={16} className="mr-1" />
                                                                          Clear
                                                                        </Button>
                                                                      )}
                                                                </Flex>
                                                                 {/* Options as Badges */}
                                                                <Box>

                                                                <Flex flexWrap="wrap" >
                                                                   {variant.options.map((option) => {
                                                                     const isSelected = state.selectedVariant[variant.variantName] === option.optionName;
                                                                        return (
                                                                          <Button
                                                                          key={option._id}
                                                                            onClick={() => handleVariantChange(variant.variantName, option.optionName)}
                                                                              size="sm"
                                                                              variant={isSelected ? "solid" : "outline"}
                                                                              colorScheme={isSelected ? "blue" : "gray"}
                                                                            mr={2}
                                                                            mb={2}
                                                                              isDisabled={option.stock <= 0} // Disable if out of stock
                                                                          >

                                                                              {option.optionName}
                                                                              {/* Show stock */}
                                                                                <Badge ml={1} colorScheme={option.stock > 0 ? 'green' : 'red'}>
                                                                                {option.stock > 0 ? `${option.stock} In Stock` : 'Out of Stock'}
                                                                              </Badge>

                                                                          </Button>
                                                                      )
                                                                   })}
                                                                  </Flex>
                                                                </Box>
                                                            </Box>
                                                        ))}
                                                    </Box>
                                                )}


                        {/* Add to Cart Button */}
                        <Button
                            onClick={handleAddToCart}
                            isDisabled={state.isAddingToCart}
                            colorScheme="blue"
                            size="lg"
                            w="full"
                            py={6}
                            rounded="full"
                            isLoading={state.isAddingToCart}
                            loadingText="Adding..."
                        >
                            Add to Cart
                        </Button>

                        {/* Back to Collection Link */}
                        <Box mt={4} textAlign="center">
                            <Link
                                to="/collection"
                                className="text-blue-600 hover:underline"
                            >
                                &larr; Back to Collection
                            </Link>
                        </Box>
                    </Box>
                </Flex>
            </Box>
        </Box>
    );
};

export default Product;
