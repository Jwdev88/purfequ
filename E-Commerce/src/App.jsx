import React from 'react'
import {BrowserRouter, Routes,Route } from 'react-router-dom'
import Home from './pages/Home'
import Collection from './pages/Collection'
import Contact from './pages/Contact'
import Product from './pages/Product'
import Cart from './pages/Cart'
import Login from './pages/Login'
import PlaceOrder from './pages/PlaceOrder'
import Orders from './pages/Orders'
import Navbar from './components/Navbar'
import About from './pages/About'
import Footer from './components/Footer'
import SearchBar from './components/SearchBar'
import UpdateProfile from './components/UpdateProfile';
import AddressList from './components/AddressList';
import AddAddress from './components/AddAddress';
import UpdateAddress from './components/UpdateAddress';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
const App = () => {
  return (
    <div className='px-1 sm:px-[5vw] md:px-[7vw] lg:px-[9vw]'>
      <ToastContainer/>
      <Navbar/>
      <SearchBar/>
      <Routes>
        <Route path='/' element={<Home/>}/>
        <Route path='collection' element={<Collection/>}/>
        <Route path='about' element={<About/>}/>
        <Route path='contact' element={<Contact/>}/>
        <Route path='product/:productId' element={<Product />} /> 
        <Route path='cart' element={<Cart/>}/>
        <Route path='login' element={<Login/>}/>
        <Route path='place-order' element={<PlaceOrder/>}/>
        <Route path='orders' element={<Orders/>}/>   
        <Route path="/profile" element={<UpdateProfile />} />
        <Route path="/addresses" element={<AddressList />} />
        <Route path="/add-address" element={<AddAddress />} />
        <Route path="/update-address/:addressId" element={<UpdateAddress />} />

      
      </Routes>
      <Footer/>
    </div>
  )
}

export default App