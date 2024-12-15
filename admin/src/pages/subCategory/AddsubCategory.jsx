import React, { useEffect, useState } from "react";
import axios from "axios";
import { backendURI } from "../../App";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { useFormFields } from "../useFormFields.jsx";

const AddSubCategoryForm = () => {
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();
  const { renderField, renderImageField, renderStatusField } = useFormFields();

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(backendURI + "/api/category/list");
        console.log("Fetched categories:", response.data.categories); // Log data categories
        setCategories(response.data.categories);
      } catch (error) {
        console.error("Error fetching categories:", error);
        toast.error("Gagal mengambil data Category");
      }
    };

    fetchCategories();
  }, []);

  // Initial Values for Formik
  const initialValues = {
    name: "",
    categoryId: "",
    description: "",
    status: "active",
    image: null,
  };

  // Validation Schema
  const validationSchema = Yup.object({
    name: Yup.string()
      .required("Nama SubCategory diperlukan")
      .min(3, "Nama terlalu pendek"),
    categoryId: Yup.string().required("Kategori diperlukan"),
    description: Yup.string().nullable(),
    status: Yup.string().required("Status diperlukan"),
    image: Yup.mixed()
      .nullable()
      .test(
        "fileSize",
        "Ukuran gambar terlalu besar (max: 2MB)",
        (value) => !value || (value && value.size <= 2 * 1024 * 1024)
      )
      .test(
        "fileType",
        "Format file tidak didukung (hanya JPG/PNG)",
        (value) =>
          !value || (value && ["image/jpeg", "image/png"].includes(value.type))
      ),
  });

  // Submit handler
  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    const formData = new FormData();
    formData.append("name", values.name);
    formData.append("category", values.categoryId);
    formData.append("status", values.status);
    formData.append("description", values.description);

    if (values.image) {
      formData.append("image", values.image);
    }

    console.log("Submitting data:", Object.fromEntries(formData.entries())); // Log data yang dikirim

    try {
      const response = await axios.post(
        `${backendURI}/api/subcategory/add`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success) {
        toast.success("SubCategory berhasil ditambahkan!");
        navigate("/subcategory/list");
        resetForm();
      } else {
        toast.error(response.data.message || "Gagal menambahkan SubCategory");
      }
    } catch (error) {
      console.error("Error adding subcategory:", error);
      toast.error("Terjadi kesalahan saat menambahkan SubCategory");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
    >
      {({ setFieldValue, isSubmitting }) => (
        <Form className="p-4 max-w-xl mx-auto bg-white shadow rounded">
          {renderField(
            "Deskripsi",
            "description",
            "textarea",
            null,
            "Masukkan deskripsi"
          )}

          {renderField("Category", "categoryId", "select", [
            { label: "Pilih Category", value: "" }, // Placeholder
            ...categories.map((category) => ({
              label: category.name || "Unassigned",
              value: category._id, // Pastikan value adalah ID kategori
            })),
          ])}

          <div className="mb-4">
            {renderStatusField("Status", "status", [
              { label: "Active", value: "active" },
              { label: "Inactive", value: "inactive" },
            ])}
          </div>

          {renderImageField("Gambar SubCategory", "image", setFieldValue)}

          <button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Mengirim..." : "Tambah SubCategory"}
          </button>
        </Form>
      )}
    </Formik>
  );
};

export default AddSubCategoryForm;
