import React, { useContext, useMemo } from "react";
import {
  Box,
  Flex,
  VStack,
  HStack,
  Text,
  Button,
  Image,
  IconButton,
  Input,
  Heading,
  useColorModeValue,
} from "@chakra-ui/react";
import { CloseIcon } from "@chakra-ui/icons";
import { ShopContext } from "../context/ShopContext";
import Title from "../components/Title";
import CartTotal from "../components/CartTotal";
import { useCart } from "../hooks/useCart";

const Cart = () => {
  const {
    cartItems,
    updateQuantity,
    removeItemFromCart,
    clearCart,
    formatIDR,
    navigate,
  } = useContext(ShopContext);
  const {
    cartData,
    handleQuantityChange,
    handleRemoveItem,
    handleClearCart,
  } = useCart(
    cartItems,
    updateQuantity,
    removeItemFromCart,
    clearCart
  );

  const memoizedCartTotal = useMemo(() => <CartTotal />, [cartData]);

  const bg = useColorModeValue("gray.100", "gray.800");
  const boxBg = useColorModeValue("white", "gray.700");
  const textColor = useColorModeValue("gray.700", "gray.200");

  return (
    <Box
      minH="100vh"
      bg={bg}
      p={4}
      overflowY="scroll"
      sx={{
        "&::-webkit-scrollbar": {
          width: "8px",
          height: "8px",
          borderRadius: "10px",
          backgroundColor: `rgba(0,0,0,0.05)`,
        },
        "&::-webkit-scrollbar-thumb": {
          backgroundColor: `rgba(0,0,0,0.2)`,
          borderRadius: "10px",
        },
        "&::-webkit-scrollbar-track": {
          backgroundColor: `rgba(0,0,0,0.0)`,
        },
      }}
    >
      <Box maxW="7xl" mx="auto" bg={boxBg} p={6} rounded="lg" shadow="md">
        <Heading as="h1" fontSize="3xl" fontWeight="bold" textAlign="center" mb={4} color={textColor}>
          <Title text1="Shopping" text2="Cart" />
        </Heading>

        <Flex direction={{ base: "column", lg: "row" }} gap={6}>
          <VStack flex={2} spacing={4} w="full">
            {cartData.length > 0 ? (
              <>
                {cartData.map((item, index) => (
                  <CartItem
                    key={`${item.productId}-${item.variantId || "no-variant"}-${item.optionId || "no-option"}-${index}`}
                    item={item}
                    formatIDR={formatIDR}
                    handleQuantityChange={handleQuantityChange}
                    handleRemoveItem={handleRemoveItem}
                  />
                ))}
              </>
            ) : (
              <Text textAlign="center" color={textColor}>
                Keranjang belanja Anda kosong.
              </Text>
            )}
          </VStack>

          <VStack flex={1} spacing={6} align="flex-start">
            {memoizedCartTotal}
            <Button
              colorScheme="purple"
              size="lg"
              w="full"
              onClick={() => navigate("/place-order")}
            >
              Checkout
            </Button>
            <Button
              colorScheme="red"
              size="lg"
              w="full"
              onClick={handleClearCart}
            >
              Clear Cart
            </Button>
          </VStack>
        </Flex>
      </Box>
    </Box>
  );
};

const CartItem = React.memo(({ item, formatIDR, handleQuantityChange, handleRemoveItem }) => (
  <Flex
    direction={{ base: "column", sm: "row" }}
    justify="space-between"
    align="center"
    py={4}
    borderBottom="1px"
    borderColor="gray.300"
    position="relative"
    w="full"
    bg={useColorModeValue("gray.50", "gray.900")}
    rounded="md"
    p={4}
  >
    <IconButton
      icon={<CloseIcon />}
      position="absolute"
      top={2}
      right={2}
      aria-label="Remove item"
      colorScheme="red"
      variant="ghost"
      size="sm"
      rounded="full"
      onClick={() => handleRemoveItem(item.productId, item.variantId, item.optionId)}
    />

    <HStack spacing={4} w="full">
      <Image
        boxSize="150px"
        objectFit="cover"
        rounded="lg"
        src={item.productImage}
        alt={item.productName}
      />
      <VStack align="start" spacing={2}>
        <Text fontSize="lg" fontWeight="semibold">{item.productName}</Text>
        <Text fontSize="sm" color="gray.600">{item.variantName} - {item.optionName}</Text>
        <Text fontSize="sm" color="gray.600">
          Category: {item.productCategory} <br />
          Subcategory: {item.productSubCategory}
        </Text>
        <Text fontSize="lg" fontWeight="bold">{formatIDR(item.optionPrice)}</Text>
        <HStack>
          <Button
            size="sm"
            onClick={() => handleQuantityChange(item.productId, item.variantId, item.optionId, item.quantity - 1)}
            isDisabled={item.quantity <= 1}
          >
            -
          </Button>
          <Input
            type="number"
            value={item.quantity}
            onChange={(e) => handleQuantityChange(item.productId, item.variantId, item.optionId, parseInt(e.target.value, 10))}
            textAlign="center"
            size="sm"
            w="50px"
          />
          <Button
            size="sm"
            onClick={() => handleQuantityChange(item.productId, item.variantId, item.optionId, item.quantity + 1)}
          >
            +
          </Button>
        </HStack>
        <Text fontSize="sm" color="gray.600" mt={2}>Total: {formatIDR(item.totalPrice)}</Text>
      </VStack>
    </HStack>
  </Flex>
));

export default Cart;
