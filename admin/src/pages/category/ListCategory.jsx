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
  Tr,
  Thead,
  Text,
  Badge,
  Image,
  IconButton,
  InputGroup,
  InputLeftElement,
} from "@chakra-ui/react";
import { CheckCircleIcon, CloseIcon, EditIcon, DeleteIcon, SearchIcon } from "@chakra-ui/icons";
import { useNavigate } from "react-router-dom";

const CategoryList = ({ token }) => {
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showFilter, setShowFilter] = useState(false);
  const [sortName, setSortName] = useState("");
  const [sortStatus, setSortStatus] = useState("");
  const navigate = useNavigate();

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
      toast.error("An error occurred while fetching categories");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditCategory = (id) => navigate(`/category/edit/${id}`);
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
          toast.error("Failed to delete category");
        }
      } catch (error) {
        toast.error("An error occurred while deleting the category");
      }
    }
  };

  const filteredCategories = categories
    .filter((category) => category.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => (sortName === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)))
    .filter((category) => !sortStatus || category.status === sortStatus);

  return (
    <Box maxW="7xl" mx="auto" px={6} py={8}>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg">Categories</Heading>
        <Button colorScheme="green" onClick={() => navigate("/category/add")}>Add Category</Button>
      </Flex>

      <Flex gap={4} mb={6} wrap={{ base: "wrap", md: "nowrap" }}>
        <InputGroup flex="1">
          <InputLeftElement pointerEvents="none">
            <SearchIcon color="gray.400" />
          </InputLeftElement>
          <Input placeholder="Search categories..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </InputGroup>
        <Button onClick={() => setShowFilter(!showFilter)}>Filters</Button>
      </Flex>

      {showFilter && (
        <Box mb={6} p={4} shadow="md" bg="white" rounded="md">
          <Select placeholder="Sort by Name" value={sortName} onChange={(e) => setSortName(e.target.value)}>
            <option value="asc">A - Z</option>
            <option value="desc">Z - A</option>
          </Select>
          <Select mt={2} placeholder="Select Status" value={sortStatus} onChange={(e) => setSortStatus(e.target.value)}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
        </Box>
      )}

      {isLoading ? (
        <Flex justify="center" align="center" h="64">
          <Spinner size="xl" />
        </Flex>
      ) : filteredCategories.length === 0 ? (
        <Text color="gray.500" textAlign="center">No categories found</Text>
      ) : (
        <Box overflowX="auto">
          <Table variant="striped" colorScheme="gray">
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
                    <Image boxSize="10" borderRadius="full" src={category.image || "/path/to/default-image.jpg"} />
                  </Td>
                  <Td>{category.name}</Td>
                  <Td>
                    <Badge px={2} py={1} rounded="full" fontSize="xs" colorScheme={category.status === "active" ? "green" : "red"}>
                      {category.status === "active" ? <CheckCircleIcon mr={1} /> : <CloseIcon mr={1} />} {category.status}
                    </Badge>
                  </Td>
                  <Td textAlign="right">
                    <Flex gap={2}>
                      <IconButton icon={<EditIcon />} aria-label="Edit" onClick={() => handleEditCategory(category._id)} colorScheme="blue" />
                      <IconButton icon={<DeleteIcon />} aria-label="Delete" onClick={() => handleDeleteCategory(category._id)} colorScheme="red" />
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
