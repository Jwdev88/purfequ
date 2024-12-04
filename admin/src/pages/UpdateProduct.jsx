import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { backendURI } from "../App";
import { toast } from "react-toastify";
import { assets } from "../assets/assets";
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
  const [sizes, setSizes] = useState([]);
  const [image1, setImage1] = useState(null);
  const [image2, setImage2] = useState(null);
  const [image3, setImage3] = useState(null);
  const [image4, setImage4] = useState(null);
  const
    [previewImages, setPreviewImages] = useState([]);
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
          setSizes(product.sizes);
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
      formData.append("sizes", JSON.stringify(sizes));
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
/******  e8e8ad4a-1f59-4433-97d7-ef22b30ff2b3  *******/ 

  return (
    <form onSubmit={onSubmitHandler} className="flex flex-col gap-3">
      <div>
        <p className="mb-2">Upload Image</p>
        <div className="flex gap-3">
          {[0, 1, 2, 3].map((index) => (
            <label htmlFor={`image${index + 1}`} key={index}>
              <img
                className="w-20"
                src={previewImages[index] || assets.upload_area}
                alt=""
              />
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
        <p className="mb-2">Product Name</p>
        <input
          onChange={(e) => setName(e.target.value)}
          value={name}
          className="w-full max-w-[600px] px-3 py-2"
          placeholder="Type Here"
          type="text"
        />
      </div>

      <div className="w-full">
        <p className="mb-2">Product Description</p>
        <textarea
          onChange={(e) => setDescription(e.target.value)}
          value={description}
          className="w-full max-w-[600px] px-3 py-2"
          placeholder="Type content here"
          type="text"
        />
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-3 gap-3">
        <div className="mb-6">
          <label
            htmlFor="category"
            className="block text-gray-700 text-sm font-bold mb-2"
          >
            Product Category
          </label>
          <select
            onChange={(e) => setCategory(e.target.value)}
            id="category"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          >
            <option value="men">MEN</option>
            <option value="women">WOMEN</option>
            <option value="kids">KIDS</option>
          </select>
        </div>
        <div className="mb-6">
          <label
            htmlFor="subCategory"
            className="block text-gray-700 text-sm font-bold mb-2"
          >
            Product subCategory
          </label>
          <select
            onChange={(e) => setSubCategory(e.target.value)}
            id="subCategory"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          >
            <option value="topwear">Topwear</option>
            <option value="bottomwear">Bottomwear</option>
            <option value="footwear">Footwear</option>
          </select>
        </div>
        <div className="mb-6">
          <label
            htmlFor="price"
            className="block text-gray-700 text-sm font-bold mb-2"
          >
            Product Price
          </label>
          <input
            onChange={(e) => setPrice(e.target.value)}
            value={price}
            id="price"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            type="Number"
            placeholder="25"
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Product Sizes</label>
          <div className="flex gap-3">
            <div className="flex gap-2">
              {["S", "M", "L", "XL", "XXL"].map((size) => (
                <div
                  key={size}
                  onClick={() =>
                    setSizes((prev) =>
                      prev.includes(size)
                        ? prev.filter((item) => item !== size)
                        : [...prev, size]
                    )
                  }
                >
                  <p
                    className={`${sizes.includes(size) ? "bg-pink-100" : "bg-slate-200"
                      } px-4 py-2 rounded cursor-pointer`}
                  >
                    {size}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <label className="inline-flex items-center">
          <input
            onChange={() => setBestseller((prev) => !prev)}
            checked={bestseller}
            type="checkbox"
            className="form-checkbox"
          />
          <span className="ml-2 text-gray-700">Add to bestseller</span>
        </label>
      </div>
    
        <button className="bg-black text-white px-6 py-2 rounded">
          Update Produk
        </button>

    </form>
  );
};

export default UpdateProduct;

