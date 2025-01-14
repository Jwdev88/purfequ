import React, { useContext, useMemo } from "react";
import { ShopContext } from "../context/ShopContext";
import Title from "../components/Title";
import CartTotal from "../components/CartTotal";
import { useCart } from "../hooks/useCart";

const Cart = () => {
  const {
    cartItems,
    updateQuantity,
    removeItemFromCart,
    clearCart,
    formatIDR,
    navigate,
  } = useContext(ShopContext);

  const {
    cartData,
    handleQuantityChange,
    handleRemoveItem,
    handleClearCart,
  } = useCart(
    cartItems,
    updateQuantity,
    removeItemFromCart,
    clearCart
  );

  const memoizedCartTotal = useMemo(() => <CartTotal />, [cartData]);

  return (
    <div className="min-h-screen bg-gray-100 p-4 overflow-y-auto">
      <div className="max-w-7xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-center mb-4 text-gray-700">
          <Title text1="Shopping" text2="Cart" />
        </h1>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Cart Items */}
          <div className="flex-1 space-y-4 w-full">
            {cartData.length > 0 ? (
              cartData.map((item) => (
                <CartItem
                  key={`${item.productId}-${item.variantId || "no-variant"}-${item.optionId || "no-option"}`}
                  item={item}
                  formatIDR={formatIDR}
                  handleQuantityChange={handleQuantityChange}
                  handleRemoveItem={handleRemoveItem}
                />
              ))
            ) : (
              <p className="text-center text-gray-600">Your cart is empty.</p>
            )}
          </div>

          {/* Cart Summary */}
          <div className="flex-none space-y-6 w-full lg:w-1/3">
            {memoizedCartTotal}
            <button
              className="w-full py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition duration-300"
              onClick={() => navigate("/place-order")}
            >
              Checkout
            </button>
            <button
              className="w-full py-3 bg-red-600 text-white rounded-md hover:bg-red-700 transition duration-300"
              onClick={handleClearCart}
            >
              Clear Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const CartItem = React.memo(({ item, formatIDR, handleQuantityChange, handleRemoveItem }) => (
  <div className="relative flex flex-col sm:flex-row justify-between items-center py-4 border-b border-gray-300 w-full bg-gray-50 rounded-md p-4">
    <button
      className="absolute top-2 right-2 text-red-500 hover:text-red-700"
      onClick={() => handleRemoveItem(item.productId, item.variantId, item.optionId)}
    >
      <span className="sr-only">Remove item</span>
      <svg
        className="w-5 h-5"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    </button>

    <div className="flex gap-4 w-full">
      <img
        src={item.productImage}
        alt={item.productName}
        className="w-36 h-36 object-cover rounded-lg"
      />
      <div className="flex-1 space-y-2">
        <p className="text-lg font-semibold">{item.productName}</p>
        <p className="text-sm text-gray-600">{item.variantName} - {item.optionName}</p>
        <p className="text-sm text-gray-600">
          Category: {item.productCategory} <br />
          Subcategory: {item.productSubCategory}
        </p>
        <p className="text-lg font-bold">{formatIDR(item.optionPrice)}</p>

        <div className="flex gap-4 items-center">
          <button
            className="px-3 py-1 text-sm border rounded-md bg-gray-200 hover:bg-gray-300"
            onClick={() => handleQuantityChange(item.productId, item.variantId, item.optionId, item.quantity - 1)}
            disabled={item.quantity <= 1}
          >
            -
          </button>
          <input
            type="number"
            value={item.quantity}
            onChange={(e) =>
              handleQuantityChange(item.productId, item.variantId, item.optionId, parseInt(e.target.value, 10))
            }
            className="w-16 text-center py-1 border rounded-md"
          />
          <button
            className="px-3 py-1 text-sm border rounded-md bg-gray-200 hover:bg-gray-300"
            onClick={() => handleQuantityChange(item.productId, item.variantId, item.optionId, item.quantity + 1)}
          >
            +
          </button>
        </div>

        <p className="text-sm text-gray-600 mt-2">Total: {formatIDR(item.totalPrice)}</p>
      </div>
    </div>
  </div>
));

export default Cart;
