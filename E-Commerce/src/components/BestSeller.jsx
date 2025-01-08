import React, { useContext, useMemo } from "react";
import { Box, Flex, VStack, Text, Grid, GridItem, useColorModeValue, Container, Heading } from "@chakra-ui/react";
import { ShopContext } from "../context/ShopContext";
import Title from "./Title";
import ProductItem from "./ProductItem";

const BestSeller = () => {
  const { products } = useContext(ShopContext);

  // Menggunakan useMemo untuk memfilter dan mengambil produk best seller hanya jika `products` berubah
  const bestSellers = useMemo(() => {
    if (!products || !products.length) return [];
    return products.filter((product) => product.bestSeller).slice(0, 5);
  }, [products]);

  const textColor = useColorModeValue("gray.700", "gray.200");

  return (
    <Box py={10} px={4}>
      <Container maxW="container.xl">
        <VStack spacing={8} textAlign="center">
          <Heading as="h2" size="xl" color={textColor}>
            <Title text1="BEST" text2="SELLERS" />
          </Heading>

        </VStack>
        {/* Rendering Best Products */}
        {bestSellers.length > 0 ? (
          <Grid
            templateColumns={{ base: "repeat(2, 1fr)", sm: "repeat(3, 1fr)", md: "repeat(4, 1fr)", lg: "repeat(5, 1fr)" }}
            gap={6}
            mt={8}
          >
            {bestSellers.map((product) => (
              <GridItem key={product._id}>
                <ProductItem id={product._id} image={product.image} name={product.name} price={product.price} />
              </GridItem>
            ))}
          </Grid>
        ) : (
          <Text>No products found.</Text>
        )}
      </Container>
    </Box>
  );
};

export default BestSeller;