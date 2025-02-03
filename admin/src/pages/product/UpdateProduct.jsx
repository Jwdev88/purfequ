import React, { useState, useEffect } from "react";
import axios from "axios";
import { backendURI } from "../../App";
import { assets } from "../../assets/assets";
import { toast } from "react-toastify";
import { useParams, useNavigate } from "react-router-dom";

const UpdateProduct = ({ token }) => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const [productData, setProductData] = useState({
    name: "",
    description: "",
    sku: "",
    price: 0,
    stock: 0,
    weight: 0,
    category: "",
    subCategory: "",
    bestSeller: false,
    variants: [],
    images: [], // Array untuk gambar baru dan yang sudah ada
  });

  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);

  useEffect(() => {
    const fetchProductAndCategories = async () => {
      setIsLoading(true);
      try {
        const [productRes, categoriesRes] = await Promise.all([
          axios.get(`${backendURI}/api/product/${productId}/get`, {
            headers: { token },
          }),
          axios.get(`${backendURI}/api/category/list`, { headers: { token } }),
        ]);

        if (productRes.data.success) {
          const product = productRes.data.product;
          setProductData({
            ...product,
            category: product.category?._id || "",
            subCategory: product.subCategory?._id || "",
            images: product.images.map((image) => ({ url: image, file: null })), // Inisialisasi gambar yang sudah ada
          });
        }

        if (categoriesRes.data.success) {
          setCategories(categoriesRes.data.categories);
        }
      } catch (error) {
        toast.error("Gagal mengambil produk atau kategori.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProductAndCategories();
  }, [productId, token]);

  useEffect(() => {
    const fetchSubCategories = async () => {
      if (!productData.category) return;

      try {
        const res = await axios.get(
          `${backendURI}/api/subcategory/list?category=${productData.category}`,
          { headers: { token } }
        );
        if (res.data.success) {
          setSubCategories(res.data.subCategories);
        } else {
          throw new Error("Gagal mengambil subkategori");
        }
      } catch (error) {
        console.error(error);
        toast.error(error.message);
      }
    };

    fetchSubCategories();
  }, [productData.category, token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    if(productData.variants && productData.variants.length > 0) {
      let hasEmptySku = false
      productData.variants.forEach((variant) => {
        variant.options.forEach((option) => {
          if (!option.sku || option.sku.trim() === "") {
              hasEmptySku = true
              return
          }
        });
      });
      if (hasEmptySku) {
          toast.error("SKU pada varian tidak boleh kosong")
          return
      }

  }
    try {
      const formData = new FormData();

      // Data produk umum
      ["name", "description", "category", "subCategory", "bestSeller"].forEach(
        (key) => {
          formData.append(key, productData[key]);
        }
      );

      // Gambar
      productData.images.forEach((image, index) => {
        if (image.file) {
          formData.append(`image${index + 1}`, image.file);
        } else if (image.url) {
          formData.append(`existingImage${index + 1}`, image.url);
        }
      });

      if (productData.variants.length > 0) {
        formData.append("variants", JSON.stringify(productData.variants));
      } else {
        // Kirim data non-varian dan flag "removeVariants"
        formData.append("removeVariants", true);
        ["price", "stock", "sku", "weight"].forEach((key) => {
          const value = parseInt(productData[key], 10);
          formData.append(key, isNaN(value) ? 0 : value);
        });
      }

      console.log(
        "Data yang akan dikirim:",
        formData.get("variants"),
        formData.get("removeVariants")
      ); // Debugging

      const response = await axios.put(
        `${backendURI}/api/product/edit/${productId}`,
        formData,
        { headers: { token } }
      );

      if (response.data.success) {
        toast.success("Produk berhasil diperbarui.");
        navigate("/product/list");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Gagal Memperbarui Produk");
      console.error("Error details:", error); // Menampilkan detail error di konsol
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    let newValue = type === "checkbox" ? checked : value;

    if (type === "number") {
      newValue = parseInt(newValue, 10);
      newValue = isNaN(newValue) ? 0 : newValue; // Handle NaN
    }

    setProductData({ ...productData, [name]: newValue });
  };

  const handleImageChange = (index, e) => {
    const file = e.target.files[0];
    setProductData((prevData) => {
      const updatedImages = [...prevData.images];
      updatedImages[index] = { url: URL.createObjectURL(file), file: file };
      return { ...prevData, images: updatedImages };
    });
  };

  const removeImage = (index) => {
    setProductData((prevData) => {
      const updatedImages = [...prevData.images];
      updatedImages.splice(index, 1);
      return { ...prevData, images: updatedImages };
    });
  };

  const addImage = () => {
    setProductData((prevData) => ({
      ...prevData,
      images: [...prevData.images, { url: null, file: null }], // Tambahkan objek gambar kosong
    }));
  };

  const addVariant = () => {
    setProductData({
      ...productData,
      variants: [...productData.variants, { name: "", options: [] }],
    });
  };
  // Hapus varian dan tambahkan field non-varian

  const removeVariant = (index) => {
    setProductData({
      ...productData,
      variants: productData.variants.filter((_, i) => i !== index),
    });
  };

  const addVariantOption = (variantIndex) => {
    setProductData((prevData) => {
      const updatedVariants = [...prevData.variants];
      updatedVariants[variantIndex].options.push({
        name: "",
        price: 0,
        stock: 0,
        weight: 0,
        sku: "",
      });
      return { ...prevData, variants: updatedVariants };
    });
  };

  const removeVariantOption = (variantIndex, optionIndex) => {
    setProductData((prevData) => {
      const updatedVariants = [...prevData.variants];
      updatedVariants[variantIndex].options = updatedVariants[
        variantIndex
      ].options.filter((_, i) => i !== optionIndex);
      return { ...prevData, variants: updatedVariants };
    });
  };

  const handleVariantChange = (index, field, value) => {
    setProductData((prevData) => {
      const updatedVariants = [...prevData.variants];
      updatedVariants[index][field] = value;
      return { ...prevData, variants: updatedVariants };
    });
  };

  const handleOptionChange = (variantIndex, optionIndex, field, value) => {
    let newValue = value;
  
    if (field === "sku") {
      newValue = value.trim(); // Hilangkan spasi di awal dan akhir
  
      if (!newValue) {
        // Tampilkan pesan error ke pengguna dan jangan perbarui state
        toast.error("SKU tidak boleh kosong.");
        return; // Keluar dari fungsi
      }
    } else if (typeof value === 'string' && (field === 'price' || field === 'stock' || field === 'weight')){
          newValue = parseInt(value, 10)
          newValue = isNaN(newValue) ? 0 : newValue
    }
  
  
    setProductData((prevData) => {
      const updatedVariants = [...prevData.variants];
      updatedVariants[variantIndex].options[optionIndex][field] = newValue;
      return { ...prevData, variants: updatedVariants };
    });
  };

  const renderVariantOption = (variantIndex, optionIndex) => (
    <div
      key={`${variantIndex}-${optionIndex}`}
      className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-2"
    >
      {["name", "price", "stock", "weight", "sku"].map((field) => (
        <div key={field}>
          <label
            htmlFor={`variants[${variantIndex}].options[${optionIndex}].${field}`}
            className="text-gray-600 text-sm"
          >
            {field === "weight"
              ? "Berat (gram)"
              : field.charAt(0).toUpperCase() + field.slice(1)}
          </label>
          <input
            type={
              field === "price" || field === "stock" || field === "weight"
                ? "number"
                : "text"
            }
            name={`variants[${variantIndex}].options[${optionIndex}].${field}`}
            className="mt-1 p-2 border rounded focus:border-blue-600 focus:ring-0 w-full border-gray-300"
            value={
              productData.variants[variantIndex].options[optionIndex][field]
            }
            onChange={(e) =>
              handleOptionChange(
                variantIndex,
                optionIndex,
                field,
                e.target.value
              )
            }
          />
        </div>
      ))}
      <button
        type="button"
        onClick={() => removeVariantOption(variantIndex, optionIndex)}
        className="bg-red-500 mt-1 md:mt-6 hover:bg-red-700 text-white text-center font-bold px-1 md:px-0 py-0 md:py-2 rounded text-xs md:text-sm w-full md:w-auto"
      >
        Hapus
      </button>
    </div>
  );

  return (
    <div className="bg-gray-50 p-4 md:p-6 mx-auto">
      <h1 className="text-center font-semibold text-3xl md:text-4xl mb-2 md:mb-6">
        Ubah Produk
      </h1>
      <form onSubmit={handleSubmit}>
        {/* Input Gambar */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Gambar Produk
          </label>
          <div className="flex flex-wrap">
            {productData.images.map((image, index) => (
              <div key={index} className="relative mr-4 mb-4">
                <img
                  src={image.url || assets.noImage} // Tampilkan gambar atau placeholder
                  alt={`Product Image ${index + 1}`}
                  className="w-24 h-24 object-cover rounded-md"
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageChange(index, e)}
                  className="hidden"
                  id={`imageInput-${index}`}
                />
                <label
                  htmlFor={`imageInput-${index}`}
                  className="absolute inset-0 cursor-pointer"
                ></label>{" "}
                {/* Label transparan untuk klik di atas gambar */}
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                >
                  x
                </button>
              </div>
            ))}
            {/* Tambahkan tombol untuk menambah gambar */}
            <button
              type="button"
              onClick={addImage}
              className="flex items-center justify-center w-24 h-24 border border-dashed rounded-md text-gray-500 hover:text-gray-700"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Input Produk Umum */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="name" className="text-sm font-medium text-gray-700">
              Nama Produk
            </label>
            <input
              type="text"
              name="name"
              id="name"
              className="mt-1 p-2 border rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 block w-full border-gray-400"
              onChange={handleInputChange}
              value={productData.name}
              required
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="description"
              className="text-sm font-medium text-gray-700"
            >
              Deskripsi
            </label>
            <textarea
              name="description"
              id="description"
              rows={3}
              value={productData.description}
              onChange={handleInputChange}
              className="mt-1 p-2 focus:ring-0 outline-0 w-full border border-gray-400 rounded-md"
              required
            ></textarea>
          </div>
        </div>

        {/* Pilihan Kategori dan Subkategori */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label
              htmlFor="category"
              className="block mb-1 text-sm font-medium text-gray-700"
            >
              Kategori
            </label>
            <select
              name="category"
              id="category"
              value={productData.category}
              onChange={handleInputChange}
              className="bg-gray-50 border mt-1 border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
              required
            >
              <option value="">Pilih kategori</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="subCategory"
              className="block mb-1 text-sm font-medium text-gray-700"
            >
              Subkategori
            </label>
            <select
              name="subCategory"
              id="subCategory"
              value={productData.subCategory}
              onChange={handleInputChange}
              className="bg-gray-50 border mt-1 border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
              required
            >
              <option value="">Pilih subkategori</option>
              {subCategories.map((sub) => (
                <option key={sub._id} value={sub._id}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {productData.variants.length === 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {["price", "stock", "sku", "weight"].map((field) => (
              <div key={field}>
                <label
                  htmlFor={field}
                  className="block text-sm font-medium text-gray-700"
                >
                  {field === "weight"
                    ? "Berat (gram)"
                    : field.charAt(0).toUpperCase() + field.slice(1)}
                </label>
                <input
                  className="mt-1 p-2 border rounded focus:border-blue-600 focus:ring-0 w-full border-gray-300"
                  type={
                    field === "price" || field === "weight" || field === "stock"
                      ? "number"
                      : "text"
                  }
                  name={field}
                  id={field}
                  value={productData[field]}
                  onChange={handleInputChange}
                  required
                />
              </div>
            ))}
          </div>
        )}

        {/* Bagian Varian */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2 md:mb-3">
            <h2 className="text-xl font-semibold">Varian Produk</h2>
            <button
              type="button"
              className="bg-blue-500 px-2 py-1 rounded-md text-sm md:text-base text-white hover:bg-blue-700"
              onClick={addVariant}
            >
              Tambah Varian
            </button>
          </div>

          {productData.variants.map((variant, variantIndex) => (
            <div
              key={variantIndex}
              className="border border-gray-400 rounded-lg p-4 mb-2"
            >
              <div className="flex items-center justify-between mb-2">
                <label className="font-medium">
                  Varian {variantIndex + 1}:
                </label>
                <button
                  type="button"
                  onClick={() => removeVariant(variantIndex)}
                  className="bg-red-600 rounded-sm text-white px-1 py-0 text-sm hover:bg-red-700"
                >
                  Hapus
                </button>
              </div>
              <input
                type="text"
                className="mt-1 p-2 border rounded focus:border-blue-600 focus:ring-0 w-full border-gray-300"
                name={`variants[${variantIndex}].name`}
                placeholder="Nama varian"
                value={variant.name}
                onChange={(e) =>
                  handleVariantChange(variantIndex, "name", e.target.value)
                }
              />

              <button
                className="mt-2 bg-teal-600 py-2 rounded-md text-white text-sm md:text-base hover:bg-teal-800 w-full"
                type="button"
                onClick={() => addVariantOption(variantIndex)}
              >
                Tambah Opsi
              </button>
              {variant.options.map((option, optionIndex) =>
                renderVariantOption(variantIndex, optionIndex)
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center mb-4">
          <input
            type="checkbox"
            className="w-4 h-4 mr-2"
            name="bestSeller"
            checked={productData.bestSeller}
            onChange={handleInputChange}
          />
          <label
            htmlFor="bestSeller"
            className="text-sm font-medium text-gray-700"
          >
            Produk Terlaris
          </label>
        </div>

        <button
          type="submit"
          className="w-full bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="flex justify-center items-center">
              <div className="animate-spin rounded-full border-t-2 border-white mr-2 w-4 h-4"></div>
              Memperbarui...
            </div>
          ) : (
            "Perbarui"
          )}
        </button>
      </form>
    </div>
  );
};

export default UpdateProduct;
