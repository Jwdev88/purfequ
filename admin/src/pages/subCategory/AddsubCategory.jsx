import React, { useEffect, useState } from "react";
import axios from "axios";
import { backendURI } from "../../App";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  RadioGroup,
  Radio,
  VStack,
  HStack,
} from "@chakra-ui/react";
// 
const AddSubCategoryForm = () => {
  const [categories, setCategories] = useState([]);
  const [formValues, setFormValues] = useState({
    name: "",
    categoryId: "",
    description: "",
    status: "active",
    image: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${backendURI}/api/category/list`);
        console.log("Fetched categories:", response.data.categories);
        setCategories(response.data.categories);
      } catch (error) {
        console.error("Error fetching categories:", error);
        toast.error("Gagal mengambil data Category");
      }
    };

    fetchCategories();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size <= 2 * 1024 * 1024 && ["image/jpeg", "image/png"].includes(file.type)) {
      setFormValues((prev) => ({ ...prev, image: file }));
    } else {
      toast.error("Format gambar tidak didukung atau ukuran terlalu besar (max: 2MB)");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("name", formValues.name);
    formData.append("category", formValues.categoryId);
    formData.append("status", formValues.status);
    formData.append("description", formValues.description);
    if (formValues.image) {
      formData.append("image", formValues.image);
    }

    try {
      const response = await axios.post(`${backendURI}/api/subcategory/add`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.success) {
        toast.success("SubCategory berhasil ditambahkan!");
        navigate("/subcategory/list");
        setFormValues({
          name: "",
          categoryId: "",
          description: "",
          status: "active",
          image: null,
        });
      } else {
        toast.error(response.data.message || "Gagal menambahkan SubCategory");
      }
    } catch (error) {
      console.error("Error adding subcategory:", error);
      toast.error("Terjadi kesalahan saat menambahkan SubCategory");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box p={6} maxW="600px" mx="auto" bg="white" shadow="md" rounded="md">
      <form onSubmit={handleSubmit}>
        <VStack spacing={4} align="stretch">
          <FormControl isRequired>
            <FormLabel>Nama SubCategory</FormLabel>
            <Input
              type="text"
              name="name"
              value={formValues.name}
              onChange={handleChange}
              placeholder="Masukkan nama subcategory"
            />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Kategori</FormLabel>
            <Select
              name="categoryId"
              value={formValues.categoryId}
              onChange={handleChange}
              placeholder="Pilih kategori"
            >
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </FormControl>

          <FormControl>
            <FormLabel>Deskripsi</FormLabel>
            <Textarea
              name="description"
              value={formValues.description}
              onChange={handleChange}
              placeholder="Masukkan deskripsi"
            />
          </FormControl>

          <FormControl>
            <FormLabel>Status</FormLabel>
            <RadioGroup
              name="status"
              value={formValues.status}
              onChange={(value) => setFormValues((prev) => ({ ...prev, status: value }))}
            >
              <HStack spacing={4}>
                <Radio value="active">Active</Radio>
                <Radio value="inactive">Inactive</Radio>
              </HStack>
            </RadioGroup>
          </FormControl>

          <FormControl>
            <FormLabel>Gambar SubCategory</FormLabel>
            <Input type="file" accept="image/jpeg, image/png" onChange={handleImageChange} />
          </FormControl>

          <Button
            type="submit"
            colorScheme="blue"
            isLoading={isSubmitting}
            loadingText="Mengirim..."
          >
            Tambah SubCategory
          </Button>
        </VStack>
      </form>
    </Box>
  );
};

export default AddSubCategoryForm;
