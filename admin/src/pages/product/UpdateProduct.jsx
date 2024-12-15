import React, { useState, useEffect } from "react";
import { Formik, Form, Field, ErrorMessage, FieldArray } from "formik";
import * as Yup from "yup";
import { assets } from "../../assets/assets";
import axios from "axios";
import { backendURI } from "../../App";
import { toast } from "react-toastify";
import { useParams, useNavigate } from "react-router-dom";

const UpdateProduct = ({ token }) => {
  const { productId } = useParams();
  const navigate = useNavigate();

  // State Management
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [initialValues, setInitialValues] = useState({
    image1: null,
    image2: null,
    image3: null,
    image4: null,
    name: "",
    description: "",
    sku: "",
    price: 0,
    stock: 0,
    weight: 0,
    category: "",
    subCategory: "",
    bestSeller: false,
    variants: [], // Variants structure: [{ name: '', options: [{ name: '', stock: 0, price: 0, weight: 0, sku: '' }] }]
  });

  // Fetch Product Details
  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        const response = await axios.get(
          `${backendURI}/api/product/${productId}/get`,
          {
            headers: { token },
          }
        );

        if (response.data.success) {
          const productData = response.data.product;
          setInitialValues({
            ...productData,
            category: productData.category?._id || "",
            subCategory: productData.subCategory?._id || "",
          });
        } else {
          toast.error("Failed to fetch product details.");
        }
      } catch (error) {
        toast.error("An error occurred while fetching product details.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProductDetails();
  }, [productId, token]);

  // Fetch Categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${backendURI}/api/category/list`, {
          headers: { token },
        });
        setCategories(response.data.categories || []);
      } catch (error) {
        toast.error("Failed to fetch categories.");
      }
    };

    fetchCategories();
  }, [token]);

  // Fetch Subcategories
  useEffect(() => {
    const fetchSubCategories = async () => {
      if (!initialValues.category) {
        setSubCategories([]);
        return;
      }

      try {
        const response = await axios.get(
          `${backendURI}/api/subcategory/list?category=${initialValues.category}`,
          { headers: { token } }
        );
        setSubCategories(response.data.subCategories || []);
      } catch (error) {
        toast.error("Failed to fetch subcategories.");
      }
    };

    fetchSubCategories();
  }, [initialValues.category, token]);

  // Validation Schema
  const validationSchema = Yup.object().shape({
    name: Yup.string().required("Product name is required."),
    description: Yup.string().required("Product description is required."),
    category: Yup.string().required("Category is required."),
    subCategory: Yup.string().required("Subcategory is required."),
    sku: Yup.string().required("SKU is required."),
    price: Yup.number()
      .required("Price is required.")
      .min(0, "Price must be greater than 0."),
    stock: Yup.number()
      .required("Stock is required.")
      .integer()
      .min(0, "Stock must be at least 0."),
    weight: Yup.number()
      .required("Weight is required.")
      .min(0, "Weight must be greater than 0."),
  });
  // Form Submission Handler
  const onSubmitHandler = async (values) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      let totalStock = 0;

      // Log for debugging
      console.log("Data values before FormData:", values);

      // Handle variants data
      if (
        values.variants &&
        Array.isArray(values.variants) &&
        values.variants.length > 0
      ) {
        // Convert variants array to string to preserve structure
        formData.append(
          "variants",
          JSON.stringify(
            values.variants.map((variant) => ({
              name: variant.name,
              options: variant.options.map((option) => ({
                name: option.name,
                stock: Number(option.stock),
                price: Number(option.price),
                sku: option.sku,
                weight: Number(option.weight),
              })),
            }))
          )
        );

        // Calculate total stock from variants
        totalStock = values.variants.reduce((total, variant) => {
          return (
            total +
            variant.options.reduce((variantTotal, option) => {
              return variantTotal + (Number(option.stock) || 0);
            }, 0)
          );
        }, 0);
      } else {
        // If no variants, create a default variant structure
        const defaultVariant = [
          {
            name: "Default",
            options: [
              {
                name: "Standard",
                stock: values.stock,
                price: values.price,
                sku: values.sku,
                weight: values.weight,
              },
            ],
          },
        ];
        formData.append("variants", JSON.stringify(defaultVariant));
        totalStock = values.stock;
      }

      // Handle other non-variant fields
      formData.append("stock", totalStock);
      formData.append("name", values.name);
      formData.append("description", values.description);
      formData.append("price", values.price);
      formData.append("weight", values.weight);
      formData.append("category", values.category);
      formData.append("subCategory", values.subCategory);
      formData.append("bestSeller", values.bestSeller);
      formData.append("sku", values.sku);

      // Handle images
      for (const key in values) {
        if (key.startsWith("image") && values[key]) {
          formData.append(key, values[key]);
        }
      }
      const response = await axios.put(
        `${backendURI}/api/product/edit/${productId}`,
        formData,
        {
          headers: { token },
        }
      );

      if (response.data.success) {
        toast.success("Product updated successfully!");
        navigate("/product/list");
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error("An error occurred while updating the product.");
    }
    setIsLoading(false);
  };
  const renderField = (
    label,
    name,
    type = "text",
    as = null,
    placeholder = ""
  ) => (
    <div className="w-full">
      <label htmlFor={name} className="block mb-2 font-semibold">
        {label}
      </label>
      <Field
        name={name}
        type={type}
        as={as}
        placeholder={placeholder}
        className="w-full max-w-[600px] px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <ErrorMessage
        name={name}
        component="div"
        className="text-red-500 text-sm mt-1"
      />
    </div>
  );
  const renderVariantField = (
    label,
    name,
    type = "text",
    as = null,
    placeholder = "",
    disabled
  ) => (
    <div className="w-full">
      <label htmlFor={name} className="block mb-2 font-semibold">
        {label}
      </label>
      <Field
        name={name}
        type={type}
        as={as}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full max-w-[600px] px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <ErrorMessage
        name={name}
        component="div"
        className="text-red-500 text-sm mt-1"
      />
    </div>
  );

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={onSubmitHandler}
      enableReinitialize={true}
    >
      {({ values, setFieldValue }) => (
        <Form className="flex flex-col w-full items-start gap-6">
          {/* Upload Images */}
          <div>
            <p className="mb-2 text-lg font-semibold">Upload Images</p>
            <div className="flex gap-4">
              {["image1", "image2", "image3", "image4"].map((imageKey) => (
                <label
                  htmlFor={imageKey}
                  key={imageKey}
                  className="cursor-pointer"
                >
                  <img
                    className="w-24 h-24 object-cover border-2 border-dashed border-gray-300 rounded-md"
                    src={
                      !values[imageKey]
                        ? assets.upload_area
                        : URL.createObjectURL(values[imageKey])
                    }
                    alt={`Placeholder for ${imageKey} upload area`}
                  />
                  <input
                    onChange={(e) => setFieldValue(imageKey, e.target.files[0])}
                    type="file"
                    id={imageKey}
                    hidden
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Product Name */}
          {renderField(
            "Product Name",
            "name",
            "text",
            "",
            "Enter product name"
          )}

          {/* Product Description */}
          {renderField(
            "Product Description",
            "description",
            "textarea h-100",
            "",
            "Enter product description"
          )}

          {isLoading ? (
            <div>Loading categories and subcategories...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-auto">
              {/* Category select */}
              <div className="mb-6">
                <label
                  htmlFor="category"
                  className="block text-gray-700 text-sm font-semibold mb-2"
                >
                  Product Category
                </label>
                <Field
                  as="select"
                  name="category"
                  id="category"
                  onChange={(e) => {
                    setFieldValue("category", e.target.value); // Update Formik's 'category'
                    setFieldValue("subCategory", ""); // Reset subcategory on category change
                    
                  }}
                  className="shadow appearance-none border rounded-md py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 w-60"
                >
                  <option value="">Select a Category</option> Added a default
                  option
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name.toUpperCase()}{" "}
                      {/* Access the name property */}
                    </option>
                  ))}
                </Field>
                <ErrorMessage
                  name="category"
                  component="div"
                  className="text-red-500"
                />
              </div>

              {/* Subcategory select */}
              <div className="mb-6">
                <label
                  htmlFor="subCategory"
                  className="block text-gray-700 text-sm font-semibold mb-2"
                >
                  Product Subcategory
                </label>
                <Field
                  as="select"
                  name="subCategory"
                  id="subCategory"
                  className="shadow appearance-none border rounded-md w-60 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a subcategory</option>
                  {subCategories.map((subCategory) => (
                    <option key={subCategory._id} value={subCategory._id}>
                      {subCategory.name.toUpperCase()}
                    </option>
                  ))}
                </Field>
                <ErrorMessage
                  name="subCategory"
                  component="div"
                  className="text-red-500"
                />
              </div>
            </div>
          )}

          {/* Product Details : Price, Sku, Stock, Weight */}
          {values.variants.length === 0 && (
            <div className="w-full">
              {renderField("Product Price", "price,", "number")}
              {renderField("Product Sku", "sku,", "text")}
              {renderField("Product Stock", "stock,", "number")}
              {renderField("Product Weight", "weight,", "number")}
            </div>
          )}

          {/* Product Variants */}
          <div className="w-full">
            <FieldArray name="variants">
              {({ push, remove }) => (
                <div>
                  <h3 className="mb-4 text-lg font-semibold">
                    Product Variants
                  </h3>
                  {values.variants.map((variant, index) => (
                    <div key={index} className="border p-4 mb-4 rounded-md">
                      {renderVariantField(
                        "Variant Name",
                        `variants[${index}].name`
                      )}

                      <FieldArray name={`variants[${index}].options`}>
                        {({ push: pushOption, remove: removeOption }) => (
                          <div className="mt-4">
                            {variant.options.map((option, optionIndex) => (
                              <div
                                key={optionIndex}
                                className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-4"
                              >
                                {renderVariantField(
                                  "Option Name",
                                  `variants[${index}].options[${optionIndex}].name`
                                )}
                                {renderVariantField(
                                  "Stock",
                                  `variants[${index}].options[${optionIndex}].stock`,
                                  "number"
                                )}
                                {renderVariantField(
                                  "Price",
                                  `variants[${index}].options[${optionIndex}].price`,
                                  "number"
                                )}
                                {renderVariantField(
                                  "Weight",
                                  `variants[${index}].options[${optionIndex}].weight`,
                                  "number"
                                )}
                                {renderVariantField(
                                  "SKU",
                                  `variants[${index}].options[${optionIndex}].sku`,
                                  "text",
                                  "input",
                                  "Enter SKU",
                                   optionIndex ===0
                                )}
                                <button
                                  type="button"
                                  onClick={() => removeOption(optionIndex)}
                                  className="col-span-1 text-white bg-red-500 rounded-md mt-6 px-4 py-2 hover:bg-red-600"
                                >
                                  Remove
                                </button>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() =>
                                pushOption({
                                  name: "",
                                  stock: 0,
                                  price: 0,
                                  weight: 0,
                                  sku: "",
                                })
                              }
                              className="text-white bg-green-500 px-4 py-2 rounded-md hover:bg-green-600"
                            >
                              Add Option
                            </button>
                          </div>
                        )}
                      </FieldArray>
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="text-white bg-red-500 px-4 py-2 rounded-md mt-4 hover:bg-red-600"
                      >
                        Remove Variant
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => push({ name: "", options: [] })}
                    className="text-white bg-blue-500 px-4 py-2 rounded-md hover:bg-blue-600"
                  >
                    Add Variant
                  </button>
                </div>
              )}
            </FieldArray>
          </div>

          {/* Bestseller Checkbox */}
          <div className="mb-4">
            <label className="inline-flex items-center">
              <Field
                type="checkbox"
                name="bestSeller"
                className="form-checkbox h-5 w-5 text-gray-600"
              />
              <span className="ml-2 text-gray-700">Add to bestseller</span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md"
            disabled={isLoading}
          >
            {isLoading ? "Updating..." : "Update Product"}
          </button>
        </Form>
      )}
    </Formik>
  );
};

export default UpdateProduct;
