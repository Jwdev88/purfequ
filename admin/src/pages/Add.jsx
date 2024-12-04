import React, { useState } from "react";
import { assets } from "../assets/assets";
import axios from "axios";
import { backendURI } from "../App";
import { toast } from "react-toastify";
const Add = ({token}) => {


  const [image1, setImage1] = useState(false);
  const [image2, setImage2] = useState(false);
  const [image3, setImage3] = useState(false);
  const [image4, setImage4] = useState(false);

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [category, setCategory] = useState('men')
  const [subCategory, setsubCategory] = useState('Topwear')
  const [bestseller, setBesller] = useState(false)
  const [sizes, setSizes] = useState([]);

  const onSubmitHandler = async (e) =>{
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
    
      image1 && formData.append("image1", image1);
      image2 && formData.append("image2", image2);
      image3 && formData.append("image3", image3);
      image4 && formData.append("image4", image4);
      //
      // ... (kode untuk mengirim formData) ...
      const response = await axios.post(backendURI+"/api/product/add",formData,{headers:{token}})
      console.log(response.data)

      if(response.data.success){
        toast.success(response.data.message)
        setName('')
        setDescription('')
        setImage1(false)
        setImage2(false)
        setImage3(false)
        setImage4(false)
        setPrice('')
      } else(
        toast.error(response.data.message)
      )
    } catch (error) {
      // ... (error handling) ...
      console.log(error);
      toast.error(error.message)
    }
  }

  return (

    <form onSubmit={onSubmitHandler} className="flex flex-col w-full items-start gap-3">
      <div>
        <p className="mb-2">Upload Image</p>
        <div className="flex gap-3">
          <label htmlFor="image1">
            <img className="w-20" src={!image1 ? assets.upload_area : URL.createObjectURL(image1)} alt="" />
            <input onChange={(e) => setImage1(e.target.files[0])} type="file" id="image1" hidden />
          </label>
          <label htmlFor="image2">
            <img className="w-20" src={!image2 ? assets.upload_area : URL.createObjectURL(image2)} alt="" />
            <input onChange={(e) => setImage2(e.target.files[0])} type="file" id="image2" hidden />
          </label>
          <label htmlFor="image3">
            <img className="w-20" src={!image3 ? assets.upload_area : URL.createObjectURL(image3)} alt="" />
            <input onChange={(e) => setImage3(e.target.files[0])} type="file" id="image3" hidden />
          </label>
          <label htmlFor="image4">
            <img className="w-20" src={!image4 ? assets.upload_area : URL.createObjectURL(image4)} alt="" />
            <input onChange={(e) => setImage4(e.target.files[0])} type="file" id="image4" hidden />
          </label>
        </div>
      </div>

      <div className="w-full">
        <p className="mb-2">Product Name</p>
        <input onChange={(e) => setName(e.target.value)} value={name} className="w-full max-w-[600px] px-3 py-2" placeholder="Type Here" type="text" />
      </div>


      <div className="w-full">
        <p className="mb-2">Product Description</p>
        <textarea onChange={(e) => setDescription(e.target.value)} value={description} className="w-full max-w-[600px] px-3 py-2" placeholder="Type content here" type="text" />
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-3 gap-3">
        <div className="mb-6">
          <label htmlFor="category" className="block text-gray-700 text-sm font-bold mb-2">
            Product Category
          </label>
          <select onChange={(e) => setCategory(e.target.value)}
            id="category"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          >
            <option value="men">MEN</option>
            <option value="women">WOMEN</option>
            <option value="kids">KIDS</option>
          </select>
        </div>
        <div className="mb-6">
          <label htmlFor="subCategory" className="block text-gray-700 text-sm font-bold mb-2">
            Product subCategory
          </label>
          <select onChange={(e) => setsubCategory(e.target.value)}
            id="subCategory"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          >
            <option value="topwear">Topwear</option>
            <option value="bottomwear">Bottomwear</option>
            <option value="footwear">Footwear</option>
          </select>
        </div>
        <div className="mb-6">
          <label htmlFor="price" className="block text-gray-700 text-sm font-bold mb-2">
            Product Price
          </label>
          <input onChange={(e) => setPrice(e.target.value)}
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
          <input onChange={()=>setBesller(prev=>!prev)} checked={bestseller} type="checkbox" className="form-checkbox" />
          <span className="ml-2 text-gray-700">Add to bestseller</span>
        </label>
      </div>
      <button className="bg-black text-white px-6 py-2 rounded">ADD</button>
    </form>
  );
};

export default Add;
