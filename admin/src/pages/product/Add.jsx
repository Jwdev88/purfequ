import React, { useState, useEffect } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { assets } from "../../assets/assets";
import axios from "axios";
import { backendURI } from "../../App";
import { toast } from "react-toastify";

const Add = ({ token }) => {
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true)
  
  const initialValues = {
    image1: null,
    image2: null,
    image3: null,
    image4: null,
    name: "",
    description: "",
    sku: "",
    price: 0,
    stock: 0,
    category: "",
    subCategory: "",
    bestseller: false,
    variants: [""],
  };

  const validationSchema = Yup.object().shape({
    name: Yup.string().required("Nama wajib diisi"),
    description: Yup.string().required("Deskripsi wajib diisi"),
    category: Yup.string().required("Kategori wajib diisi"),
    subCategory: Yup.string().required("Subkategori wajib diisi"),

    // Conditional validation for stock and price (only if no variants)
    stock: Yup.number().when('variants', (variants, schema) => {
      return variants.length === 0
        ? schema.required("Stok wajib diisi").integer("Stok harus berupa bilangan bulat").min(0, "Stok tidak boleh negatif")
        : schema.nullable();
    }),

    price: Yup.number().when('variants', (variants, schema) => {
      return variants.length === 0
        ? schema.required("Harga wajib diisi").positive("Harga harus positif")
        : schema.nullable();
    }),

    variants: Yup.array().of(
      Yup.object().shape({
        name: Yup.string().required("Nama varian wajib diisi"),
        options: Yup.array().of(
          Yup.object().shape({
            name: Yup.string().required("Nama opsi wajib diisi"),
            stock: Yup.number().required("Stok wajib diisi").integer("Stok harus berupa bilangan bulat").min(0, "Stok tidak boleh negatif"),
            price: Yup.number().required("Harga wajib diisi").positive("Harga harus positif"),
            sku: Yup.string().required("SKU wajib diisi"),
            weight: Yup.number().required("Berat wajib diisi").positive("Berat harus positif"),
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
        setSubCategories(response.data.subCategories);
        console.log(response.data.categories);
        console.log(response.data.subCategories);
      } catch (error) {
        console.error("Error fetching categories:", error);
        toast.error("Gagal mengambil data kategori");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, [token]);
  const onSubmitHandler = async (values) => {
    try {
      const formData = new FormData();
      let totalStock = 0;
      if (values.variants.length > 0) {
        for (const variant of values.variants) {
          totalStock += variant.stock;
        }
      } else {
        totalStock = values.stock;
      }
      
      // Append total stock to formData
      formData.append("stock", totalStock);
      for (let key in values) {
        if (key.startsWith("image") && values[key]) {
          formData.append(key, values[key]);
        } else if (key === "variants") {
          // Periksa apakah values.variants adalah array dan tidak kosong
          if (Array.isArray(values.variants) && values.variants.length > 0) {  
            // Kirim setiap varian sebagai object terpisah
            values.variants.forEach((variant, index) => { 
              formData.append(`variants[${index}]`, JSON.stringify(variant));
          
            });
          }
        } else {
          formData.append(key, values[key]);
        }
      }

      const response = await axios.post(
        backendURI + "/api/product/add",
        formData,
        { headers: { token } }
      );

      if (response.data.success) {
        toast.success(response.data.message);
        // Reset form setelah berhasil
        // ...
        console.log(response.data);
      } else {
        toast.error(response.data.message);
        console.log(response.data);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message);
    }
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={onSubmitHandler}
    >
      {({ values, setFieldValue }) => (
        <Form className="flex flex-col w-full items-start gap-6">
          {/* Upload Images */}
          <div>
            <p className="mb-2 text-lg font-semibold">Upload Images</p>
            <div className="flex gap-4">
              {["image1", "image2", "image3", "image4"].map((imageKey) => (
                <label htmlFor={imageKey} key={imageKey} className="cursor-pointer">
                  <img
                    className="w-24 h-24 object-cover border-2 border-dashed border-gray-300 rounded-md"
                    src={!values[imageKey] ? assets.upload_area : URL.createObjectURL(values[imageKey])}
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
          <div className="w-full">
            <p className="mb-2 text-lg font-semibold">Product Name</p>
            <Field
              name="name"
              className="w-full max-w-[600px] px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Type Here"
              type="text"
            />
            <ErrorMessage name="name" component="div" className="text-red-500" />
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
            <ErrorMessage name="description" component="div" className="text-red-500" />
          </div>

          {/* Product sku */}
          {values.variants.length === 0 && (
            <div className="w-full">
              <p className="mb-2 text-lg font-semibold">Product sku</p>
              <Field
                name="sku"
                className="w-full max-w-[600px] px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Type Here"
                type="number"
              />
              <ErrorMessage name="sku" component="div" className="text-red-500" />
            </div>
          )}


          {/* Product Stock */}
          {/* Product Stock (Conditional) */}
          {values.variants.length === 0 && (
            <div className="w-full">
              <p className="mb-2 text-lg font-semibold">Product Stock</p>
              <Field
                name="stock"
                className="w-full max-w-[600px] px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Type Here"
                type="number"
              />
              <ErrorMessage name="stock" component="div" className="text-red-500" />
            </div>
          )}

          {/* Category, Subcategory, and Price */}

          {isLoading ? (
            <div>Loading categories and subcategories...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full">
              {/* Category select */}
              <div className="mb-6">
                <label htmlFor="category" className="block text-gray-700 text-sm font-semibold mb-2">
                  Product Category
                </label>
                <Field
                  as="select"
                  name="category"
                  id="category"
                  className="shadow appearance-none border rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name.toUpperCase()} {/* Access the name property */}
                    </option>
                  ))}
                </Field>
                <ErrorMessage name="category" component="div" className="text-red-500" />
              </div>

              {/* Subcategory select */}
              <div className="mb-6">
                <label htmlFor="subCategory" className="block text-gray-700 text-sm font-semibold mb-2">
                  Product Subcategory
                </label>
                <Field
                  as="select"
                  name="subCategory"
                  id="subCategory"
                  className="shadow appearance-none border rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {subCategories.map((subCategory) => (
                    <option key={subCategory._id} value={subCategory._id}>
                      {subCategory.name.toUpperCase()} {/* Access the name property */}
                    </option>
                  ))}
                </Field>
                <ErrorMessage name="subCategory" component="div" className="text-red-500" />
              </div>
              {values.variants.length === 0 && (
                <div className="mb-6">
                  <label htmlFor="price" className="block text-gray-700 text-sm font-semibold mb-2">
                    Product Price
                  </label>
                  <Field
                    name="price"
                    id="price"
                    className="shadow appearance-none border rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                    type="number"
                    placeholder="25"
                  />
                  <ErrorMessage name="price" component="div" className="text-red-500" />
                </div>
              )}
            </div>
          )}

          {/* Product Variants */}
          <div className="w-full">
            <p className="block text-gray-700 text-lg font-semibold mb-2">
              Product Variants
            </p>
            <div>
              {values.variants.map((variant, index) => (
                <div key={index} className="flex mb-3 border gap-3 p-4 rounded-md">
                  <div>
                    <Field
                      type="text"
                      placeholder="Name"
                      name={`variants[${index}].name`}
                      className="shadow appearance-none border rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <ErrorMessage name={`variants[${index}].name`} component="div" className="text-red-500" />
                  </div>

                  <div className="flex gap-4 mb-2">
                    <Field
                      type="number"
                      placeholder="Stock"
                      name={`variants[${index}].stock`}
                      className="shadow appearance-none border rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <ErrorMessage name={`variants[${index}].stock`} component="div" className="text-red-500" />

                    <Field
                      type="number"
                      placeholder="Price"
                      name={`variants[${index}].price`}
                      className="shadow appearance-none border rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <ErrorMessage name={`variants[${index}].price`} component="div" className="text-red-500" />

                    <Field
                      type="number"
                      placeholder="Berat (gram)"
                      name={`variants[${index}].berat`}
                      className="shadow appearance-none border rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <ErrorMessage name={`variants[${index}].berat`} component="div" className="text-red-500" />

                    <Field
                      type="text"
                      placeholder="sku"
                      name={`variants[${index}].sku`}
                      className="shadow appearance-none border rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <ErrorMessage name={`variants[${index}].sku`} component="div" className="text-red-500" />

                    <button
                      type="button"
                      onClick={() =>
                        setFieldValue(
                          "variants",
                          values.variants.filter((_, i) => i !== index)
                        )
                      }
                      className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-3 rounded-md items-center"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  setFieldValue("variants", [
                    ...values.variants,
                    { name: "", options: [{ name: "", stock: 0, price: 0, sku: "", weight: 0 }] }, // Updated structure
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
              <Field type="checkbox" name="bestseller" className="form-checkbox" />
              <span className="ml-2 text-gray-700">Add to bestseller</span>
            </label>
          </div>

          {/* Submit Button */}
          <button type="submit" className="bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800">
            ADD
          </button>
        </Form>
      )}
    </Formik>
  );
};

export default Add;