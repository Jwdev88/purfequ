import React, { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import Login from "./components/Login";

// Product
import AddProduct from "./pages/product/AddProduct";
import ListProduct from "./pages/product/ListProduct";
import UpdateProduct from "./pages/product/UpdateProduct"

// Category
import AddCategory from "./pages/category/AddCategory";
import CategoryList from "./pages/category/ListCategory";
import UpdateCategory from "./pages/category/UpdateCategory";

// SubCategory
import AddSubCategoryForm from "./pages/subcategory/AddSubCategory";
import ListSubCategory from "./pages/subcategory/ListSubCategory";
import UpdateSubCategory from "./pages/subcategory/UpdateSubCategory";

///


import Orders from "./pages/order/Orders";


export const backendURI = import.meta.env.VITE_BACKEND_URL

const App = () => {
  const [token, setToken] = useState(localStorage.getItem('token') || '');

  useEffect(() => {
    localStorage.setItem('token', token)
  }, [token])

  return (
    <div className="bg-gray-50 min-h-screen">
      <ToastContainer />
      {token === ''
        ? <Login setToken={setToken} />
        : <>
          <Navbar setToken={setToken} />
          <hr />
          <div className="flex w-full">
            <Sidebar />
            <div className="w-[70%] mx-auto ml-[max(5vw,25px)] my-4 text-gray-600 text-base">
              <Routes>

                <Route path="/product">
                  <Route path="add" element={<AddProduct token={token} />} />
                  <Route path="list" element={<ListProduct token={token} />} />
                  <Route path="edit/:productId" element={<UpdateProduct token={token} />} />
                </Route>

                <Route path="/category">
                  <Route path="add" element={<AddCategory token={token} />} />
                  <Route path="list" element={<CategoryList token={token} />} />
                  <Route path="edit/:categoryId" element={<UpdateCategory token={token} />} />
                </Route>

                <Route path="/subcategory">
                  <Route path="add" element={<AddSubCategoryForm token={token} />} />
                  <Route path="list" element={<ListSubCategory token={token} />} />
                  <Route path="edit/:subcategoryId" element={<UpdateSubCategory token={token} />} />
                </Route>

                <Route path="/orders" element={<Orders token={token} />} />

              </Routes>
            </div>
          </div>
        </>
      }
    </div>
  )
}

export default App;