import React, { useContext, useEffect, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import Title from "../components/Title";
import { assets } from "../assets/assets";
import CartTotal from "../components/CartTotal";
import { toast } from "react-toastify";

const Cart = () => {
  const {
    products,
    formatIDR,
    cartItems,
    updateQuantity,
    navigate,
    clearCart,
  } = useContext(ShopContext);
  const [cartData, setCartData] = useState([]);

  useEffect(() => {
    if (cartItems.length > 0 && products.length > 0) {
      const tempData = cartItems
        .map((cartItem) => {
          const productData = products.find(
            (product) => product._id === cartItem.productId._id
          );
          if (!productData) return null;

          return cartItem.variants
            .map((variant) => {
              const variantData = productData.variants?.find(
                (v) => v._id === variant.variantId
              );
              if (!variantData) return null;

              const optionData = variantData.options?.find(
                (o) => o._id === variant.optionId
              );
              if (!optionData) return null;

              return {
                productId: productData._id,
                productName: productData.name || "Unknown Product",
                productImage: productData.images?.[0] || assets.defaultImage,
                variantName: variantData.name || "Unknown Variant",
                optionName: optionData.name || "Unknown Option",
                optionPrice: optionData.price || 0,
                quantity: cartItem.quantity || 0,
                totalPrice: (optionData.price || 0) * (cartItem.quantity || 0),
                itemId: cartItem._id,
                variantId: variant.variantId,
                optionId: variant.optionId,
              };
            })
            .filter(Boolean);
        })
        .filter(Boolean)
        .flat();

      setCartData(tempData);
    } else {
      // Handle case when cartItems or products are empty
      setCartData([]);
    }
  }, [cartItems, products]); // Pastikan untuk mendengarkan perubahan pada cartItems dan products

  const handleQuantityChange = (
    productId,
    variantId,
    optionId,
    newQuantity
  ) => {
    // Pastikan hanya mengupdate kuantitas item yang dipilih pengguna
    if (newQuantity < 1) {
      return; // Jangan izinkan kuantitas lebih rendah dari 1
    }

    // Update kuantitas pada item yang dipilih
    updateQuantity(productId, variantId, optionId, newQuantity);

    // Perbarui cartData lokal untuk hanya item yang diperbarui
    setCartData((prevCartData) => {
      return prevCartData.map((item) => {
        if (
          item.productId === productId &&
          item.variantId === variantId &&
          item.optionId === optionId
        ) {
          return {
            ...item,
            quantity: newQuantity,
            totalPrice: item.optionPrice * newQuantity, // Total harga per item
          };
        }
        return item; // Jangan ubah item lain
      });
    });
  };
  // Clear seluruh cart
  const handleClearCart = () => {
    setCartData([]); // Clear cartData
    clearCart(); // Clear cart di context
    toast.success("Cart cleared successfully");
  };

  // Render komponen
  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <div className="text-3xl font-bold text-center mb-4">
          <Title text1="Shopping" text2="Cart" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {cartData.length > 0 ? (
              cartData.map((item) => (
                <div
                  key={`${item.productId}-${item.variantId}-${item.optionId}`}
                  className="relative py-4 border-b border-gray-300 text-gray-700 flex flex-col sm:flex-row justify-between items-center"
                >
                  <button
                    onClick={() =>
                      handleQuantityChange(
                        item.productId,
                        item.variantId,
                        item.optionId,
                        0
                      )
                    }
                    className="absolute top-0 right-0 mt-2 py-4 mr-2 text-gray-500 hover:text-gray-700"
                  >
                    <img
                      src={assets.cross_icon}
                      className="w-4 sm:w-5 cursor-pointer"
                      alt="Remove"
                    />
                  </button>

                  <div className="flex items-start gap-4">
                    <img
                      className="w-48 h-72 object-cover rounded-lg"
                      src={item.productImage || assets.defaultImage}
                      alt={item.productName || "Product Image"}
                    />
                    <div className="mt-2 gap-4">
                      <p className="text-lg font-semibold">
                        {item.productName || "Unknown Product"}
                      </p>
                      <p className="font-medium text-gray-500">Category</p>
                      <p className="font-medium text-gray-900">
                        {formatIDR(item.optionPrice) || "Price"}
                      </p>
                      <p className="font-medium text-gray-900">
                        {formatIDR(item.totalPrice) || "Price"}
                      </p>
                      <p className="font-medium text-green-500">
                        {item.variantName} - {item.optionName}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center mt-4 sm:mt-0">
                    <select
                      onChange={(e) => {
                        const newQuantity = Number(e.target.value);
                        handleQuantityChange(
                          item.productId,
                          item.variantId,
                          item.optionId,
                          newQuantity
                        );
                      }}
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
              ))
            ) : (
              <p className="text-center text-gray-600">Your cart is empty</p>
            )}
          </div>

          <div className="bg-gray-50 p-6 rounded-lg shadow-md">
            <CartTotal />
            <div className="flex flex-col items-end gap-4 mt-6">
              <button
                onClick={() => navigate("/place-order")}
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
