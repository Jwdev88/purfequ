// --- components/Cart.jsx ---
import React, { useContext, useMemo, useState, useCallback, useEffect } from "react";
import { ShopContext } from "../context/ShopContext";
import Title from "../components/Title";
import { useCart } from "../hooks/useCart";
import { CheckCircle2, Loader2Icon,Trash2Icon } from 'lucide-react'; // Import Loader2Icon
import { toast } from "react-toastify";


const Cart = () => {
    const { cartItems, updateQuantity, removeItemFromCart, clearCart, formatIDR, navigate } = useContext(ShopContext);
    const [selectedItems, setSelectedItems] = useState({});
    const [isCheckingOut, setIsCheckingOut] = useState(false); // Loading state for checkout

    const { cartData, handleQuantityChange, handleRemoveItem, handleClearCart } = useCart(
        cartItems,
        updateQuantity,
        removeItemFromCart,
        clearCart
    );

  const toggleSelectItem = useCallback((productId, variantId, optionId) => {
    const key = `${productId}-${variantId || 'no-variant'}-${optionId || 'no-option'}`;
    setSelectedItems((prevSelected) => ({
      ...prevSelected,
      [key]: !prevSelected[key],
    }));
  }, []);

  const handleCheckout = async () => { // Make this async
    const selectedItemsData = cartData.filter((item) => {
      const key = `${item.productId}-${
        item.variant?.variantId || "no-variant"
      }-${item.variant?.selectedOption?.optionId || "no-option"}`;
      return selectedItems[key];
    });

    if (selectedItemsData.length === 0) {
      toast.error("Please select at least one item to checkout.");
      return;
    }

    // --- Check for Out-of-Stock Items BEFORE Proceeding ---
    const outOfStockItem = selectedItemsData.find(item => {
        const stock = item.variant?.selectedOption?.optionStock ?? item.productStock ?? 0;
        return stock <= 0;
    });

    if (outOfStockItem) {
        toast.error(`The item "${outOfStockItem.productName}" is out of stock and cannot be checked out.`);
        return; // Stop the checkout process
    }
    // --- End Out-of-Stock Check ---

      setIsCheckingOut(true); // Set loading state
    try{
        // Calculate totalPrice and prepare items for checkout
        const selectedItemsWithTotal = selectedItemsData.map((item) => {
        const price =
            item.variant?.selectedOption?.optionPrice ?? item.productPrice ?? 0;
        const total = price * item.quantity;
        return {
            ...item,
            totalPrice: total,
        };
        });

        localStorage.removeItem("buyNowItem");
        localStorage.setItem("checkoutItems", JSON.stringify(selectedItemsWithTotal));
        navigate("/place-order");

    } catch (error){
        console.error("Error during checkout:", error)
        toast.error("An error occurred during checkout.")
    } finally {
      setIsCheckingOut(false);
    }

  };


  // Calculate the subtotal *only* for selected items.
  const selectedSubtotal = useMemo(() => {
    return cartData.reduce((total, item) => {
      const key = `${item.productId}-${
        item.variant?.variantId || "no-variant"
      }-${item.variant?.selectedOption?.optionId || "no-option"}`;
      if (selectedItems[key]) {
        return (
          total +
          (item.variant?.selectedOption?.optionPrice ?? item.productPrice ?? 0) *
            item.quantity
        );
      }
      return total;
    }, 0);
  }, [cartData, selectedItems, formatIDR]);


  return (
    <div className="min-h-screen bg-gray-100 p-4 overflow-y-auto">
      <div className="max-w-7xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-center mb-4 text-gray-700">
          <Title text1="Shopping" text2="Cart" />
        </h1>
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 space-y-4 w-full">
            {cartData.length > 0 ? (
              cartData.map((item) => {
                const key = `${item.productId}-${
                  item.variant?.variantId || "no-variant"
                }-${item.variant?.selectedOption?.optionId || "no-option"}`;
                return (
                  <CartItem
                    key={key}
                    item={item}
                    formatIDR={formatIDR}
                    handleQuantityChange={handleQuantityChange}
                    handleRemoveItem={handleRemoveItem}
                    isSelected={selectedItems[key] || false}
                    toggleSelect={() =>
                      toggleSelectItem(
                        item.productId,
                        item.variant?.variantId,
                        item.variant?.selectedOption?.optionId
                      )
                    }
                  />
                );
              })
            ) : (
              <p className="text-center text-gray-600">Your cart is empty.</p>
            )}
          </div>

            <div className="flex-none space-y-6 w-full lg:w-1/3">
            {/* --- Display Selected Subtotal --- */}
            <div className="p-6 bg-gray-50 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-4">Cart Totals</h3>
                <div className="space-y-4 text-sm">
                    <div className="flex justify-between">
                        <span>SubTotal Pesanan</span>
                        {/* Use selectedSubtotal here */}
                        <span>{formatIDR(selectedSubtotal)}</span>
                    </div>
                </div>
            </div>
            {/* --- End Selected Subtotal --- */}
            <button
              className="w-full py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition duration-300 disabled:bg-purple-300 disabled:cursor-not-allowed"
              onClick={handleCheckout}
              disabled={isCheckingOut}  // Disable during checkout
            >
              {isCheckingOut ? (
                <>
                  <Loader2Icon className="animate-spin h-5 w-5 mr-2 inline-block" />
                  Checking out...
                </>
              ) : (
                "Checkout"
              )}
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


// --- components/CartItem.jsx ---
const CartItem = React.memo(
  ({ item, formatIDR, handleQuantityChange, handleRemoveItem, isSelected, toggleSelect }) => {
    const optionStock = item.variant?.selectedOption?.optionStock ?? item.productStock ?? 0;
    const itemPrice = item.variant?.selectedOption?.optionPrice ?? item.productPrice ?? 0;
    const totalPrice = itemPrice * item.quantity; // No longer needed here

    const [localQuantity, setLocalQuantity] = useState(item.quantity);

    // Keep local quantity in sync with item quantity
    useEffect(() => {
      setLocalQuantity(item.quantity);
    }, [item.quantity]);

    const debounce = (func, delay) => {
      let timeoutId;
      return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          func(...args);
        }, delay);
      };
    };

    // Debounced quantity change handler
    const debouncedHandleQuantityChange = useCallback(
      debounce((productId, variantId, optionId, newQuantity) => {
          if (newQuantity > optionStock) {
              alert('Melebihi stok yang ada.');
              setLocalQuantity(optionStock);
              return
          }
        handleQuantityChange(productId, variantId, optionId, newQuantity);
      }, 300),
      [handleQuantityChange, optionStock]
    );

    const handleQuantityInputChange = (e) => {
      const newValue = parseInt(e.target.value, 10);
      if (!isNaN(newValue)) {
        setLocalQuantity(newValue);  // Update local state immediately
        debouncedHandleQuantityChange(item.productId, item.variant?.variantId, item.variant?.selectedOption?.optionId, newValue);
      } else {
        // Handle NaN case (e.g., empty input), set quantity to 1, or keep the previous value
        setLocalQuantity(1);
        debouncedHandleQuantityChange(item.productId, item.variant?.variantId, item.variant?.selectedOption?.optionId, 1);
      }
    };

    return (
      <div
        className={`relative flex flex-col sm:flex-row justify-between items-center py-4 border-b border-gray-300 w-full  rounded-md p-4 ${
          optionStock <= 0 ? "opacity-50" : "bg-gray-50"
        }`}
      >
        <div className="absolute top-2 left-2">
          <label>
            <input
              type="checkbox"
              checked={isSelected}
              onChange={toggleSelect}
              className="form-checkbox h-5 w-5 text-blue-600"
              disabled={optionStock <= 0} // Disable checkbox if out of stock
            />
            <span className="sr-only">Select item</span>
            {isSelected ? (
              <CheckCircle2
                className="absolute top-0 left-0 h-5 w-5 text-blue-600 pointer-events-none"
              />
            ) : null}
          </label>
        </div>
        <button
          className="absolute top-2 right-2 text-red-500 hover:text-red-700"
          onClick={() =>
            handleRemoveItem(
              item.productId,
              item.variant?.variantId,
              item.variant?.selectedOption?.optionId
            )
          }
        >
          <span className="sr-only">Remove item</span>
          <Trash2Icon className="w-5 h-5" />
        </button>

        <div className="flex gap-4 w-full">
          <img
            src={item.productImages[0]}
            alt={item.productName}
            className="w-36 h-36 object-cover rounded-lg"
          />
          <div className="flex-1 space-y-2">
            <p className="text-lg font-semibold">{item.productName}</p>
            {item.variant && item.variant.selectedOption && (
              <p className="text-sm text-gray-600">
                {item.variant.variantName} -{" "}
                {item.variant.selectedOption.optionName}
              </p>
            )}
            <p className="text-sm text-gray-600">
              Category: {item.productCategory || "No Category"} <br />
              Subcategory: {item.productSubCategory || "No Subcategory"}
            </p>
            <p className="text-lg font-bold">{formatIDR(itemPrice)}</p>{" "}
            {/* Use itemPrice */}
            <div className="flex gap-4 items-center">
              <button
                className="px-3 py-1 text-sm border rounded-md bg-gray-200 hover:bg-gray-300"
                onClick={() => {
                    const newQuantity = Math.max(1, localQuantity - 1); // Ensure quantity doesn't go below 1
                    setLocalQuantity(newQuantity); // Update local state *immediately*
                    debouncedHandleQuantityChange(item.productId, item.variant?.variantId, item.variant?.selectedOption?.optionId, newQuantity);
                }}

                disabled={item.quantity <= 1}
              >
                -
              </button>
              <input
                type="number"
                value={localQuantity} // Use localQuantity
                onChange={handleQuantityInputChange}
                className="w-16 text-center py-1 border rounded-md"
                min="1"
                max={optionStock} // Use optionStock for max
              />
              <button
                className="px-3 py-1 text-sm border rounded-md bg-gray-200 hover:bg-gray-300"
                onClick={() => {
                    const newQuantity = Math.min(optionStock, localQuantity + 1); // Ensure quantity doesn't exceed stock
                    setLocalQuantity(newQuantity); // Update local state *immediately*
                    debouncedHandleQuantityChange(item.productId, item.variant?.variantId, item.variant?.selectedOption?.optionId, newQuantity);

                }}
                disabled={item.quantity >= optionStock}
              >
                +
              </button>
            </div>
            <p className="text-sm text-gray-600">Stock: {optionStock}</p>
            <p className="text-sm text-gray-600 mt-2">
            Total: {formatIDR(totalPrice)}
            </p>
          </div>
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Only re-render if relevant props change
    return (
      prevProps.item.quantity === nextProps.item.quantity &&
      prevProps.item.variant?.selectedOption?.optionPrice ===
        nextProps.item.variant?.selectedOption?.optionPrice &&
      prevProps.item.productPrice === nextProps.item.productPrice &&
      prevProps.item.productStock === nextProps.item.productStock && // Bandingkan stock
      prevProps.item.variant?.selectedOption?.optionStock ===
        nextProps.item.variant?.selectedOption?.optionStock && //Bandingkan stock
      prevProps.isSelected === nextProps.isSelected // Re-render jika selection berubah
    );
  }
);

export default Cart;