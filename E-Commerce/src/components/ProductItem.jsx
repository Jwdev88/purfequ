import React, { useContext, useReducer, useEffect } from "react";
import {
  Box,
  Image,
  Text,
  HStack,
  LinkBox,
  LinkOverlay,
  useColorModeValue,
} from "@chakra-ui/react";
import { ShopContext } from "../context/ShopContext";
import { Link as RouterLink } from "react-router-dom";
import { Sparkles } from "lucide-react";

// Initial state for the product
const initialState = {
  product: null,
  catagory: null,
  subCatagory: null,
  variantPrices: [],
};

// Reducer function to manage product state
const reducer = (state, action) => {
  switch (action.type) {
    case "SET_PRODUCT":
      return {
        ...state,
        product: action.payload,
        catagory: action.payload.catagory,
        subCatagory: action.payload.subCatagory,
        variantPrices: action.payload?.variants?.flatMap((variant) =>
          variant.options.map((option) => option.price)
        ) || [],
      };
    default:
      return state;
  }
};

const ProductItem = ({ id }) => {
  const { formatIDR, products } = useContext(ShopContext);
  const [state, dispatch] = useReducer(reducer, initialState);

  // Fetch product data and update state
  useEffect(() => {
    const fetchedProduct = products.find((item) => item._id === id);
    dispatch({ type: "SET_PRODUCT", payload: fetchedProduct });
    console.log(fetchedProduct);
  }, [products, id]);

  const { product, variantPrices } = state;

  if (!product) return null;

  return (
    <LinkBox
      as="article"
      rounded="md"
      overflow="hidden"
      boxShadow="md"
      borderWidth="1px"
      borderColor="gray.200"
      bg="white"
      transition="shadow 0.3s"
      _hover={{ shadow: "lg" }}
      title={product.name}
    >
      <LinkOverlay as={RouterLink} to={`/product/${id}`}>
        <Box position="relative" height="60">
          <Image
            src={product.images?.[0] || "default-image-url.jpg"}
            alt={product.name}
            width="full"
            height="full"
            objectFit="cover"
          />
        </Box>

        <Box p={2}>
          <Text
            fontWeight="semibold"
            fontSize="sm"
            isTruncated
            color={useColorModeValue("gray.800", "white")}
            alt={product.name}
          >
            {product.name}
          </Text>
          <Text fontWeight="bold" color="gray.800">
            {variantPrices.length > 0 ? (
              <>
                {formatIDR(Math.min(...variantPrices))} -{" "}
                {formatIDR(Math.max(...variantPrices))}
              </>
            ) : (
              formatIDR(product.price || 0)
            )}
          </Text>

          <HStack mt={1} alignItems="center">
            {Array.from({ length: 5 }).map((_, i) => (
              <Sparkles
                key={i}
                className={`w-5 h-5 ${
                  i < Math.floor(product.rating)
                    ? "text-yellow-400"
                    : "text-gray-300"
                }`}
              />
            ))}
          </HStack>
        </Box>
      </LinkOverlay>
    </LinkBox>
  );
};

export default ProductItem;
