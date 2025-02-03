import React, { useState, useEffect } from "react";
import axios from "axios";
import { backendURI } from "../../App";
import { toast } from "react-toastify";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  Spinner,
  Image,
  Heading,
  Grid,
  GridItem,
  Stack,
} from "@chakra-ui/react";

const UpdateCategory = ({ token }) => {
  const { categoryId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [initialImage, setInitialImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [formValues, setFormValues] = useState({
    name: "",
    description: "",
    status: "active",
    image: null,
  });

  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormValues({ ...formValues, [name]: value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setFormValues({ ...formValues, image: file });
    setImagePreview(URL.createObjectURL(file));
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const formData = new FormData();
      Object.entries(formValues).forEach(([key, value]) => {
        if (value) formData.append(key, value);
      });

      const response = await axios.put(
        `${backendURI}/api/category/edit/${categoryId}`,
        formData,
        {
          headers: { token, "Content-Type": "multipart/form-data" },
        }
      );

      if (response.data.success) {
        toast.success("Category berhasil diupdate!");
        navigate("/category/list");
      } else {
        toast.error(response.data.message || "Gagal mengupdate kategori");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchCategory = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(
          `${backendURI}/api/category/${categoryId}/get`,
          { headers: { token } }
        );

        if (!response?.data?.success) {
          throw new Error(
            response?.data?.message || "Gagal mengambil data kategori"
          );
        }

        if (!response?.data?.category) {
          throw new Error("Data kategori tidak ditemukan");
        }

        const categoryData = response.data.category;
        setInitialImage(categoryData.image);
        setFormValues({
          name: categoryData.name || "",
          description: categoryData.description || "",
          status: categoryData.status || "active",
        });
      } catch (err) {
        setError(err.message || "Terjadi kesalahan saat memuat data.");
        toast.error(error?.message || "Terjadi kesalahan");
      } finally {
        setLoading(false);
      }
    };

    if (categoryId) {
      fetchCategory();
    } else {
      setLoading(false);
    }
  }, [categoryId, token]);

  if (loading) return <Spinner size="xl" />;
  if (error) return <p>{error}</p>;

  return (
    <form onSubmit={onSubmitHandler}>
      <Box maxW="7xl" mx="auto" px={{ base: 4, md: 6 }} py={8}>
        <Heading as="h1" size="xl" textAlign="center" mb={8}>
          Ubah Kategori
        </Heading>

        <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={6}>
          <GridItem>
            {" "}
            {/* Kolom kiri untuk gambar */}
            <FormControl mb={4}>
              <FormLabel>Gambar Kategori</FormLabel>
              <Input type="file" onChange={handleImageChange} />
              {/* Periksa jika imagePreview atau initialImage ada */}
              {imagePreview || initialImage ? (
                <Image
                src={imagePreview || initialImage}
                alt="Gambar Kategori"
                width="100%"
                height="100%"
                />
              ) : (
                <Text>Gambar tidak tersedia.</Text>
              )}
            </FormControl>
          </GridItem>

          <GridItem>
            <FormControl id="name" mb={4} isRequired>
              <FormLabel>Nama Kategori</FormLabel>
              <Input
                type="text"
                name="name"
                value={formValues.name}
                onChange={handleInputChange}
                required
              />
            </FormControl>

            <FormControl id="description" mb={4}>
              <FormLabel>Deskripsi</FormLabel>
              <Textarea
                name="description"
                value={formValues.description}
                onChange={handleInputChange}
              />
            </FormControl>

            <FormControl id="status" mb={4}>
              <FormLabel>Status</FormLabel>
              <Select
                name="status"
                value={formValues.status}
                onChange={handleInputChange}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Select>
            </FormControl>
          </GridItem>
        </Grid>

        <Stack mt={6} spacing={4} justify="center">
          <Button
            type="submit"
            colorScheme="blue"
            width={{ base: "100%", sm: "auto" }}
            isLoading={loading}
          >
            Update Category
          </Button>
        </Stack>
      </Box>
    </form>
  );
};

export default UpdateCategory;
