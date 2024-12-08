import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { backendURI } from "../../App";
import { toast } from "react-toastify";
import { assets } from "../../assets/assets";
import { useNavigate } from 'react-router-dom';
const UpdateProduct = ({ token }) => {
  const navigate = useNavigate();
  const { productId } = useParams();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [bestseller, setBestseller] = useState(false);
  const [variants, setVariants] = useState([]);
  const [image1, setImage1] = useState(null);
  const [image2, setImage2] = useState(null);
  const [image3, setImage3] = useState(null);
  const [image4, setImage4] = useState(null);
  const
    [previewImages, setPreviewImages] = useState([]);

  const updateVariant = (index, field, value) => {
    setVariants((prevVariants) => {
      const updatedVariants = [...prevVariants];
      updatedVariants[index][field] = value;
      return updatedVariants;
    });
  };
  const addVariant = () => {
    setVariants([
      ...variants,
      { color: "", size: "", stock: 0, price: 0, berat: 0 },
    ]);
  };
  const removeVariant = (index) => {
    setVariants((prevVariants) => {
      const updatedVariants = [...prevVariants];
      updatedVariants.splice(index, 1);
      return updatedVariants;
    });
  };
  const handleImageChange = (e, index) => {
    const file = e.target.files[0];
    switch (index) {
      case 0:
        setImage1(file);
        setPreviewImages((prevImages) => [
          URL.createObjectURL(file),
          ...prevImages.slice(1),
        ]);
        break;
      case 1:
        setImage2(file);
        setPreviewImages((prevImages) => [
          prevImages[0],
          URL.createObjectURL(file),
          ...prevImages.slice(2),
        ]);
        break;
      case 2:
        setImage3(file);
        setPreviewImages((prevImages) => [
          prevImages[0],
          prevImages[1],
          URL.createObjectURL(file),
          ...prevImages.slice(3),
        ]);
        break;
      case 3:
        setImage4(file);
        setPreviewImages((prevImages) => [
          prevImages[0],
          prevImages[1],
          prevImages[2],
          URL.createObjectURL(file),
        ]);
        break;
      default:
        break;
    }
  };
  useEffect(() => {
    const fetchProduct = async () => {

      try {
        const response = await axios.get(
          `${backendURI}/api/product/${productId}/single`,
          { headers: { token } }
        );

        if (response.data.success) {
          const product = response.data.product;
          setName(product.name);
          setDescription(product.description);
          setPrice(product.price);
          setCategory(product.category);
          setSubCategory(product.subCategory);
          setBestseller(product.bestseller);
          setVariants(product.variants);
          setPreviewImages(product.image);
        } else {
          toast.error(response.data.message);
        }
      } catch (error) {
        toast.error(error.message);
      }
    };
    if (token) {
      fetchProduct();
    } else {
      toast.error("Please login to update the product");
    }
  }, [productId, token]);


  const onSubmitHandler = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();

      formData.append("name", name);
      formData.append("description", description);
      formData.append("price", price);
      formData.append("category", category);
      formData.append("subCategory", subCategory);
      formData.append("bestseller", bestseller);
      formData.append("variants", JSON.stringify(variants));
      //kirim image jika ada
      image1 && formData.append("image1", image1);
      image2 && formData.append("image2", image2);
      image3 && formData.append("image3", image3);
      image4 && formData.append("image4", image4);

      const response = await axios.put(
        `${backendURI}/api/product/update/${productId}`,
        formData,
        { headers: { token } }
      );
      if (response.data.success) {
        toast.success(response.data.message);
        navigate('/list'); // Arahkan ke halaman list produk
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };


  return (
    <div className=" grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 w-full">
    <form onSubmit={onSubmitHandler} className="flex flex-col w-full items-start gap-6">
      <div>
        <p className="mb-2">Edit Image</p>
        <div className="flex gap-3 flex-wrap justify-start">
          {[0, 1, 2, 3].map((index) => (
            <label htmlFor={`image${index + 1}`} key={index} className="flex flex-col items-center">
              {previewImages[index] ? ( // Cek apakah ada preview image
                <img
                  className="w-20 h-20 object-cover border-2 border-gray-300 rounded-md mb-2 max-w-full"
                  src={previewImages[index]}
                  alt={`Preview ${index + 1}`}
                />
              ) : ( // Jika tidak ada, tampilkan upload area
                <img
                  className="w-20 h-20 object-cover border-2 border-dashed border-gray-300 rounded-md mb-2"
                  src={assets.upload_area}
                  alt={`Upload Area ${index + 1}`}
                />
              )}
              <input
                onChange={(e) => handleImageChange(e, index)}
                type="file"
                id={`image${index + 1}`}
                hidden
              />
            </label>
          ))}
        </div>
      </div>

      <div className="w-full">
        <p className="mb-2 text-lg font-semibold">Product Name</p>
        <input onChange={(e) => setName(e.target.value)} value={name} className="w-full max-w-[600px] px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Type Here" type="text" />
      </div>

      <div className="w-full">
        <p className="mb-2 text-lg font-semibold">Product Description</p>
        <textarea onChange={(e) => setDescription(e.target.value)} value={description} className="w-full max-w-[600px] px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Type content here" type="text" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full">
        <div className="mb-6">
          <label htmlFor="category" className="block text-gray-700 text-sm font-semibold mb-2">
            Product Category
          </label>
          <select onChange={(e) => setCategory(e.target.value)}
            id="category"
            className="shadow appearance-none border rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="men">MEN</option>
            <option value="women">WOMEN</option>
            <option value="kids">KIDS</option>
          </select>
        </div>
        <div className="mb-6">
          <label htmlFor="subCategory" className="block text-gray-700 text-sm font-semibold mb-2">
            Product subCategory
          </label>
          <select onChange={(e) => setsubCategory(e.target.value)}
            id="subCategory"
            className="shadow appearance-none border rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="topwear">Topwear</option>
            <option value="bottomwear">Bottomwear</option>
            <option value="footwear">Footwear</option>
          </select>
        </div>
        <div className="mb-6">
          <label htmlFor="price" className="block text-gray-700 text-sm font-semibold mb-2">
            Product Price
          </label>
          <input onChange={(e) => setPrice(e.target.value)}
            value={price}
            id="price"
            className="shadow appearance-none border rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
            type="Number"
            placeholder="25"
          />
        </div>
      </div>

      <div className="w-full">
        <p className="block text-gray-700 text-lg font-semibold mb-2">Product Variants</p>
        <div>
          {variants.map((variant, index) => (
            <div key={index} className="flex mb-3 border gap-3 p-4 rounded-md">
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Color"
                  value={variant.color}
                  onChange={(e) =>
                    updateVariant(index, "color", e.target.value)
                  }
                  className="shadow appearance-none border rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="Size"
                  value={variant.size}
                  onChange={(e) =>
                    updateVariant(index, "size", e.target.value)
                  }
                  className="shadow appearance-none border rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-3">
                <input
                  type="number"
                  placeholder="Stock"
                  value={variant.stock}
                  onChange={(e) =>
                    updateVariant(index, "stock", parseInt(e.target.value, 10))
                  }
                  className="shadow appearance-none border rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="number"
                  placeholder="Price"
                  value={variant.price}
                  onChange={(e) =>
                    updateVariant(index, "price", parseFloat(e.target.value))
                  }
                  className="shadow appearance-none border rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                
                />
                <input
                  type="number"
                  placeholder="Berat (gram)"
                  value={variant.berat}
                  onChange={(e) =>
                    updateVariant(index, "berat", parseInt(e.target.value, 10))
                  }
                  className="shadow appearance-none border rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => removeVariant(index)}
                  className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-3 rounded-md items-center"
                >
                  Remove
                </button>
              </div>

            </div>
          ))}
          <button
            type="button"
            onClick={addVariant}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md"
          >
            Add Variant
          </button>
        </div>
      </div>

      <div className="mb-4">
        <label className="inline-flex items-center">
          <input onChange={() => setBesller(prev => !prev)} checked={bestseller} type="checkbox" className="form-checkbox" />
          <span className="ml-2 text-gray-700">Add to bestseller</span>
        </label>
      </div>
      <button className="bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800">ADD</button>
    </form>
    </div>
  );
};

export default UpdateProduct;

