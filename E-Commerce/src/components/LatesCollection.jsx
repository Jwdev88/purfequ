import React, { useContext, useEffect, useState } from 'react'
import { Box, Flex, VStack, Text, Grid, GridItem, useColorModeValue, Container, Heading } from "@chakra-ui/react";
import { ShopContext } from '../context/ShopContext'
import Title from './Title'; 
import ProductItem from './ProductItem';

const LatesCollection = () => {
    const { products } = useContext(ShopContext);
    const [latestProducts, setLatestProducts] = useState([]);
    
    useEffect(() => {
        setLatestProducts(products.slice(0, 12));
    }, [products]);
  
    const textColor = useColorModeValue("gray.700", "gray.200");

    return (
        <Box py={10} px={4}>
            <Container maxW="container.xl">
                <VStack spacing={8} textAlign="center">
                    <Heading as="h2" size="xl" color={textColor}>
                        <Title text1="LATEST" text2="COLLECTIONS" />
                    </Heading>
                    {/* <Text fontSize={{ base: "sm", sm: "md", md: "lg" }} color="gray.600" maxW="2xl">
                        Lorem ipsum dolor sit amet consectetur, adipisicing elit. Vero adipisci maxime cumque deserunt. Similique reprehenderit sit commodi repudiandae maiores provident consequuntur praesentium quod, labore delectus cupiditate iusto. Necessitatibus, officiis dignissimos.
                    </Text> */}
                </VStack>
                {/* Rendering Products */}
                <Grid
                    templateColumns={{ base: "repeat(2, 1fr)", sm: "repeat(3, 1fr)", md: "repeat(4, 1fr)", lg: "repeat(5, 1fr)" }}
                    gap={6}
                    mt={8}
                >
                    {latestProducts.map((item, index) => (
                        <GridItem key={index}>
                            <ProductItem id={item._id} image={item.image} name={item.name} price={item.price} />
                        </GridItem>
                    ))}
                </Grid>
            </Container>
        </Box>
    );
}

export default LatesCollection;
