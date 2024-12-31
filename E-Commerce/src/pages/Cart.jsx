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
    if (products.length > 0 && cartItems) {
      const tempData = Object.entries(cartItems).flatMap(([itemId, variants]) =>
        Object.entries(variants).flatMap(([variantName, options]) =>
          Object.entries(options).flatMap(([variantOption, quantity]) => {
            if (quantity > 0) {
              const productData = products.find((product) => product._id === itemId);
              if (productData) {
                const variant = productData.variants?.find((v) => v.name === variantName);
                const option = variant?.options?.find((o) => o.name === variantOption);
                if (option) {
                  return {
                    _id: itemId,
                    itemId,
                    variantName,
                    variantOption,
                    quantity,
                    totalPrice: option.price * quantity,
                  };
                }
              }
            }
            return null;
          })
        )
      ).filter((item) => item);
      setCartData(tempData);
    }
  }, [cartItems, products]);

  const handleClearCart = () => {
    clearCart();
    toast.success('Cart cleared successfully');
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <div className="text-3xl font-bold text-center mb-4">
          <Title text1="Shopping" text2="Cart" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {cartData.length > 0 ? (
              cartData.map((item, index) => {
                const productData = products.find((product) => product._id === item._id);
                return (
                  <div
                    key={index}
                    className="relative py-4 border-b border-gray-300 text-gray-700 flex flex-col sm:flex-row justify-between items-center"
                  >
                    <button
                      onClick={() => updateQuanity(item._id, item.variantName, item.variantOption, 0)}
                      className="absolute top-0 right-0 mt-2 py-4 mr-2 text-gray-500 hover:text-gray-700"
                    >
                      <img
                        src={assets.cross_icon}
                        className="w-4 sm:w-5 cursor-pointer"
                        alt="Remove"
                      />
                    </button>
                    <div className="flex items-start gap-4">
                      {productData?.image && (
                        <img
                          className="w-48 h-72 object-cover rounded-lg"
                          src={productData.image[0]}
                          alt={productData.name}
                        />
                      )}
                      <div className="mt-2 gap-4">
                        <p className="text-lg font-semibold">{productData?.name || "Product Name"}</p>
                        <p className="font-medium text-gray-500">{productData?.category || "Category"}</p>
                        <p className="font-medium text-gray-900">{productData ? formatIDR(productData.price) : "Price"}</p>
                        <p className="font-medium text-green-500">{item.variantName} - {item.variantOption}</p>
                      </div>
                    </div>
                    <div className="flex items-center mt-4 sm:mt-0">
                      <select
                        onChange={(e) =>
                          updateQuanity(item._id, item.variantName, item.variantOption, Number(e.target.value))
                        }
                        className="border border-gray-300 rounded-md p-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-600"
                        value={item.quantity}
                      >
                        {[...Array(10).keys()].map((num) => (
                          <option key={num} value={num + 1}>
                            {num + 1}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-center text-gray-600">Your cart is empty</p>
            )}
          </div>
          <div className="bg-gray-50 p-6 rounded-lg shadow-md">
            <CartTotal />
            <div className="flex flex-col items-end gap-4 mt-6">
              <button
                onClick={() => navigate('/place-order')}
                className="bg-purple-600 text-white text-lg px-8 py-3 rounded-lg hover:bg-purple-700 transition duration-200 w-full"
              >
                Checkout
              </button>
              <button
                onClick={handleClearCart}
                className="bg-red-600 text-white text-lg px-8 py-3 rounded-lg hover:bg-red-700 transition duration-200 w-full"
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
