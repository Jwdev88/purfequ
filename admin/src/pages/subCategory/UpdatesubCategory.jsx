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

const UpdateSubCategory = ({ token }) => {
  const { subcategoryId } = useParams();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [initialImage, setInitialImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [formValues, setFormValues] = useState({
    name: "",
    description: "",
    status: "active",
    category: "",
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
        `${backendURI}/api/subcategory/edit/${subcategoryId}`,
        formData,
        {
          headers: {
            token,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success) {
        toast.success(response.data.message);
        navigate("/subCategory/list");
      } else {
        toast.error(response.data.message || "Gagal memperbarui subkategori.");
      }
    } catch (error) {
      console.error("Error updating subcategory:", error);
      toast.error("Terjadi kesalahan saat memperbarui subkategori.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${backendURI}/api/category/list`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCategories(response.data.categories || []);
      } catch (error) {
        toast.error("Gagal mengambil data category.");
        console.error("Error fetching categories:", error);
      }
    };

    const fetchSubCategory = async () => {
      try {
        const response = await axios.get(
          `${backendURI}/api/subCategory/${subcategoryId}/get`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (response.data.success) {
          const subcategory = response.data.subcategory;
          setFormValues({
            name: subcategory.name || "",
            description: subcategory.description || "",
            status: subcategory.status || "active",
            category: subcategory.category?._id || "",
          });

          const imageURL = subcategory.imageData[0]?.secure_url || null;
          setInitialImage(imageURL);
          setImagePreview(imageURL);
        } else {
          toast.error(response.data.message || "Subkategori tidak ditemukan.");
        }
      } catch (error) {
        toast.error("Terjadi kesalahan saat mengambil data subCategory.");
        console.error("Error fetching subcategory:", error);
      } finally {
        setLoading(false);
        setError(null);
      }
    };

    fetchCategories();
    fetchSubCategory();
  }, [subcategoryId, token]);

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
      <FormControl mb={4}>
        <FormLabel>Nama subCatagory</FormLabel>
        <Input
          name="name"
          value={formValues.name}
          onChange={handleInputChange}
          required
        />
      </FormControl>

      <FormControl mb={4}>
        <FormLabel>Description</FormLabel>
        <Textarea
          name="description"
          value={formValues.description}
          onChange={handleInputChange}
          required
        />
      </FormControl>

      <FormControl mb={4}>
        <FormLabel>Upload Gambar</FormLabel>
        <Input type="file" onChange={handleImageChange} />
        {imagePreview && <Image src={imagePreview} alt="Image Preview" mt={2} />}
      </FormControl>

      <FormControl mb={4}>
        <FormLabel>Catagory</FormLabel>
        <Select
          name="category"
          value={formValues.category}
          onChange={handleInputChange}
          required
        >
          <option disabled value="">
            Pilih Kategori
          </option>
          {categories.map((category) => (
            <option key={category._id} value={category._id}>
              {category.name}
            </option>
          ))}
        </Select>
      </FormControl>

      <FormControl mb={4}>
        <FormLabel>Status</FormLabel>
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
        Update SubCategory
      </Button>
    </Box>
  );
};

export default UpdateSubCategory;