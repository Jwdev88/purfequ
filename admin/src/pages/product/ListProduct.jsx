import React, { useEffect, useState, useMemo, useCallback } from "react";
import axios from "axios";
import {
  Box,
  Button,
  Flex,
  Heading,
  Input,
  InputGroup,
  InputRightElement,
  Select,
  Spinner,
  Stack,
  Text,
  SimpleGrid,
  useBreakpointValue,
} from "@chakra-ui/react";
import { toast } from "react-toastify";
import { SearchIcon, AddIcon } from "@chakra-ui/icons";
import { ProductCard } from "./Productcard";
import { backendURI } from "../../App";
import ProductPagination from "../../ProductPagination";

// Helper functions (di luar komponen ProductList)
function filterAndSearchProducts(products, searchTerm, filterCategory, filterSubCategory) {
  let filtered = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (filterCategory) {
    filtered = filtered.filter((product) => product.category?._id === filterCategory);
  }

  if (filterSubCategory) {
    filtered = filtered.filter((product) => product.subCategory?._id === filterSubCategory);
  }

  return filtered;
}

function sortProducts(products, sortPrice) {
  if (sortPrice === "high") {
    return [...products].sort((a, b) => b.price - a.price);
  } else if (sortPrice === "low") {
    return [...products].sort((a, b) => a.price - b.price);
  } else {
    return products;
  }
}

const ProductList = ({ token }) => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterSubCategory, setFilterSubCategory] = useState("");
  const [sortPrice, setSortPrice] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);

      const productResponse = await axios.get(
        `${backendURI}/api/product/list?page=${currentPage}&limit=${productsPerPage}`,
        { headers: { token } }
      );

      if (productResponse.data.success) {
        setProducts(productResponse.data.products);
        setTotalPages(Math.ceil(productResponse.data.total / productsPerPage));
      } else {
        toast.error("Failed to fetch products");
      }

      const categoryResponse = await axios.get(`${backendURI}/api/category/list`, { headers: { token } });
      setCategories(categoryResponse.data.categories);

      const subCategoryResponse = await axios.get(`${backendURI}/api/subcategory/list`, { headers: { token } });
      setSubCategories(subCategoryResponse.data.subCategories);
    } catch (error) {
      toast.error(`Error fetching data: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [token, currentPage, productsPerPage]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const numColumns = useBreakpointValue({ base: 1, md: 2, lg: 3 });

  const filteredProducts = useMemo(() => {
    return filterAndSearchProducts(products, searchTerm, filterCategory, filterSubCategory);
  }, [products, searchTerm, filterCategory, filterSubCategory]);

  const sortedProducts = useMemo(() => {
    return sortProducts(filteredProducts, sortPrice);
  }, [filteredProducts, sortPrice]);

 const handleDelete = useCallback(
  async (productId) => {
    try {
      const response = await axios.post(
        `${backendURI}/api/product/delete`,
        { productId }, // Ensure productId is sent in the body
        {
          headers: { token }, // Ensure token is included for authentication
        }
      );
      if (response.data.success) {
        setProducts((prev) => prev.filter((product) => product._id !== productId));
        toast.success("Product deleted successfully");
      } else {
        toast.error(response.data.message || "Failed to delete product");
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error(`Error deleting product: ${error.response?.data?.message || error.message}`);
    }
  },
  [token]
);

  const handleEdit = useCallback((id) => {
    window.open(`/product/edit/${id}`, "_self");
  }, []);

  const handleAddProduct = useCallback(() => {
    window.location.href = `/product/add`;
  }, []);

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  return (
    <Box maxW="7xl" mx="auto" px={4} py={8}>
      <Flex justify="space-between" align="center" mb={8}>
        <Heading size="lg" color="gray.700">
          Products
        </Heading>
        <Button
          leftIcon={<AddIcon />}
          colorScheme="green"
          onClick={handleAddProduct}
        >
          Add Product
        </Button>
      </Flex>

      <Stack spacing={10} mb={8}>
        <InputGroup>
          <InputRightElement pointerEvents="none">
            <SearchIcon color="gray.300" />
          </InputRightElement>
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </InputGroup>
        <Flex gap={4} direction={{ base: "column", md: "row" }}>
          <Select
            placeholder="Filter by Category"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            {categories.map((category) => (
              <option key={category._id} value={category._id}>
                {category.name}
              </option>
            ))}
          </Select>
          <Select
            placeholder="Filter by Subcategory"
            value={filterSubCategory}
            onChange={(e) => setFilterSubCategory(e.target.value)}
            isDisabled={!filterCategory}
          >
            {subCategories
              .filter((sub) => sub.category?._id === filterCategory)
              .map((sub) => (
                <option key={sub._id} value={sub._id}>
                  {sub.name}
                </option>
              ))}
          </Select>
          <Select
            placeholder="Sort by Price"
            value={sortPrice}
            onChange={(e) => setSortPrice(e.target.value)}
          >
            <option value="high">Highest Price</option>
            <option value="low">Lowest Price</option>
          </Select>
        </Flex>
      </Stack>

      {isLoading ? (
        <Flex justify="center" align="center" h="200px">
          <Spinner size="lg" />
        </Flex>
      ) : sortedProducts.length === 0 ? (
        <Flex justify="center" align="center" h="200px">
          <Text>No products found</Text>
        </Flex>
      ) : (
        <Stack spacing={4}>
          {sortedProducts.map((product) => (
            <ProductCard
              key={product._id}
              product={product}
              onEdit={handleEdit}
              onDelete={() => handleDelete(product._id)}
            />
          ))}
          <ProductPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </Stack>
      )}
    </Box>
  );
};

export default ProductList;