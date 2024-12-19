import React from "react";
import {
  Box,
  Button,
  Flex,
  Image,
  Text,
  VStack,
  HStack,
  IconButton,
  Collapse,
  useDisclosure,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
} from "@chakra-ui/react";
import { MoreHorizontal, Edit, Trash2 } from "lucide-react";

export const ProductCard = ({ product, onEdit, onDelete }) => {
  const { isOpen, onToggle } = useDisclosure();

  return (
    <Box
      bg="white"
      rounded="lg"
      shadow="sm"
      borderWidth="1px"
      borderColor="gray.200"
      _hover={{ shadow: "md" }}
      transition="box-shadow 0.2s"
      p={4}
    >
      <Flex align="start" gap={4}>
        <Box w="24" h="24" flexShrink={0}>
          {product.images && product.images.length > 0 ? (
            <Image
              src={product.images[0]}
              alt={product.name}
              objectFit="cover"
              rounded="lg"
              w="full"
              h="full"
            />
          ) : (
            <Flex
              w="full"
              h="full"
              bg="gray.200"
              rounded="lg"
              align="center"
              justify="center"
            >
              <Text color="gray.400">No image</Text>
            </Flex>
          )}
          
        </Box>

        <Box flex="1" position="relative">
          <Flex justify="space-between" align="start">
            <VStack align="start" spacing={1}>
              <Text fontWeight="medium" color="gray.900">
                {product.name}
              </Text>
              <Text fontSize="sm" color="gray.500">
                {product.description.substring(0, 100)}...
              </Text>
            </VStack>
            <Menu>
            <VStack align="start" spacing={0}>
              <Text fontSize="sm" color="gray.500">
                Category
              </Text>
              <Text>{product.category.name}</Text>
              <Text>{product.subCategory.name}</Text>
            </VStack>
            <VStack align="start" spacing={0}>
              <Text fontSize="sm" color="gray.500">
                SKU
              </Text>
              <Text fontSize="sm" fontWeight="medium">
                {product.sku !==null ? product.sku : ""} 
              </Text>
            </VStack>
            <VStack align="start" spacing={0}>
              <Text fontSize="sm" color="gray.500">
                Stock
              </Text>
              <Text fontSize="sm" fontWeight="medium">
                {product.stock !== null ? product.stock : ""}
              </Text>
            </VStack>
              <MenuButton
                as={IconButton}
                aria-label="Options"
                icon={<MoreHorizontal />}
                variant="ghost"
                size="sm"
                _hover={{ bg: "gray.100" }}
              />
              <MenuList>
                <MenuItem icon={<Edit />} onClick={() => onEdit(product._id)}>
                  Edit Product
                </MenuItem>
                <MenuItem
                  icon={<Trash2 />}
                  onClick={() => onDelete(product._id)}
                  color="red.600"
                >
                  Delete Product
                </MenuItem>
              </MenuList>
            </Menu>
          </Flex>

          <HStack mt={4} spacing={4}>



          </HStack>

          {product.variants && product.variants.length > 0 ? (
            <Box mt={4}>
              <Flex justify="space-between" align="center" mb={2}>
                <Text fontSize="sm" fontWeight="medium" color="gray.700">
                  Variasi Produk:
                </Text>
                <Button
                  size="sm"
                  variant="link"
                  colorScheme="blue"
                  onClick={onToggle}
                >
                  {isOpen ? "Sembunyikan Detail" : "Lihat Detail"}
                </Button>
              </Flex>
              <Collapse in={isOpen}>
                <Box borderWidth="1px" rounded="md" p={2}>
                  {product.variants.map((variant) => (
                    <Box key={variant._id} borderBottomWidth="1px" py={2}>
                      {variant.options.map((option) => (
                        <Flex
                          key={option._id}
                          justify="space-between"
                          align="center"
                        >
                          <VStack align="start" spacing={0}>
                            <Text
                              fontSize="sm"
                              fontWeight="medium"
                              color="gray.900"
                            >
                              {option.name}
                            </Text>
                            <Text fontSize="xs" color="gray.500">
                              SKU: {option.sku}
                            </Text>
                          </VStack>
                          <HStack spacing={4}>
                            <Text
                              fontSize="sm"
                              fontWeight="medium"
                              color="gray.900"
                            >
                              Rp {option.price}
                            </Text>
                            <Text fontSize="sm" color="gray.500">
                              Stok: {option.stock}
                            </Text>
                            <Button
                              size="sm"
                              variant="ghost"
                              colorScheme="gray"
                            >
                              <MoreHorizontal />
                            </Button>
                          </HStack>
                        </Flex>
                      ))}
                    </Box>
                  ))}
                </Box>
              </Collapse>
            </Box>
          ) : (
            <Box mt={4}>
              <Text fontSize="sm" color="gray.500">
                Price
              </Text>
              <Text fontSize="lg" fontWeight="medium" color="blue.600">
                Rp.{product.price}
              </Text>
            </Box>
          )}
        </Box>
      </Flex>
    </Box>
  );
};

export default ProductCard;