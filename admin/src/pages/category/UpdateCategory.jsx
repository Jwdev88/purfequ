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
// 
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
          headers: {
            token,
            "Content-Type": "multipart/form-data",
          },
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
          const errorMessage =
            response?.data?.message || "Gagal mengambil data kategori";
          toast.error(errorMessage);
          setError(errorMessage);
          return;
        }

        if (!response?.data?.category) {
          toast.error("Data kategori tidak ditemukan");
          setError("Data kategori tidak ditemukan");
          return;
        }

        const categoryData = response.data.category;

        setInitialImage(categoryData.imageData[0].secure_urls);

        setFormValues({
          name: categoryData.name || "",
          description: categoryData.description || "",
          status: categoryData.status || "active",
          image: null,
        });
      } catch (err) {
        const errorMessage =
          err.message || "Terjadi kesalahan saat memuat data.";
        setError(errorMessage);
        toast.error(errorMessage);
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

  if (loading) {
    return (
      <Box className="flex justify-center items-center h-screen">
        <Spinner size="xl" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box className="flex justify-center items-center h-screen">
        <p>{error}</p>
      </Box>
    );
  }

  return (
    <Box as="form" onSubmit={onSubmitHandler} p={4} className="flex flex-col md:w-2/3">
      {(initialImage || imagePreview) && (
        <Box mb={4}>
          <Image
            src={imagePreview || initialImage}
            alt="Category Image"
            maxW="xs"
          />
        </Box>
      )}

<FormControl mb={4}>
        <FormLabel>Upload Gambar</FormLabel>
        <Input type="file" onChange={handleImageChange} />
        {imagePreview && <Image src={imagePreview} alt="Image Preview" mt={2} />}
      </FormControl>

      <FormControl mb={4}>
        <FormLabel>Nama Category</FormLabel>
        <Input
          name="name"
          value={formValues.name}
          onChange={handleInputChange}
          required
        />
      </FormControl>

      <FormControl mb={4}>
        <FormLabel>Description Category</FormLabel>
        <Textarea
          name="description"
          value={formValues.description}
          onChange={handleInputChange}
          required
        />
      </FormControl>

      <FormControl mb={4}>
        <FormLabel>Status Category</FormLabel>
        <Select
          name="status"
          value={formValues.status}
          onChange={handleInputChange}
          required
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Select>
      </FormControl>

      <Button type="submit" colorScheme="blue" mt={10}>
        Update Category
      </Button>
    </Box>
  );
};

export default UpdateCategory;