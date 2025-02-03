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
  Heading,
  Image,
  Spinner,
} from "@chakra-ui/react";

const AddSubCategoryForm = () => {
  const [categories, setCategories] = useState([]);
  const [formValues, setFormValues] = useState({
    name: "",
    categoryId: "",
    description: "",
    status: "active",
    image: null,
  });
  const [previewImage, setPreviewImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await axios.get(`${backendURI}/api/category/list`);
        setCategories(data.categories);
      } catch (error) {
        toast.error("Gagal mengambil data kategori");
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
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      return toast.error("Ukuran gambar terlalu besar (max: 2MB)");
    }
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      return toast.error("Format gambar harus JPG atau PNG");
    }

    setFormValues((prev) => ({ ...prev, image: file }));

    const reader = new FileReader();
    reader.onloadend = () => setPreviewImage(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("name", formValues.name);
    formData.append("category", formValues.categoryId);
    formData.append("status", formValues.status);
    formData.append("description", formValues.description);
    if (formValues.image) formData.append("image", formValues.image);

    try {
      const { data } = await axios.post(`${backendURI}/api/subcategory/add`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (data.success) {
        toast.success("Subkategori berhasil ditambahkan!");
        navigate("/subcategory/list");
        setFormValues({ name: "", categoryId: "", description: "", status: "active", image: null });
        setPreviewImage(null);
      } else {
        toast.error(data.message || "Gagal menambahkan subkategori");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan saat menambahkan subkategori");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box p={6} bg="white" shadow="md" rounded="md">
      <form onSubmit={handleSubmit}>
        <Heading as="h1" size="xl" textAlign="center" mb={8}>
          Tambah Subkategori
        </Heading>
        <VStack spacing={4} align="stretch">
          <FormControl isRequired>
            <FormLabel>Nama Subkategori</FormLabel>
            <Input type="text" name="name" value={formValues.name} onChange={handleChange} placeholder="Masukkan nama subkategori" />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Kategori</FormLabel>
            <Select name="categoryId" value={formValues.categoryId} onChange={handleChange} placeholder="Pilih kategori">
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </FormControl>

          <FormControl>
            <FormLabel>Deskripsi</FormLabel>
            <Textarea name="description" value={formValues.description} onChange={handleChange} placeholder="Masukkan deskripsi" />
          </FormControl>

          <FormControl>
            <FormLabel>Status</FormLabel>
            <RadioGroup name="status" value={formValues.status} onChange={(value) => setFormValues((prev) => ({ ...prev, status: value }))}>
              <HStack spacing={4}>
                <Radio value="active">Aktif</Radio>
                <Radio value="inactive">Nonaktif</Radio>
              </HStack>
            </RadioGroup>
          </FormControl>

          <FormControl>
            <FormLabel>Gambar Subkategori</FormLabel>
            <Input type="file" accept="image/jpeg, image/png" onChange={handleImageChange} />
            {previewImage && (
              <Box textAlign="center" mt={3}>
                <Image src={previewImage} alt="Preview" maxW="200px" mx="auto" borderRadius="md" shadow="sm" />
              </Box>
            )}
          </FormControl>

          <Button type="submit" colorScheme="blue" isLoading={isSubmitting} loadingText="Mengirim...">
            {isSubmitting ? <Spinner size="sm" mr={2} /> : "Tambah Subkategori"}
          </Button>
        </VStack>
      </form>
    </Box>
  );
};

export default AddSubCategoryForm;
