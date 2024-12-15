import React, { useState, useEffect } from "react";
import axios from "axios";
import { backendURI } from "../../App";
import { toast } from "react-toastify";
import { useParams, useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";

const UpdateCategory = ({ token }) => {
  const { categoryId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [initialImage, setInitialImage] = useState(null); // Untuk menampilkan gambar yang sudah ada
  const [imagePreview, setImagePreview] = useState(null);
  const navigate = useNavigate();
  const [image, setImage] = useState(null);

  const initialValues = {
    name: "",
    description: "",
    status: "",
    image: null,
  };

  const validationSchema = Yup.object().shape({
    name: Yup.string().required("Nama Category wajib diisi"),
    description: Yup.string().required("Description Category wajib diisi"),
    status: Yup.string().required("Status Category wajib diisi"),
    image: Yup.mixed().test("fileSize", "Ukuran gambar tidak boleh lebih dari 2 MB", (value) => !value || value.size <= 2 * 1024 * 1024),
  });

  const formik = useFormik({
    initialValues,
    validationSchema,
    enableReinitialize: true,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const formData = new FormData();
        formData.append("name", values.name);
        formData.append("description", values.description);
        formData.append("status", values.status);
        if (values.image) {
          formData.append("image", values.image);
        }

        const response = await axios.put(
          `${backendURI}/api/category/edit/${categoryId}`,
          formData,
          { headers: { token } }
        );

        if (response.data.success) {
          toast.success("Category berhasil diupdate!");
          // Redirect atau lakukan aksi lain setelah update berhasil
          navigate("/category/list");
        } else {
          toast.error(response.data.message || "Gagal mengupdate kategori");
        }
      } catch (error) {
        console.error("Error:", error);
        toast.error("Terjadi kesalahan");
      } finally {
        setSubmitting(false);
      }
    },
  });

  const handleImageChange = (e) => {
    const selectedImage = e.target.files[0];
    setImage(selectedImage);

    // Membuat preview gambar
    if (selectedImage) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(selectedImage);
    } else {
      setImagePreview(null); // Menghapus preview jika tidak ada gambar yang dipilih
    }
  };

  useEffect(() => {
    const fetchCategory = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(
          `${backendURI}/api/category/${categoryId}/get`,
          { headers: { token } }
        );

        if (!response?.data?.success) {
          const errorMessage =
            response?.data?.message || "Gagal mengambil data kategori";
          toast.error(errorMessage);
          setError(errorMessage);
          return;
        }

        if (!response?.data?.category) {
          toast.error("Data kategori tidak ditemukan");
          setError("Data kategori tidak ditemukan");
          return;
        }

        const categoryData = response.data.category;

        setInitialImage(categoryData.imageData[0].secure_urls);

        formik.setValues({
          name: categoryData.name || "",
          description: categoryData.description || "",
          status: categoryData.status || "active",
          image: null,
        });
      } catch (err) {
        const errorMessage =
          err.message || "Terjadi kesalahan saat memuat data.";
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    if (categoryId) {
      fetchCategory();
    } else {
      setLoading(false);
    }
  }, [categoryId, token]); 

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <form onSubmit={formik.handleSubmit} className="p-4">
      {/* Tampilkan gambar awal atau preview gambar yang dipilih */}
      {(initialImage || imagePreview) && (
        <div className="mb-4">
          <img
            src={imagePreview || initialImage}
            alt="Category Image"
            className="max-w-xs"
          />
        </div>
      )}

      <div className="mb-4">
        <label htmlFor="image" className="block mb-2">
          Upload Gambar
        </label>
        <input
          type="file"
          id="image"
          onChange={handleImageChange}
          className="w-full p-2 border border-gray-300 rounded"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="name" className="block mb-2">
          Nama Category
        </label>
        <input
          type="text"
          id="name"
          value={formik.values.name}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          className={`w-full p-2 border border-gray-300 rounded ${
            formik.touched.name && formik.errors.name ? "border-red-500" : ""
          }`}
        />
        {formik.touched.name && formik.errors.name && (
          <div className="text-red-500">{formik.errors.name}</div>
        )}
      </div>

      <div className="mb-4">
        <label htmlFor="description" className="block mb-2">
          Description Category
        </label>
        <textarea
          id="description"
          value={formik.values.description}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          className={`w-full p-2 border border-gray-300 rounded ${
            formik.touched.description && formik.errors.description
              ? "border-red-500"
              : ""
          }`}
        />
        {formik.touched.description && formik.errors.description && (
          <div className="text-red-500">{formik.errors.description}</div>
        )}
      </div>

      <div className="mb-4">
        <label htmlFor="status" className="block mb-2">
          Status Category
        </label>
        <select
          id="status"
          value={formik.values.status}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          className={`w-full p-2 border border-gray-300 rounded ${
            formik.touched.status && formik.errors.status
              ? "border-red-500"
              : ""
          }`}
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        {formik.touched.status && formik.errors.status && (
          <div className="text-red-500">{formik.errors.status}</div>
        )}
      </div>

      <button
        type="submit"
        disabled={formik.isSubmitting}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
      >
        Update Category
      </button>
    </form>
  );
};

export default UpdateCategory;

