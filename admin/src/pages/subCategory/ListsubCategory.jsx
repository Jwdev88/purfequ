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
  IconButton,
  InputGroup,
  InputLeftElement,
} from "@chakra-ui/react";
import { CheckCircleIcon, CloseIcon, EditIcon, DeleteIcon, SearchIcon } from "@chakra-ui/icons";
import { useNavigate } from "react-router-dom";

const SubCategoryList = ({ token }) => {
  const [subcategories, setSubCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showFilter, setShowFilter] = useState(false);
  const [sortName, setSortName] = useState("");
  const [sortStatus, setSortStatus] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchSubCategories();
  }, [token]);

  const fetchSubCategories = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${backendURI}/api/subcategory/list`, {
        headers: { token },
      });
      if (response.data.success) {
        setSubCategories(response.data.subCategories);
      } else {
        toast.error(response.data.message || "Failed to fetch subcategories");
      }
    } catch (error) {
      toast.error("An error occurred while fetching subcategories");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditSubCategory = (id) => navigate(`/subcategory/edit/${id}`);
  const handleDeleteSubCategory = async (id) => {
    if (window.confirm("Are you sure you want to delete this subcategory?")) {
      try {
        const response = await axios.delete(`${backendURI}/api/subcategory/delete/${id}`, {
          headers: { token },
        });
        if (response.data.success) {
          toast.success("Subcategory deleted successfully!");
          fetchSubCategories();
        } else {
          toast.error("Failed to delete subcategory");
        }
      } catch (error) {
        toast.error("An error occurred while deleting the subcategory");
      }
    }
  };

  const filteredSubCategories = subcategories
    .filter((subcategory) => subcategory.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => (sortName === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)))
    .filter((subcategory) => !sortStatus || subcategory.status === sortStatus);

  return (
    <Box maxW="7xl" mx="auto" px={6} py={8}>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg">Subcategories</Heading>
        <Button colorScheme="green" onClick={() => navigate("/subcategory/add")}>Add SubCategory</Button>
      </Flex>

      <Flex gap={4} mb={6} wrap={{ base: "wrap", md: "nowrap" }}>
        <InputGroup flex="1">
          <InputLeftElement pointerEvents="none">
            <SearchIcon color="gray.400" />
          </InputLeftElement>
          <Input placeholder="Search subcategories..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
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
      ) : filteredSubCategories.length === 0 ? (
        <Text color="gray.500" textAlign="center">No subcategories found</Text>
      ) : (
        <Box overflowX="auto">
          <Table variant="striped" colorScheme="gray">
            <Thead>
              <Tr>
                <Th>Name</Th>
                <Th>Category</Th>
                <Th>Status</Th>
                <Th>Action</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredSubCategories.map((subcategory) => (
                <Tr key={subcategory._id} _hover={{ bg: "gray.50" }}>
                  <Td>{subcategory.name}</Td>
                  <Td>{subcategory.category?.name || "N/A"}</Td>
                  <Td>
                    <Badge px={2} py={1} rounded="full" fontSize="xs" colorScheme={subcategory.status === "active" ? "green" : "red"}>
                      {subcategory.status === "active" ? <CheckCircleIcon mr={1} /> : <CloseIcon mr={1} />} {subcategory.status}
                    </Badge>
                  </Td>
                  <Td textAlign="right">
                    <Flex gap={2}>
                      <IconButton icon={<EditIcon />} aria-label="Edit" onClick={() => handleEditSubCategory(subcategory._id)} colorScheme="blue" />
                      <IconButton icon={<DeleteIcon />} aria-label="Delete" onClick={() => handleDeleteSubCategory(subcategory._id)} colorScheme="red" />
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

export default SubCategoryList;
