import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Checkbox,
  FormControl,
  FormLabel,
  Input,
  Select,
  VStack,
  Text,
} from "@chakra-ui/react";
import { FaUpload } from "react-icons/fa";
import PropTypes from "prop-types";
import ProductVarian from "./VarianManager";
import ImageUpload from "./ImageUpload";

const CustomFormControl = ({
  label,
  type,
  name,
  value,
  onChange,
  isRequired,
  error,
}) => (
  <FormControl isRequired={isRequired}>
    <FormLabel>{label}</FormLabel>
    <Input type={type} name={name} value={value} onChange={onChange} />
    {error && <Text color="red.500">{error}</Text>}
  </FormControl>
);

const ProductForm = ({ categories, onSubmit }) => {
  const [product, setProduct] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    sku: "",
    weight: "",
    category: "",
    subCategory: "",
    bestSeller: false,
    variants: [],
  });

  const [hasVariants, setHasVariants] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [imageErrors, setImageErrors] = useState([]);
  const [formErrors, setFormErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProduct((prevProduct) => ({
      ...prevProduct,
      [name]: type === "checkbox" ? checked : value,
    }));
  };
  useEffect(() => {
    console.log("Categories loaded:", categories);
  }, [categories]);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const newImages = files.map((file) => {
      if (!file.type.startsWith("image/")) {
        return { error: "Invalid file type", file };
      }
      return { preview: URL.createObjectURL(file), file };
    });

    setUploadedImages(newImages.filter((img) => !img.error));
    setImageErrors(newImages.map((img) => img.error || ""));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errors = {};
    if (!product.name) errors.name = "Product name is required.";
    if (!product.price) errors.price = "Price is required.";
    if (!product.sku) errors.sku = "SKU is required.";
    if (!product.weight) errors.weight = "Weight is required.";
    if (product.price < 0) errors.price = "Price must be non-negative.";
    if (product.stock < 0) errors.stock = "Stock must be non-negative.";
    if (product.weight < 0) errors.weight = "Weight must be non-negative.";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    onSubmit(product);
  };

  useEffect(() => {
    return () => {
      uploadedImages.forEach((img) => URL.revokeObjectURL(img.preview));
    };
  }, [uploadedImages]);

  return (
    <Box as="form" onSubmit={handleSubmit}>
      <VStack spacing={4}>
        <CustomFormControl
          label="Product Name"
          type="text"
          name="name"
          value={product.name}
          onChange={handleInputChange}
          isRequired
          error={formErrors.name}
        />
        <CustomFormControl
          label="Description"
          type="text"
          name="description"
          value={product.description}
          onChange={handleInputChange}
        />
        <CustomFormControl
          label="Price"
          type="number"
          name="price"
          value={product.price}
          onChange={handleInputChange}
          isRequired
          error={formErrors.price}
        />
        <CustomFormControl
          label="Stock"
          type="number"
          name="stock"
          value={product.stock}
          onChange={handleInputChange}
          error={formErrors.stock}
        />
        <CustomFormControl
          label="SKU"
          type="text"
          name="sku"
          value={product.sku}
          onChange={handleInputChange}
          isRequired
          error={formErrors.sku}
        />
        <CustomFormControl
          label="Weight"
          type="number"
          name="weight"
          value={product.weight}
          onChange={handleInputChange}
          isRequired
          error={formErrors.weight}
        />

        <FormControl isRequired>
          <FormLabel>Category</FormLabel>
          <Select
            name="category"
            value={product.category}
            onChange={handleInputChange}
          >
            <option value="">Select Category</option>
            {Array.isArray(categories) &&
              categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
          </Select>
        </FormControl>

        <FormControl isRequired>
          <FormLabel>SubCategory</FormLabel>
          <Select
            name="subCategory"
            value={product.subCategory}
            onChange={handleInputChange}
          >
            <option value="">Select SubCategory</option>
            {Array.isArray(categories) &&
              categories
                .find((category) => category.id === product.category)
                ?.subCategories.map((subCategory) => (
                  <option key={subCategory.id} value={subCategory.id}>
                    {subCategory.name}
                  </option>
                ))}
          </Select>
        </FormControl>

        <Checkbox
          name="bestSeller"
          isChecked={product.bestSeller}
          onChange={handleInputChange}
        >
          Best Seller
        </Checkbox>
        <Checkbox
          isChecked={hasVariants}
          onChange={() => setHasVariants(!hasVariants)}
        >
          Has Variants
        </Checkbox>

        {hasVariants && (
          <ProductVarian
            product={product}
            setProduct={setProduct}
            categories={categories}
          />
        )}

        <ImageUpload
          uploadedImages={uploadedImages}
          imageErrors={imageErrors}
          handleImageChange={handleImageChange}
        />

        {imageErrors.map(
          (error, index) =>
            error && (
              <Text key={index} color="red.500">
                {error}
              </Text>
            )
        )}

        <Button type="submit" colorScheme="green" leftIcon={<FaUpload />}>
          Submit
        </Button>
      </VStack>
    </Box>
  );
};

ProductForm.propTypes = {
  categories: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      subCategories: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.string.isRequired,
          name: PropTypes.string.isRequired,
        })
      ),
    })
  ).isRequired,
  onSubmit: PropTypes.func.isRequired,
};

export default ProductForm;
