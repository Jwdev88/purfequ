import React, { useContext } from 'react';
import { Box, Flex, Text, Divider, Heading, VStack, useColorModeValue } from "@chakra-ui/react";
import { ShopContext } from '../context/ShopContext'
import Title from './Title'

const CartTotal = () => {
  const { getCartAmount, formatIDR } = useContext(ShopContext);
  const totalAmount = getCartAmount();

  const bg = useColorModeValue("gray.50", "gray.800");

  return (
    <Box
      w="full"
      h="auto"
      maxH="120px"
      bg={bg}
      p={6}
      rounded="lg"
      shadow="md"
    >
      <Heading as="div" size="md" mb={4}>
        <Title text1="CART" text2="TOTALS" />
      </Heading>
      <VStack spacing={4} textAlign="sm" mt={2} w="full">
        <Flex justify="space-between" w="full">
          <Text mr={2}>SubTotal Pesanan</Text>
          <Text>: {formatIDR(totalAmount)}</Text>
        </Flex>
        <Divider />
      </VStack>
    </Box>
  )
}


export default CartTotal
