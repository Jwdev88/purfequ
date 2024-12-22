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
  Spinner,
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
  const [loading, setLoading] = useState(false);
  const [hasVariants, setHasVariants] = useState(false);
  const toast = useToast();

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${backendURI}/api/category/list`, {
        headers: { token },
      });
      setCategories(response.data.categories || []);
    } catch (error) {
      handleError("Failed to fetch categories");
    } finally {
      setLoading(false);
    }
  };

  const fetchSubCategories = async (category) => {
    setLoading(true);
    try {
      const response = await axios.get(`${backendURI}/api/subcategory/list`, {
        headers: { token },
        params: { category },
      });
      setSubCategories(response.data.subCategories || []);
    } catch (error) {
      handleError("Failed to fetch subcategories");
    } finally {
      setLoading(false);
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
  }, [productDetails.category]);

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

    // Jika hasVariants true, reset nilai SKU, price, stock, dan weight
    if (isChecked) {
      setProductDetails((prevDetails) => ({
        ...prevDetails,
        sku: "",
        price: "",
        stock: "",
        weight: "",
      }));
    }
  };
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const newImageErrors = [];

    const newImages = files
      .map((file, index) => {
        if (file.size > 5 * 1024 * 1024) {
          newImageErrors[index] = "Image size must be less than 5MB";
          return null;
        }
        return { file, preview: URL.createObjectURL(file) };
      })
      .filter(Boolean);

    setImageErrors(newImageErrors);
    setUploadedImages((prevImages) => [...prevImages, ...newImages]);
  };

  const validateVariants = () => {
    if (!Array.isArray(variants)) {
      toast({
        title: "Validation Error",
        description: "Variants must be an array.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return false;
    }
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
    if (!productDetails.name) errors.name = "Product name is required.";
    if (!productDetails.category) errors.category = "Category is required.";
    if (!uploadedImages.length)
      errors.images = "At least one product image is required.";
    if (!variants.length && hasVariants) {
      errors.variants = "Variants must be added if the product has variants.";
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
  const removeOptionFromVariant = (variantIndex, optionIndex) => {
    const newVariants = [...variants];
    newVariants[variantIndex].options = newVariants[
      variantIndex
    ].options.filter((_, i) => i !== optionIndex);
    setVariants(newVariants);
  };
  const onSubmitHandler = async (e) => {
    e.preventDefault();

    if (hasVariants && !validateVariants()) return;
    if (!validateSubmission()) return;

    setLoading(true);
    try {
      const formData = new FormData();

      // Filter product details
      const filteredDetails = { ...productDetails };
      if (hasVariants) {
        delete filteredDetails.price;
        delete filteredDetails.stock;
        delete filteredDetails.sku;
        delete filteredDetails.weight;
      }

      Object.keys(productDetails).forEach((key) =>
        formData.append(key, productDetails[key])
      );

      uploadedImages.forEach((image, index) => {
        formData.append(`image${index + 1}`, image.file);
      });

      formData.append("variants", JSON.stringify(variants));

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

      if (response.data.success) {
        toast({
          title: "Success",
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
      toast({
        title: "Error",
        description: error.response?.data?.message || error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
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
  return (
    <Box as="form" onSubmit={onSubmitHandler}>
    <Flex
      direction="column"
      gap={{ base: 4, md: 6 }}
      px={{ base: 4, md: 8 }}
      py={{ base: 6, md: 8 }}
      maxWidth="4xl"
      mx="auto"
    >
      <Text fontSize={{ base: 'xl', md: '2xl' }} fontWeight="bold" mb={2}>
        Tambahkan Produk
      </Text>
      
      {/* Image Uploads */}
      <FormControl isInvalid={imageErrors.some(Boolean)}>
        <FormLabel>Upload Images</FormLabel>
        <Flex gap={4} wrap="wrap">
          {uploadedImages.map((image, index) => (
            <Box
              key={index}
              position="relative"
              width={{ base: '80px', md: '96px' }}
              height={{ base: '80px', md: '96px' }}
              borderRadius="md"
              overflow="hidden"
            >
              <Image
                src={image.preview}
                alt={`Uploaded ${index}`}
                objectFit="cover"
                width="100%"
                height="100%"
                boxShadow="md"
              />
              <Button
                position="absolute"
                top="2px"
                right="2px"
                size="xs"
                colorScheme="blue"
                borderRadius="full"
                variant="solid"
                bg="gray.100"
                color="gray.800"
                _hover={{ bg: "gray.200" }}
                _active={{ bg: "gray.300" }}
                onClick={() =>
                  setUploadedImages(
                    uploadedImages.filter((_, i) => i !== index)
                  )
                }
              >
                ×
              </Button>

              {imageErrors[index] && (
                <Text color="red.500" fontSize="xs">
                  {imageErrors[index]}
                </Text>
              )}
            </Box>
          ))}
          <Box>
            <label>
              <Flex
                justifyContent="center"
                alignItems="center"
                width={{ base: '80px', md: '96px' }}
                height={{ base: '80px', md: '96px' }}
                borderWidth="2px"
                borderStyle="dashed"
                borderColor="gray.300"
                borderRadius="md"
                cursor="pointer"
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
            Some images have issues. Please check them.
          </FormErrorMessage>
        )}
      </FormControl>

      {/* Product Name */}
      <FormControl isRequired>
        <FormLabel>Product Name</FormLabel>
        <Input
          name="name"
          value={productDetails.name}
          onChange={handleInputChange}
          placeholder="Enter product name"
        />
      </FormControl>

      {/* Description */}
      <FormControl isRequired>
        <FormLabel>Description</FormLabel>
        <Textarea
          name="description"
          value={productDetails.description}
          onChange={handleInputChange}
          placeholder="Enter product description"
        />
      </FormControl>

      {/* Category */}
      <FormControl isRequired>
        <FormLabel>Category</FormLabel>
        <Select
          name="category"
          value={productDetails.category}
          onChange={handleInputChange}
          placeholder="Select category"
        >
          {categories.map((category) => (
            <option key={category._id} value={category._id}>
              {category.name}
            </option>
          ))}
        </Select>
      </FormControl>

      {/* Subcategory */}
      <FormControl isDisabled={!productDetails.category}>
        <FormLabel>Subcategory</FormLabel>
        <Select
          name="subCategory"
          value={productDetails.subCategory}
          onChange={handleInputChange}
          placeholder="Select subcategory"
        >
          {subCategories.map((subCategory) => (
            <option key={subCategory._id} value={subCategory._id}>
              {subCategory.name}
            </option>
          ))}
        </Select>
      </FormControl>

      {/* Price */}
      <FormControl isRequired>
        <FormLabel>Price</FormLabel>
        <Input
          type="number"
          name="price"
          value={productDetails.price}
          onChange={handleInputChange}
          placeholder="Enter product price"
          isDisabled={hasVariants}
        />
      </FormControl>

      {/* Stock */}
      <FormControl isRequired>
        <FormLabel>Stock</FormLabel>
        <Input
          type="number"
          name="stock"
          value={productDetails.stock}
          onChange={handleInputChange}
          placeholder="Enter product stock"
          isDisabled={hasVariants}
        />
      </FormControl>

      {/* SKU */}
      <FormControl isRequired>
        <FormLabel>SKU</FormLabel>
        <Input
          name="sku"
          value={productDetails.sku}
          onChange={handleInputChange}
          placeholder="Enter product SKU"
          isDisabled={hasVariants}
        />
      </FormControl>

      {/* Weight */}
      <FormControl isRequired>
        <FormLabel>Weight (gram)</FormLabel>
        <Input
          type="number"
          name="weight"
          value={productDetails.weight}
          onChange={handleInputChange}
          placeholder="Enter product weight"
          isDisabled={hasVariants}
        />
      </FormControl>

      {/* Best Seller Checkbox */}
      <FormControl>
        <Checkbox
          name="bestSeller"
          isChecked={productDetails.bestSeller}
          onChange={handleInputChange}
        >
          Best Seller
        </Checkbox>
      </FormControl>

      {/* Variants Checkbox */}
      <FormControl>
        <Checkbox
          name="hasVariants"
          isChecked={hasVariants}
          onChange={handleVariantsCheckboxChange}
        >
          Produk memiliki varian?
        </Checkbox>
      </FormControl>

      {hasVariants && (
        <Box>
          <Button onClick={addVariant} colorScheme="blue" mb={4}>
            Add Variant
          </Button>
          {variants.map((variant, variantIndex) => (
            <Box
              key={variantIndex}
              borderWidth="1px"
              borderRadius="md"
              p={4}
              mb={4}
            >
              <Flex justifyContent="space-between">
                <FormLabel>Variant {variantIndex + 1}</FormLabel>
                <Button
                  size="sm"
                  colorScheme="red"
                  onClick={() => removeVariant(variantIndex)}
                >
                  Remove Variant
                </Button>
              </Flex>
              <FormControl isRequired>
                <FormLabel>Name</FormLabel>
                <Input
                  value={variant.name}
                  onChange={(e) =>
                    handleVariantChange(variantIndex, "name", e.target.value)
                  }
                  placeholder="Enter variant name"
                />
              </FormControl>
              <Button
                mt={2}
                onClick={() => addOptionToVariant(variantIndex)}
                colorScheme="teal"
              >
                Add Option
              </Button>
              {variant.options.map((option, optionIndex) => (
                <Flex
                  mt={2}
                  key={optionIndex}
                  gap={2}
                  direction={{ base: "column", md: "row" }}
                >
                  <FormControl>
                    <FormLabel>Name</FormLabel>
                    <Input
                      value={option.name}
                      onChange={(e) =>
                        handleOptionChange(
                          variantIndex,
                          optionIndex,
                          "name",
                          e.target.value
                        )
                      }
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Stock</FormLabel>
                    <Input
                      type="number"
                      value={option.stock}
                      onChange={(e) =>
                        handleOptionChange(
                          variantIndex,
                          optionIndex,
                          "stock",
                          e.target.value
                        )
                      }
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Price</FormLabel>
                    <Input
                      type="number"
                      value={option.price}
                      onChange={(e) =>
                        handleOptionChange(
                          variantIndex,
                          optionIndex,
                          "price",
                          e.target.value
                        )
                      }
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>SKU</FormLabel>
                    <Input
                      value={option.sku}
                      onChange={(e) =>
                        handleOptionChange(
                          variantIndex,
                          optionIndex,
                          "sku",
                          e.target.value
                        )
                      }
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Weight (g)</FormLabel>
                    <Input
                      type="number"
                      value={option.weight || 100}
                      onChange={(e) =>
                        handleOptionChange(
                          variantIndex,
                          optionIndex,
                          "weight",
                          e.target.value
                        )
                      }
                    />
                  </FormControl>

                  <Button
                    size="lg"
                    colorScheme="red"
                    onClick={() =>
                      removeOptionFromVariant(variantIndex, optionIndex)
                    }
                    width="80px"
                    height="20px"
                    fontSize="sm"
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                    mt={6}
                    py={6}
                  >
                    Remove
                  </Button>
                </Flex>
              ))}
            </Box>
          ))}
        </Box>
      )}

      {loading ? (
        <Spinner size="lg" />
      ) : (
        <Button type="submit" colorScheme="green" mt={4}>
          Submit Product
        </Button>
      )}
    </Flex>
  </Box>
);

};

export default AddProduct;
