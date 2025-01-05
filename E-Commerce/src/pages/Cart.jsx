import React, { useContext, useMemo } from "react";
import { ShopContext } from "../context/ShopContext";
import Title from "../components/Title";
import { assets } from "../assets/assets";
import CartTotal from "../components/CartTotal";
import { useCart } from "../hooks/useCart";

const Cart = () => {
  const { cartItems, updateQuantity, removeItemFromCart, clearCart, formatIDR, navigate } = useContext(ShopContext);
  const { cartData, handleQuantityChange, handleRemoveItem, handleClearCart } = useCart(cartItems, updateQuantity, removeItemFromCart, clearCart);

  const memoizedCartTotal = useMemo(() => <CartTotal />, [cartData]);

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <div className="text-3xl font-bold text-center mb-4">
          <Title text1="Shopping" text2="Cart" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {cartData.length > 0 ? (
              <ul className="list-none">
                {cartData.map((item, index) => (
                  <CartItem
                    key={`${item.productId}-${item.variantId || "no-variant"}-${item.optionId || "no-option"}-${index}`}
                    item={item}
                    formatIDR={formatIDR}
                    handleQuantityChange={handleQuantityChange}
                    handleRemoveItem={handleRemoveItem}
                  />
                ))}
              </ul>
            ) : (
              <p className="text-center text-gray-600">Keranjang belanja Anda kosong.</p>
            )}
          </div>
          {memoizedCartTotal}
        </div>

        <div className="mt-6 flex justify-end gap-4">
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
  );
};

const CartItem = React.memo(({ item, formatIDR, handleQuantityChange, handleRemoveItem }) => (
  <li className="relative py-4 border-b border-gray-300 text-gray-700 flex flex-col sm:flex-row justify-between items-center">
    <button
      onClick={() => handleRemoveItem(item.productId, item.variantId, item.optionId)}
      className="absolute top-0 right-0 mt-2 py-4 mr-2 text-gray-500 hover:text-gray-700"
    >
      <img src={assets.cross_icon} className="w-4 sm:w-5 cursor-pointer" alt="Remove" />
    </button>

    <div className="flex items-start gap-4">
      <img
        className="w-48 h-72 object-cover rounded-lg"
        src={item.productImage}
        alt={item.productName}
      />
      <div className="mt-2 gap-4">
        <p className="text-lg font-semibold">{item.productName}</p>
        <p className="text-sm text-gray-600">
          {item.variantName} - {item.optionName}
        </p>
        <p className="text-sm text-gray-600">
          Category: {item.productCategory} <br />
          Subcategory: {item.productSubCategory}
        </p>
        <p className="text-lg font-bold">{formatIDR(item.optionPrice)}</p>
        <div className="flex items-center mt-2">
          <button
            onClick={() => handleQuantityChange(item.productId, item.variantId, item.optionId, item.quantity - 1)}
            className="bg-gray-200 text-gray-700 px-2 py-1 rounded-l"
            disabled={item.quantity <= 1}
          >
            -
          </button>
          <input
            type="number"
            value={item.quantity}
            onChange={(e) => handleQuantityChange(item.productId, item.variantId, item.optionId, parseInt(e.target.value, 10) || 0)}
            className="text-center border-t border-b w-16"
            min="1"
          />
          <button
            onClick={() => handleQuantityChange(item.productId, item.variantId, item.optionId, item.quantity + 1)}
            className="bg-gray-200 text-gray-700 px-2 py-1 rounded-r"
          >
            +
          </button>
        </div>
        <p className="text-sm text-gray-600 mt-2">Total: {formatIDR(item.totalPrice)}</p>
      </div>
    </div>
  </li>
));

export default Cart;
