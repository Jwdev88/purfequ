import React, { useContext, useEffect, useState } from 'react';
import { ShopContext } from '../context/ShopContext';
import Title from '../components/Title';
import { assets } from '../assets/assets';
import CartTotal from '../components/CartTotal';
import { toast } from 'react-toastify';

const Cart = () => {
  const { products, formatIDR, cartItems, updateQuanity, navigate, clearCart } = useContext(ShopContext);
  const [cartData, setCartData] = useState([]);

  useEffect(() => {
    if (products.length > 0) {
      const tempData = [];
      for (const items in cartItems) {
        for (const item in cartItems[items]) {
          if (cartItems[items][item]) {
            const productData = products.find((product) => product._id === items);
            tempData.push({
              _id: items,
              items,
              size: item,
              quantity: cartItems[items][item],
              totalPrice: productData.price * cartItems[items][item],
            });
          }
        }
      }
      setCartData(tempData);
    }
  }, [cartItems, products]);
  const handleClearCart = () => {
    clearCart(); // Panggil fungsi clearCart dari context
    toast.success('Cart cleared successfully');
    
  };
  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <div className="text-3xl font-bold text-center mb-4">
          <Title text1={'Shopping'} text2={'Cart'} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {cartData.map((item, index) => {
              const productData = products.find((product) => product._id === item._id);
              return (
                <div
                  key={index}
                  className="relative py-4 border-b border-gray-300 text-gray-700 flex flex-col sm:flex-row justify-between items-center"
                >
                  <button

                    onClick={() => updateQuanity(item._id, item.size, 0)}
                    className="absolute top-0 right-0 mt-2 py-4 mr-2 text-gray-500 hover:text-gray-700"
                  ><img onClick={() => updateQuanity(item._id, item.size, 0)} src={assets.cross_icon} className='w-4 mr-4 sm:w-5 cursor-pointer ' alt="" />


                  </button>
                  <div className="flex items-start gap-4">
                    <img className="w-48 h-72 object-cover rounded-lg" src={productData.image[0]} alt={productData.name} />
                    <div className='mt-2 gap-4'>
                      <p className="text-lg font-semibold">{productData.name}</p>
                      <p className="font-medium text-gray-500">{productData.category}</p>
                      <p className="font-medium text-gray-900">{formatIDR(productData.price)}</p>
                      <p className="font-medium text-green-500">{item.size}</p>
                    </div>
                  </div>
                  <div className="flex items-center mt-4 sm:mt-0">
                    <select
                      onChange={(e) =>
                        e.target.value === '' || e.target.value === '0'
                          ? null
                          : updateQuanity(item._id, item.size, Number(e.target.value))
                      }
                      className="border border-gray-300 rounded-md p-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                      defaultValue={item.quantity}
                    >
                      {[...Array(10).keys()].map((num) => (
                        <option key={num} value={num + 1}>{num + 1}</option>
                      ))}
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="bg-gray-50 p-6 rounded-lg shadow-md">
            <CartTotal />
            <div className="flex flex-col items-end gap-4 mt-6"> {/* Ubah flex-row ke flex-col dan tambahkan gap */}
              <button
                onClick={() => navigate('/place-order')}
                className="bg-purple-600 text-white text-lg px-8 py-3 rounded-lg hover:bg-purple-700 transition duration-200 w-full" // Tambahkan w-full
              >
                Checkout
              </button>
              <button
                onClick={handleClearCart}
                className="bg-red-600 text-white text-lg px-8 py-3 rounded-lg hover:bg-red-700 transition duration-200 w-full" // Tambahkan w-full
              >
                Clear Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};






export default Cart;