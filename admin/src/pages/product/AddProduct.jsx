import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  useToast,
  Flex,
  Image,
  Icon,
  Text,
  FormErrorMessage,
} from "@chakra-ui/react";
import axios from "axios";
import ProductVariants from "./ProductVarian";
import { backendURI } from "../../App";
import { assets } from "../../assets/assets";

const AddProduct = ({ token }) => {
  const [productDetails, setProductDetails] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    sku: "",
    weight: "",
    category: "",
    subCategory: "",
    bestSeller: false, // Add bestSeller state
  });
  const [variants, setVariants] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [imageErrors, setImageErrors] = useState([]); // Track image errors
  const toast = useToast();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${backendURI}/api/category/list`, {
          headers: { token },
        });
        setCategories(response.data.categories || []);
      } catch (error) {
        console.error("Error fetching categories:", error);
        toast({
          title: "Error",
          description: "Failed to fetch categories",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    };
    fetchCategories();
  }, [token]);

  useEffect(() => {
    if (!productDetails.category) return;

    const fetchSubCategories = async () => {
      try {
        const response = await axios.get(`${backendURI}/api/subcategory/list`, {
          headers: { token },
          params: { category: productDetails.category },
        });
        setSubCategories(response.data.subCategories || []);
      } catch (error) {
        console.error("Error fetching subcategories:", error);
        toast({
          title: "Error",
          description: "Failed to fetch subcategories",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    };

    fetchSubCategories();
  }, [productDetails.category, token]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target; // Handle checkboxes
    setProductDetails((prevDetails) => ({
      ...prevDetails,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const newImageErrors = []; // Reset errors for new selection

    const newImages = files
      .map((file, index) => {
        if (file.size > 5 * 1024 * 1024) {
          // 5MB limit
          newImageErrors[index] = "Image size must be less than 5MB";
          return null; // Skip invalid files
        }
        return { file, preview: URL.createObjectURL(file) };
      })
      .filter(Boolean); // Remove null entries

    setImageErrors(newImageErrors);
    setUploadedImages((prevImages) => [...prevImages, ...newImages]);
  };

  const validateSubmission = () => {
    const errors = {};
    if (!productDetails.name) errors.name = "Product name is required.";
    if (!productDetails.category) errors.category = "Category is required.";
    if (!uploadedImages.length)
      errors.images = "At least one product image is required.";
    if (!variants.length) {
      if (
        !productDetails.sku ||
        !productDetails.price ||
        !productDetails.stock ||
        !productDetails.weight
      ) {
        errors.variants =
          "Either variants or product SKU, price, stock, and weight must be provided.";
      }
    }

    if (Object.keys(errors).length) {
      Object.values(errors).forEach((error) =>
        toast({
          title: "Validation Error",
          description: error,
          status: "error",
          duration: 5000,
          isClosable: true,
        })
      );
      return false;
    }
    return true;
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();

    if (!validateSubmission()) return;

    try {
      const formData = new FormData();
      Object.keys(productDetails).forEach((key) =>
        formData.append(key, productDetails[key])
      );
      uploadedImages.forEach((image, index) => {
        formData.append(`image${index + 1}`, image.file); // Correct field names: image1, image2, etc.
      });

      formData.append(
        "variants",
        JSON.stringify(
          variants.length
            ? variants
            : [
                {
                  name: "Default",
                  options: [
                    {
                      name: "Standard",
                      stock: productDetails.stock,
                      price: productDetails.price,
                      sku: productDetails.sku,
                      weight: productDetails.weight,
                    },
                  ],
                },
              ]
        )
      );

      const response = await axios.post(
        `${backendURI}/api/product/add`,
        formData,
        { headers: { token } }
      );

      if (response.data.success) {
        toast({
          title: "Success",
          description: response.data.message,
          status: "success",
          duration: 5000,
          isClosable: true,
        });
        // Reset form after successful submission
        setProductDetails({
          name: "",
          description: "",
          price: "",
          stock: "",
          sku: "",
          weight: "",
          category: "",
          subCategory: "",
          bestSeller: false,
        });
        setVariants([]);
        setUploadedImages([]);
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      console.error("Error submitting product:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box as="form" onSubmit={onSubmitHandler}>
      {/* Image Upload Section */}
      <FormControl mb={4} isInvalid={imageErrors.some(Boolean)}>
        <FormLabel>Upload Images</FormLabel>
        <Flex gap={4}>
          {uploadedImages.map((image, index) => (
            <Box key={index} position="relative">
              <Image
                src={image.preview}
                alt={`Uploaded ${index}`}
                width="96px"
                height="96px"
                objectFit="cover"
                borderRadius="md"
              />
              {imageErrors[index] && (
                <Text color="red.500" fontSize="sm">
                  {imageErrors[index]}
                </Text>
              )}
            </Box>
          ))}
          <Box position="relative" cursor="pointer">
            <label>
              <Flex
                justifyContent="center"
                alignItems="center"
                width="96px"
                height="96px"
                borderWidth={2}
                borderStyle="dashed"
                borderColor="gray.300"
                borderRadius="md"
              >
                <Icon as={assets.upload_icon} boxSize={8} color="gray.400" />
              </Flex>
              <Input
                type="file"
                multiple
                hidden
                onChange={handleImageChange}
                accept="image/*"
              />{" "}
              {/* Accept only images */}
            </label>
          </Box>
        </Flex>
        {imageErrors.some(Boolean) && (
          <FormErrorMessage>
            Some images have errors. Please check.
          </FormErrorMessage>
        )}
      </FormControl>

      {/* Product Details Section */}
      <FormControl mb={4}>
        <FormLabel>Product Name</FormLabel>
        <Input
          name="name"
          value={productDetails.name}
          onChange={handleInputChange}
          placeholder="Product Name"
        />
      </FormControl>
      <FormControl mb={4}>
        <FormLabel>Description</FormLabel>
        <Textarea
          name="description"
          value={productDetails.description}
          onChange={handleInputChange}
          placeholder="Product Description"
        />
      </FormControl>
      <FormControl mb={4}>
        <FormLabel>Price</FormLabel>
        <Input
          name="price"
          type="number"
          value={productDetails.price}
          onChange={handleInputChange}
          placeholder="Product Price"
          isDisabled={variants.length > 0}
        />
      </FormControl>
      <FormControl mb={4}>
        <FormLabel>Stock</FormLabel>
        <Input
          name="stock"
          type="number"
          value={productDetails.stock}
          onChange={handleInputChange}
          placeholder="Product Stock"
          isDisabled={variants.length > 0}
        />
      </FormControl>
      {/* Category and Subcategory */}
      <FormControl mb={4}>
        <FormLabel>Category</FormLabel>
        <Select
          name="category"
          value={productDetails.category}
          onChange={handleInputChange}
          placeholder="Select Category"
        >
          {categories.map((category) => (
            <option key={category._id} value={category._id}>
              {category.name}
            </option>
          ))}
        </Select>
      </FormControl>

      <FormControl mb={4}>
        <FormLabel>Product SKU</FormLabel>
        <Input
          name="sku"
          value={productDetails.sku}
          onChange={handleInputChange}
          placeholder="Product SKU"
          isDisabled={variants.length > 0} // Disable when variants are present
        />
      </FormControl>
      <FormControl mb={4}>
        <FormLabel>Product Weight</FormLabel>
        <Input
          name="weight"
          type="number"
          value={productDetails.weight}
          onChange={handleInputChange}
          placeholder="Product Weight (in kg)"
          isDisabled={variants.length > 0} // Disable when variants are present
        />
      </FormControl>
      <FormControl mb={4}>
        <FormLabel>Subcategory</FormLabel>
        <Select
          name="subCategory"
          value={productDetails.subCategory}
          onChange={handleInputChange}
          placeholder="Select Subcategory"
          isDisabled={!productDetails.category}
        >
          {subCategories.map((subCategory) => (
            <option key={subCategory._id} value={subCategory._id}>
              {subCategory.name}
            </option>
          ))}
        </Select>
      </FormControl>
      <FormControl mb={4}>
        <FormLabel>Best Seller</FormLabel>
        <Input
          type="checkbox"
          name="bestSeller"
          checked={productDetails.bestSeller}
          onChange={handleInputChange}
        />
      </FormControl>
      {/* Variants Section */}
      <ProductVariants variants={variants} setVariants={setVariants} />
      <Button type="submit" colorScheme="blue" mt={4}>
        Add Product
      </Button>
    </Box>
  );
};

export default AddProduct;
