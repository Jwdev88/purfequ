import React, { useState, useEffect } from "react";
import axios from "axios";
import { backendURI } from "../../App";
import { toast } from "react-toastify";
import { useParams, useNavigate } from "react-router-dom";
import { useFormik, Formik, ErrorMessage, Field, Form } from "formik";
import * as Yup from "yup";

const UpdateSubCategory = ({ token }) => {
  const { subcategoryId } = useParams();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [initialImage, setInitialImage] = useState(null); // Untuk menampilkan gambar yang sudah ada
  const [imagePreview, setImagePreview] = useState(null);
  const navigate = useNavigate();
  const [image, setImage] = useState(null);

  const [initialValues, setInitialValues] = useState({
    name: "",
    description:"" || null,
    status: "active",
    category: "",
  });
  const validationSchema = Yup.object().shape({
    name: Yup.string().required("Nama subkategori wajib diisi"),
    // description: Yup.string().nullable(),
    category: Yup.string().required("Kategori wajib diisi"),
    // image: Yup.mixed().nullable(),
  });

  const onSubmitHandler = async (values) => {
    try {
      const formData = new FormData();
      formData.append("name", values.name);
      formData.append("description", values.description);
      formData.append("status", values.status);
      formData.append("category", values.categoryId);
      formData.append("image", image);



      const response = await axios.put(
        `${backendURI}/api/subcategory/edit/${subcategoryId}`,
        formData,
        {
          headers: { token },
        }
      );

      if (response.data.success) {
        toast.success(response.data.message);
        navigate("/subCategory/list");
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error("Error updating subcategory:", error);
      toast.error("Gagal memperbarui subkategori");
    } finally {
      setLoading(false);
    }
  };

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
    const fetchCategories = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(backendURI + "/api/category/list", {
          headers: { token },
        });
        setCategories(response.data.categories);
        console.log(response.data.categories);
      } catch (error) {
        console.error("Error fetching categories:", error);
        toast.error("Gagal mengambil data Catagory");
      }
    };

    const fetchSubCategory = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(
          `${backendURI}/api/subCategory/${subcategoryId}/get`,
          {
            headers: { token },
          }
        );

        if (!response?.data.success) {
          const errorMessage =
            response?.data?.message || "Terjadi kesalahan saat membuat data.";
          setError(errorMessage);
          toast.error(errorMessage);
          console.log(errorMessage);
          return;
        }
        if (!response?.data?.subcategory) {
          toast.error("Data subkategori tidak ditemukan");
          setError("Data subkategori tidak ditemukan");
          return;
        }

        const subcategoryData = response.data.subcategory;
        setInitialValues({
          ...subcategoryData,
          category: subcategoryData.category._id,
          image: subcategoryData.imageData[0]?.secure_url || null,
          imagePreview: subcategoryData.imageData[0]?.secure_url || null,
          description: subcategoryData.description || "",
          status: subcategoryData.status || "active",
        });
        setInitialImage(subcategoryData.imageData[0]?.secure_url || null);

        console.log(setInitialValues);
      } catch (error) {
        const errorMessage =
          error.response?.data?.message ||
          "Terjadi kesalahan saat membuat data.";
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
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
      enableReinitialize={true}
    >
      {({ values, setFieldValue }) => (
        <Form className="p-4">
          <div className="mb-4">
            <label
              htmlFor="name"
              className="block text-gray-700 font-bold mb-2"
            >
              Nama SubCategory : 
            </label>
            <Field
              type="text"
              id="name"
              name="name"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
            <ErrorMessage
              name="name"
              component="div"
              className="text-red-500 text-sm"
            />
          </div>

          <div className="mb-4">
            <label
              htmlFor="description"
              className="block text-gray-700 font-bold mb-2"
            >
              Description : 
            </label>
            <Field
              as="textarea"
              id="description"
              name="description"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
            <ErrorMessage
              name="description"
              component="div"
              className="text-red-500 text-sm"
            />
          </div>

          {/* Input Gambar dengan Preview */}
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
            <label
              htmlFor="category"
              className="block text-gray-700 font-bold mb-2"
            >
              Category
            </label>
            <Field
              as="select"

              id="category"
              name="category"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            >
              <option value="">Pilih Category</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
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

          <div className="mb-4">
            <label
              htmlFor="status"
              className="block text-gray-700 font-bold mb-2"
            >
              Status:
            </label>
            <Field
              as="select"
              id="status"
              name="status"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Field>
          </div>

          <button
            type="submit"
       
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Update SubCategory
          </button>
        </Form>
      )}
    </Formik>
  );
};

export default UpdateSubCategory;
