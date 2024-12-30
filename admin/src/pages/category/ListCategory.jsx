import React, { useState, useEffect } from "react";
import axios from "axios";
import { backendURI } from "../../App";
import { toast } from "react-toastify";
import {
  Box,
  Button,
  Flex,
  Heading,
  Input,
  Select,
  Spinner,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  
  Text,
  Badge,
  Image,
  IconButton,
} from "@chakra-ui/react";
import { CheckCircleIcon, CloseIcon, EditIcon, DeleteIcon } from "@chakra-ui/icons";
import { useNavigate } from "react-router-dom";
const CategoryList = ({ token }) => {
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showFilter, setShowFilter] = useState(false);
  const [sortName, setSortName] = useState("");
  const [sortStatus, setSortStatus] = useState("");
  const navigate = useNavigate();
// 
  useEffect(() => {
    fetchCategories();
  }, [token]);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${backendURI}/api/category/list`, {
        headers: { token },
      });
      if (response.data.success) {
        setCategories(response.data.categories);
      } else {
        toast.error(response.data.message || "Failed to fetch categories");
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("An error occurred while fetching categories");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditCategory = (id) => {
    navigate(`/category/edit/${id}`);
  };


  const handleDeleteCategory = async (id) => {
    if (window.confirm("Are you sure you want to delete this category?")) {
      try {
        const response = await axios.delete(`${backendURI}/api/category/delete/${id}`, {
          headers: { token },
        });
        if (response.data.success) {
          toast.success("Category deleted successfully!");
          fetchCategories();
        } else {
          toast.error(response.data.message || "Failed to delete category");
        }
      } catch (error) {
        console.error("Error deleting category:", error);
        toast.error("An error occurred while deleting the category");
      }
    }
  };

  const filteredCategories = categories
    .filter((category) =>
      category.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortName === "asc") {
        return a.name.localeCompare(b.name);
      } else if (sortName === "desc") {
        return b.name.localeCompare(a.name);
      }
      return 0;
    })
    .filter((category) => !sortStatus || category.status === sortStatus);

  return (
    <Box maxW="7xl" mx="auto" px={4} py={8}>
      <Flex justify="space-between" align="center" mb={8}>
        <Heading as="h1" size="lg">
          Categories
        </Heading>
        <Button colorScheme="green" onClick={() => navigate("/category/add")}>
          Add Category
        </Button>
      </Flex>

      <Flex direction={{ base: "column", md: "row" }} gap={4} mb={6}>
        <Box flex="1" position="relative">
          <Input
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            pl={10}
          />
        </Box>
        <Box>
          <Button onClick={() => setShowFilter(!showFilter)}>Filters</Button>
          {showFilter && (
            <Box mt={2} p={4} shadow="md" bg="white" rounded="md">
              <Select
                placeholder="Sort by Name"
                value={sortName}
                onChange={(e) => setSortName(e.target.value)}
              >
                <option value="asc">A - Z</option>
                <option value="desc">Z - A</option>
              </Select>
              <Select
                mt={2}
                placeholder="Select Status"
                value={sortStatus}
                onChange={(e) => setSortStatus(e.target.value)}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Select>
            </Box>
          )}
        </Box>
      </Flex>

      {isLoading ? (
        <Flex justify="center" align="center" h="64">
          <Spinner size="xl" />
        </Flex>
      ) : filteredCategories.length === 0 ? (
        <Flex justify="center" py={12}>
          <Text color="gray.500">No categories found</Text>
        </Flex>
      ) : (
        <Box overflowX="auto">
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Image</Th>
                <Th>Name</Th>
                <Th>Status</Th>
                <Th>Action</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredCategories.map((category) => (
                <Tr key={category._id} _hover={{ bg: "gray.50" }}>
                  <Td>
                    <Box boxSize="10">
                      {category.image ? (
                        <Image
                          boxSize="10"
                          borderRadius="full"
                          objectFit="cover"
                          src={category.image}
                          alt={category.name}
                          onError={(e) => {
                            e.target.onerror = null; // Prevents infinite loop if fallback also fails
                            e.target.src = "/path/to/default-image.jpg"; // Fallback image
                          }}
                        />
                      ) : (
                        <Box bg="gray.200" rounded="full" />
                      )}
                    </Box>
                  </Td>
                  <Td>{category.name}</Td>
                  <Td>
                    <Badge
                      px={2}
                      py={1}
                      rounded="full"
                      fontSize="xs"
                      colorScheme={
                        category.status === "active" ? "green" : "red"
                      }
                      display="flex"
                      alignItems="center"
                    >
                      {category.status === "active" ? (
                        <CheckCircleIcon mr={1} />
                      ) : (
                        <CloseIcon mr={1} />
                      )}
                      {category.status}
                    </Badge>
                  </Td>
                  <Td textAlign="right">
                    <Flex justify="flex-end" gap={4}>
                      <IconButton
                        icon={<EditIcon />}
                        aria-label="Edit"
                        onClick={() =>
                          handleEditCategory(category._id, {
                          })
                        }
                        colorScheme="blue"
                      />
                      <IconButton
                        icon={<DeleteIcon />}
                        aria-label="Delete"
                        onClick={() => handleDeleteCategory(category._id)}
                        colorScheme="red"
                      />
                    </Flex>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      )}
    </Box>
  );
};

export default CategoryList;