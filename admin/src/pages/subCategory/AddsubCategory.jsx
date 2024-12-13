import React, { useState, useEffect } from "react";
import axios from "axios";
import { backendURI } from "../../App";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const AddSubCategoryForm = () => {
  const [name, setName] = useState("");
  const [image, setImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("active");
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(backendURI + "/api/category/list");
        setCategories(response.data.categories);
      } catch (error) {
        console.error("Error fetching categories:", error);
        toast.error("Gagal mengambil data Category");
      }
    };

    fetchCategories();
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImage(file);

    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewImage(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("name", name);
    formData.append("category", categoryId); // Pastikan categoryId terkirim
    formData.append("status", status);
    if (image) {
      formData.append("image", image);
    }
    if (description) {
      formData.append("description", description);
    }

    try {
      const response = await axios.post(
        backendURI + "/api/subcategory/add",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success) {
        toast.success("SubCategory berhasil ditambahkan!");
        navigate("/subcategory/list"); // Redirect ke halaman list subkategori
        setName("");
        setImage(null);
        setPreviewImage(null);
        setDescription("");
        setStatus("active");
        setCategoryId("");
      } else {
        toast.error(response.data.message || "Gagal menambahkan SubCategory");
      }
    } catch (error) {
      console.error("Error adding subcategory:", error);
      toast.error("Terjadi kesalahan saat menambahkan SubCategory");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4">
      {/* Input Gambar dengan Preview */}
      <div className="mb-4">
        <label htmlFor="image" className="block text-gray-700 font-bold mb-2">
          Gambar:
        </label>
        <input
          type="file"
          id="image"
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          onChange={handleImageChange}
        />
        {previewImage && (
          <img
            src={previewImage}
            alt="Preview"
            className="mt-2 max-w-xs h-auto"
          />
        )}
      </div>

      <div className="mb-4">
        <label htmlFor="name" className="block text-gray-700 font-bold mb-2">
          Nama SubCategory
        </label>
        <input
          type="text"
          id="name"
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className="mb-4">
        <label
          htmlFor="description"
          className="block text-gray-700 font-bold mb-2"
        >
          Description:
        </label>
        <textarea
          id="description"
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="mb-4">
        <label htmlFor="category" className="block text-gray-700 font-bold mb-2">
          SubCategory
        </label>
        <select
          id="category"
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          required
        >
          <option value="">Pilih Kategori</option>
          {categories.map((category) => (
            <option key={category._id} value={category._id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <label htmlFor="status" className="block text-gray-700 font-bold mb-2">
          Status:
        </label>
        <select
          id="status"
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <button
        type="submit"
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
      >
        Tambah SubCategory
      </button>
    </form>
  );
};

export default AddSubCategoryForm;