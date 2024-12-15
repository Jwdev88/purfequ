import React, { useState, useEffect } from "react";
import axios from "axios";
import { backendURI } from "../../App";
import { toast } from "react-toastify";
import { useParams, useNavigate } from "react-router-dom";
import { Formik, Field, Form, ErrorMessage } from "formik";
import { useFormFields } from "../useFormFields.jsx";

import * as Yup from "yup";

const UpdateSubCategory = ({ token }) => {
  const { subcategoryId } = useParams();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [initialImage, setInitialImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [image, setImage] = useState(null); // ✅ Ganti nama dari selectedImage menjadi image untuk lebih konsisten.

  const navigate = useNavigate();
  const { renderField, renderImageField, renderStatusField } = useFormFields();
  const [initialValues, setInitialValues] = useState({
    name: "",
    description: "",
    status: "active",
    category: "",
    image: null,
  });

  // ✅ Validasi untuk semua field termasuk gambar.
  const validationSchema = Yup.object().shape({
    name: Yup.string().required("Nama subkategori wajib diisi"),
    category: Yup.string().required("Kategori wajib diisi"),
    description: Yup.string().required("Deskripsi wajib diisi"),
    status: Yup.string().required("Status wajib diisi"),
    image: Yup.mixed()
      .test(
        "fileSize",
        "Ukuran gambar tidak boleh lebih dari 2 MB",
        (value) => !value || value.size <= 2 * 1024 * 1024
      )
      .nullable(),
  });

  const onSubmitHandler = async (values) => {
    try {
      setLoading(true); // ✅ Pindahkan `setLoading(true)` di awal untuk akurasi status loading.
      const formData = new FormData();
      formData.append("name", values.name);
      formData.append("description", values.description);
      formData.append("status", values.status);
      formData.append("category", values.category);
      // Pastikan gambar ditambahkan jika ada
      if (values.image) {
        formData.append("image", values.image);
      }

      for (let [key, value] of formData.entries()) {
        console.log(`${key}:`, value);
      }
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
          headers: { Authorization: `Bearer ${token}` }, // ✅ Ganti header agar lebih konsisten.
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

          // ✅ Perbaikan pengaturan nilai awal dan image preview.
          setInitialValues({
            name: subcategory.name || "",
            description: subcategory.description || "",
            status: subcategory.status || "active",
            category: subcategory.category?._id || "",
          });

          const imageURL = subcategory.imageData[0]?.secure_url || null;
          setInitialImage(imageURL);
          setImagePreview(imageURL); // ✅ Tampilkan gambar awal di preview.
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
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-4 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={onSubmitHandler}
      enableReinitialize={true} // ✅ Pastikan nilai form terupdate saat initialValues berubah.
    >
      {({ setFieldValue }) => (
        <Form className="p-4 flex flex-col md:w-2/3">
          {renderField("Nama subCatagory", "name")}
          {renderField("Description", "description", "textarea")}
          {renderImageField(
            "Upload Gambar",
            "image",
            setFieldValue,
            initialImage
          )}
          <div className="mb-4">
            <label className="block text-gray-700 font-bold mb-2">
              Catagory :
            </label>
            <Field
              as="select"
              name="category"
              className="w-full p-2 border rounded"
              disabled
            >
              <option disabled={true} value="">
                Pilih Kategori
              </option>
              {categories.map((category) => (
                <option disabled key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </Field>
            <ErrorMessage
              name="category"
              component="div"
              className="text-red-500 text-sm"
            />
          </div>

          {renderStatusField("Status", "status", [
            { value: "active", label: "Active" },
            { value: "inactive", label: "Inactive" },
          ])}

          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700 mt-10"
          >
            Update SubCategory
          </button>
        </Form>
      )}
    </Formik>
  );
};

export default UpdateSubCategory;
