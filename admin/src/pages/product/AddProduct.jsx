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
  Checkbox,
} from "@chakra-ui/react";
import axios from "axios";
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
    bestSeller: false,
  });
  const [variants, setVariants] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [imageErrors, setImageErrors] = useState([]);
  const [productId, setProductId] = useState(null);
  const [hasVariants, setHasVariants] = useState(false);
  const toast = useToast();

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${backendURI}/api/category/list`, {
        headers: { token },
      });
      setCategories(response.data.categories || []);
    } catch (error) {
      handleError("Gagal mengambil kategori");
    }
  };

  const fetchSubCategories = async (category) => {
    try {
      const response = await axios.get(`${backendURI}/api/subcategory/list`, {
        headers: { token },
        params: { category },
      });
      setSubCategories(response.data.subCategories || []);
    } catch (error) {
      handleError("Gagal mengambil subkategori");
    }
  };

  const handleError = (message) => {
    console.error(message);
    toast({
      title: "Error",
      description: message,
      status: "error",
      duration: 5000,
      isClosable: true,
    });
  };

  useEffect(() => {
    fetchCategories();
  }, [token]);

  useEffect(() => {
    if (productDetails.category) {
      fetchSubCategories(productDetails.category);
    }
  }, [productDetails.category, token]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProductDetails((prevDetails) => ({
      ...prevDetails,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleVariantsCheckboxChange = (e) => {
    const isChecked = e.target.checked;
    setHasVariants(isChecked);
    if (!isChecked) {
      setVariants([]); // Clear variants if the checkbox is unchecked
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const newImageErrors = [];

    const newImages = files
      .map((file, index) => {
        if (file.size > 5 * 1024 * 1024) {
          newImageErrors[index] = "Ukuran gambar harus kurang dari 5MB";
          return null;
        }
        return { file, preview: URL.createObjectURL(file) };
      })
      .filter(Boolean);

    setImageErrors(newImageErrors);
    setUploadedImages((prevImages) => [...prevImages, ...newImages]);
  };

  const validateVariants = () => {
    for (const variant of variants) {
      if (!variant.name) {
        toast({
          title: "Validation Error",
          description: "Each variant must have a name.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        return false;
      }
      for (const option of variant.options) {
        if (
          !option.name ||
          option.stock < 0 ||
          option.price < 0 ||
          !option.sku ||
          option.weight < 0
        ) {
          toast({
            title: "Validation Error",
            description:
              "Each option must have valid name, stock, price, SKU, and weight.",
            status: "error",
            duration: 5000,
            isClosable: true,
          });
          return false;
        }
      }
    }
    return true;
  };

  const validateSubmission = () => {
    const errors = {};
    if (!productDetails.name) errors.name = "Nama produk diperlukan.";
    if (!productDetails.category) errors.category = "Kategori diperlukan.";
    if (!uploadedImages.length)
      errors.images = "Setidaknya satu gambar produk diperlukan.";
    if (!variants.length && hasVariants) {
      errors.variants = "Varian harus ditambahkan jika produk memiliki varian.";
    }

    if (Object.keys(errors).length) {
      Object.values(errors).forEach((error) =>
        toast({
          title: "Kesalahan Validasi",
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
    if (!validateVariants()) return;
    if (!validateSubmission()) return;

    try {
      const formData = new FormData();
      Object.keys(productDetails).forEach((key) =>
        formData.append(key, productDetails[key])
      );
      uploadedImages.forEach((image, index) => {
        formData.append(`image${index + 1}`, image.file);
      });

      if (Array.isArray(variants) && variants.length > 0) {
        formData.append("variants", JSON.stringify(variants));
      }

      const response = await axios.post(
        `${backendURI}/api/product/add`,
        formData,
        {
          headers: {
            token,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success && response.data.productId) {
        setProductId(response.data.productId);
        toast({
          title: "Sukses",
          description: response.data.message,
          status: "success",
          duration: 5000,
          isClosable: true,
        });
        resetForm();
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      handleError(error.response?.data?.message || error.message);
    }
  };

  const resetForm = () => {
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
    setImageErrors([]);
    setHasVariants(false);
  };

  const addVariant = () => {
    setVariants([...variants, { name: "", options: [] }]);
  };

  const addOptionToVariant = (variantIndex) => {
    const newVariants = [...variants];
    newVariants[variantIndex].options.push({
      name: "",
      stock: 0,
      price: 0,
      sku: "",
      weight: 0,
    });
    setVariants(newVariants);
  };

  const handleVariantChange = (index, field, value) => {
    const newVariants = [...variants];
    newVariants[index][field] = value;
    setVariants(newVariants);
  };

  const handleOptionChange = (variantIndex, optionIndex, field, value) => {
    const newVariants = [...variants];
    newVariants[variantIndex].options[optionIndex][field] = value;
    setVariants(newVariants);
  };

  const removeVariant = (index) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  return (
    <Box as="form" onSubmit={onSubmitHandler}>
      <FormControl mb={4} isInvalid={imageErrors.some(Boolean)}>
        {/* Add Product Detail */}
        <Text fontSize="xl" fontWeight="bold" mb={2}>
          Add Detail Produk
        </Text>
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
              />
            </label>
          </Box>
        </Flex>
        {imageErrors.some(Boolean) && (
          <FormErrorMessage>
            Beberapa gambar memiliki kesalahan. Silakan periksa.
          </FormErrorMessage>
        )}
      </FormControl>
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
          isDisabled={hasVariants}
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
          isDisabled={hasVariants}
        />
      </FormControl>
      <FormControl mb={4}>
        <FormLabel>Product SKU</FormLabel>
        <Input
          name="sku"
          value={productDetails.sku}
          onChange={handleInputChange}
          placeholder="Product SKU"
          isDisabled={hasVariants}
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
          isDisabled={hasVariants}
        />
      </FormControl>
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
        <Checkbox
          name="bestSeller"
          isChecked={productDetails.bestSeller}
          onChange={handleInputChange}
        >
          Best Seller
        </Checkbox>
      </FormControl>

      <FormControl mb={4}>
        <Checkbox
          name="hasVariants"
          isChecked={hasVariants}
          onChange={handleVariantsCheckboxChange}
        >
          Apakah Produk Memiliki Varian?
        </Checkbox>
      </FormControl>

      {hasVariants && (
        <Box mb={4}>
          <Button onClick={addVariant} colorScheme="teal" mb={2}>
            Add Variant
          </Button>
          {variants.map((variant, variantIndex) => (
            <Box key={variantIndex} mb={4}>
              <FormControl mb={2}>
                <FormLabel>Variant Name</FormLabel>
                <Input
                  value={variant.name}
                  onChange={(e) =>
                    handleVariantChange(variantIndex, "name", e.target.value)
                  }
                />
              </FormControl>
              <Button
                onClick={() => addOptionToVariant(variantIndex)}
                colorScheme="teal"
                mb={2}
              >
                Add Option
              </Button>
              {variant.options.map((option, optionIndex) => (
                <Flex key={optionIndex} mb={2}>
                  <Input
                    placeholder="Option Name"
                    value={option.name}
                    onChange={(e) =>
                      handleOptionChange(
                        variantIndex,
                        optionIndex,
                        "name",
                        e.target.value
                      )
                    }
                    mr={2}
                  />
                  <Input
                    placeholder="Stock"
                    type="number"
                    value={option.stock}
                    onChange={(e) =>
                      handleOptionChange(
                        variantIndex,
                        optionIndex,
                        "stock",
                        parseInt(e.target.value, 10)
                      )
                    }
                    mr={2}
                  />
                  <Input
                    placeholder="Price"
                    type="number"
                    value={option.price}
                    onChange={(e) =>
                      handleOptionChange(
                        variantIndex,
                        optionIndex,
                        "price",
                        parseFloat(e.target.value)
                      )
                    }
                    mr={2}
                  />
                  <Input
                    placeholder="SKU"
                    value={option.sku}
                    onChange={(e) =>
                      handleOptionChange(
                        variantIndex,
                        optionIndex,
                        "sku",
                        e.target.value
                      )
                    }
                    mr={2}
                  />
                  <Input
                    placeholder="Weight"
                    type="number"
                    value={option.weight}
                    onChange={(e) =>
                      handleOptionChange(
                        variantIndex,
                        optionIndex,
                        "weight",
                        parseFloat(e.target.value)
                      )
                    }
                    mr={2}
                  />
                </Flex>
              ))}
            </Box>
          ))}
        </Box>
      )}

      <Button type="submit" colorScheme="blue" mt={4}>
        Add Product
      </Button>
    </Box>
  );
};

export default AddProduct;