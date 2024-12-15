import React, { useState, useEffect } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { UploadIcon } from "lucide-react";
import axios from "axios";
import { backendURI } from "../../App";

import { toast } from "react-toastify";

const Add = ({ token }) => {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const initialValues = {
    image1: null,
    image2: null,
    image3: null,
    image4: null,
    name: "",
    description: "",
    sku: 0,
    price: 0,
    stock: 0,
    weight: 0,
    category: "",
    subCategory: "",
    bestseller: false,
    variants: [],
  };
  const validationSchema = Yup.object().shape({
    name: Yup.string().required("Nama wajib diisi"),
    description: Yup.string().required("Deskripsi wajib diisi"),
    category: Yup.string().required("Kategori wajib diisi"),
    subCategory: Yup.string().required("Subkategori wajib diisi"),
    stock: Yup.number().when("variants", (variants, schema) => {
      return variants && variants.length > 0
        ? schema.nullable()
        : schema
            .required("Stok wajib diisi")
            .integer("Stok harus berupa bilangan bulat")
            .min(0, "Stok tidak boleh kosong");
    }),
    price: Yup.number().when("variants", (variants, schema) => {
      return variants && variants.length > 0
        ? schema.nullable()
        : schema.required("Harga wajib diisi").positive("Harga harus positif");
    }),
    weight: Yup.number().when("variants", (variants, schema) => {
      return variants && variants.length > 0
        ? schema.nullable()
        : schema.required("Berat wajib diisi").min(0, "Berat minimal 100 gram");
    }),
    variants: Yup.array().of(
      Yup.object().shape({
        name: Yup.string().required("Nama varian wajib diisi"),
        options: Yup.array().of(
          Yup.object().shape({
            name: Yup.string().required("Nama opsi wajib diisi"),
            stock: Yup.number()
              .required("Stok wajib diisi")
              .integer("Stok harus berupa bilangan bulat"),
            price: Yup.number()
              .required("Harga wajib diisi")
              .positive("Harga harus positif"),
            sku: Yup.string().required("SKU wajib diisi"),
            weight: Yup.number()
              .required("Berat wajib diisi")
              .min(0, "Berat minimal 100 gram"),
          })
        ),
      })
    ),
  });

    useEffect(() => {
    const fetchCategories = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(backendURI + "/api/category/list", {
          headers: { token },
        });
        setCategories(response.data.categories);
      } catch (error) {
        console.error("Error fetching categories:", error);
        toast.error("Gagal mengambil data Category");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, [token]);

  useEffect(() => {
    const fetchSubCategories = async () => {
      if (selectedCategory) {
        try {
          const response = await axios.get(
            `${backendURI}/api/subcategory/list?category=${selectedCategory}`,
            { headers: { token } }
          );
          setSubCategories(response.data.subCategories);
        } catch (error) {
          console.error("Error fetching subcategories:", error);
          toast.error("Gagal mengambil data subCategory");
        }
      } else {
        // Clear subCategories when no category is selected
        setSubCategories([]);
      }
    };

    fetchSubCategories();
  }, [selectedCategory, token]);




  const onSubmitHandler = async (values) => {
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

      console.log("Data values after FormData:", values);

      const response = await axios.post(
        backendURI + "/api/product/add",
        formData,
        { headers: { token } }
      );

      if (response.data.success) {
        toast.success(response.data.message);
        console.log(response.data);
        // navigate("/products");
      } else {
        toast.error(response.data.message);
        console.log(response.data);
      }
    } catch (error) {
      console.error("Error submitting product:", error);
      toast.error(error.response?.data?.message || error.message);
    }
  };
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
                      !values[imageKey] ? (
                        <UploadIcon className="w-24 h-24 object-cover border-2 border-dashed border-gray-300 rounded-md" />
                      ) : (
                        URL.createObjectURL(values[imageKey])
                      )
                    }
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
          <div className="w-full">
            <p className="mb-2 text-lg font-semibold">Product Name</p>
            <Field
              name="name"
              className="w-full max-w-[600px] px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Type Here"
              type="text"
            />
            <ErrorMessage
              name="name"
              component="div"
              className="text-red-500"
            />
          </div>

          {/* Product Description */}
          <div className="w-full">
            <p className="mb-2 text-lg font-semibold">Product Description</p>
            <Field
              as="textarea"
              name="description"
              className="w-full max-w-[600px] px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Type content here"
            />
            <ErrorMessage
              name="description"
              component="div"
              className="text-red-500"
            />
          </div>

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
                  setSelectedCategory(e.target.value); // Update 'selectedCategory' state
                  setFieldValue("subCategory", ""); // Reset subcategory jika kategori berubah
                }}
                disabled={isLoading}
                className="shadow appearance-none border rounded-md py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 w-60"
              >
                <option value="">Select a Category</option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </Field>
              <ErrorMessage
                name="category"
                component={"label"}
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
                disabled={selectedCategory === ""}
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

          {/* Conditional fields */}
          {values.variants.length === 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-auto">
              {/* Product SKU */}
              <div className="w-full">
                <p className="mb-2 text-lg font-semibold">Product SKU</p>
                <Field
                  name="sku"
                  className="w-full max-w-[600px] px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Type Here"
                  type="text"
                />
                <ErrorMessage
                  name="sku"
                  component="div"
                  className="text-red-500"
                />
              </div>

              {/* Product Stock */}
              <div className="w-full">
                <p className="mb-2 text-lg font-semibold">Product Stock</p>
                <Field
                  name="stock"
                  className="w-full max-w-[600px] px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Type Here"
                  type="number"
                />
                <ErrorMessage
                  name="stock"
                  component="div"
                  className="text-red-500"
                />
              </div>

              {/* Product Price */}
              <div className="w-full">
                <p className="mb-2 text-lg font-semibold">Product Price</p>
                <Field
                  name="price"
                  className="w-full max-w-[600px] px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Type Here"
                  type="number"
                />
                <ErrorMessage
                  name="price"
                  component="div"
                  className="text-red-500"
                />
              </div>

              {/* Product Weight */}
              <div className="w-full">
                <p className="mb-2 text-lg font-semibold">Product Weight</p>
                <Field
                  name="weight"
                  className="w-full max-w-[600px] px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Type Here"
                  type="number"
                />
                <ErrorMessage
                  name="weight"
                  component="div"
                  className="text-red-500"
                />
              </div>
            </div>
          )}

          {/* Category, Subcategory */}

          {/* Product Variants */}
          <div className="w-auto">
            {values.variants.length > 0 && (
              <p className="block text-gray-700 text-lg font-semibold mb-2">
                Product Variants
              </p>
            )}
            <div>
              {values.variants.map((variant, index) => (
                <div
                  key={index}
                  className="flex flex-col mb-3 border gap-3 p-4 rounded-md"
                >
                  <div>
                    <label
                      htmlFor={`variants[${index}].name`}
                      className="block text-gray-700 text-sm font-bold mb-2"
                    >
                      Variant Name:
                    </label>
                    <Field
                      type="text"
                      placeholder="e.g., Color, Size"
                      name={`variants[${index}].name`}
                      className="shadow appearance-none border rounded-md w-70 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <ErrorMessage
                      name={`variants[${index}].name`}
                      component="div"
                      className="text-red-500"
                    />
                  </div>
                  <div>
                    {variant.options.map((option, optionIndex) => (
                      <div
                        key={optionIndex}
                        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-[10rem,1.5fr,2.0fr,1.5fr,1.25fr,1fr] gap-4 mb-2 w-full"
                      >
                        {/* Responsive grid for options */}

                        <Field
                          type="text"
                          placeholder="Option Name (e.g., Red, Large)"
                          name={`variants[${index}].options[${optionIndex}].name`}
                          className="shadow appearance-none border rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <ErrorMessage
                          name={`variants[${index}].options[${optionIndex}].name`}
                          component="div"
                          className="text-red-500"
                        />

                        <Field
                          type="number"
                          placeholder="Stock"
                          name={`variants[${index}].options[${optionIndex}].stock`}
                          className="shadow appearance-none border rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />

                        <Field
                          type="number"
                          placeholder="Price"
                          name={`variants[${index}].options[${optionIndex}].price`}
                          className="shadow appearance-none border rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <ErrorMessage
                          name={`variants[${index}].options[${optionIndex}].price`}
                          component="div"
                          className="text-red-500"
                        />

                        <Field
                          type="number"
                          placeholder="Weight (gram)"
                          name={`variants[${index}].options[${optionIndex}].weight`}
                          className="shadow appearance-none border rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <ErrorMessage
                          name={`variants[${index}].options[${optionIndex}].weight`}
                          component="div"
                          className="text-red-500"
                        />

                        <Field
                          type="text"
                          placeholder="SKU"
                          name={`variants[${index}].options[${optionIndex}].sku`}
                          className="shadow appearance-none border rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <ErrorMessage
                          name={`variants[${index}].options[${optionIndex}].sku`}
                          component="div"
                          className="text-red-500"
                        />

                        {/* Remove Option Button */}
                        <button
                          type="button"
                          onClick={() =>
                            setFieldValue(
                              `variants[${index}].options`,
                              variant.options.filter(
                                (_, i) => i !== optionIndex
                              )
                            )
                          }
                          className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-3 rounded-md items-center col-span-full sm:col-span-1 md:col-span-1 lg:col-span-1" // Adjust col-span for responsiveness
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    {/* Add Option Button */}
                    <button
                      type="button"
                      onClick={() =>
                        setFieldValue(`variants[${index}].options`, [
                          ...variant.options,
                          { name: "", stock: 0, price: 0, sku: "", weight: 0 },
                        ])
                      }
                      className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md"
                    >
                      Add Option
                    </button>
                  </div>

                  {/* Remove Variant Button */}
                  <button
                    type="button"
                    onClick={() =>
                      setFieldValue(
                        "variants",
                        values.variants.filter((_, i) => i !== index)
                      )
                    }
                    className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-3 rounded-md items-center max-w-60"
                  >
                    Remove Variant
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  setFieldValue("variants", [
                    ...values.variants,
                    {
                      name: "",
                      options: [
                        { name: "", stock: 0, price: 0, sku: "", weight: 0 },
                      ],
                    },
                  ])
                }
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md"
              >
                Add Variant
              </button>
            </div>
          </div>
          {/* Bestseller Checkbox */}
          <div className="mb-4">
            <label className="inline-flex items-center">
              <Field
                type="checkbox"
                name="bestseller"
                className="form-checkbox"
              />
              <span className="ml-2 text-gray-700">Add to bestseller</span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800"
          >
            ADD
          </button>
        </Form>
      )}
    </Formik>
  );
};

export default Add;
