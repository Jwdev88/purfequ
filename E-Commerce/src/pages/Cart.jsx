// --- components/Cart.jsx ---
import React, { useContext, useMemo, useState, useCallback, useEffect } from "react"; // Tambah useState, useCallback
import { ShopContext } from "../context/ShopContext";
import Title from "../components/Title";
import { useCart } from "../hooks/useCart";
import { CheckCircle2 } from 'lucide-react';


const Cart = () => {
    const {
        cartItems,
        updateQuantity,
        removeItemFromCart,
        clearCart,
        formatIDR,
        navigate,
    } = useContext(ShopContext);


    // --- State untuk item yang dipilih ---
    const [selectedItems, setSelectedItems] = useState({}); // { [productId-variantId-optionId]: boolean }

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


  // --- Handle Checkout (dengan item yang dipilih) ---
// --- components/Cart.jsx (CORRECTED handleCheckout) ---

const handleCheckout = () => {
    const selectedItemsData = cartData.filter(item => {
        const key = `${item.productId}-${item.variant?.variantId || 'no-variant'}-${item.variant?.selectedOption?.optionId || 'no-option'}`;
        return selectedItems[key];
    });

    if (selectedItemsData.length === 0) {
        alert("Please select at least one item to checkout."); // Atau gunakan toast
        return;
    }

    // --- CORRECTED: Calculate and Add totalPrice BEFORE Saving ---
    const selectedItemsWithTotal = selectedItemsData.map(item => {
        const price = item.variant?.selectedOption?.optionPrice ?? item.productPrice ?? 0;
        const total = price * item.quantity;
        return {
            ...item,  // Copy existing item data
            totalPrice: total, // Add totalPrice  <--  IMPORTANT!
        };
    });
    // --- END Corrected Calculation ---

     // Clear buy now item
    localStorage.removeItem("buyNowItem");
    localStorage.setItem('checkoutItems', JSON.stringify(selectedItemsWithTotal)); // Save *with* totalPrice
    navigate('/place-order');
};



    // --- Toggle Selected Item ---
    const toggleSelectItem = useCallback((productId, variantId, optionId) => {
        const key = `${productId}-${variantId || 'no-variant'}-${optionId || 'no-option'}`;
        setSelectedItems(prevSelected => ({
            ...prevSelected,
            [key]: !prevSelected[key], // Toggle nilai boolean
        }));
    }, []);

    // --- Calculate Selected Subtotal (CORRECTED useMemo) ---
    const selectedSubtotal = useMemo(() => {
        return cartData.reduce((total, item) => {
            const key = `${item.productId}-${item.variant?.variantId || "no-variant"}-${item.variant?.selectedOption?.optionId || "no-option"}`;
            // Only add to the total if the item is selected
            if (selectedItems[key]) {
                return total + (item.variant?.selectedOption?.optionPrice ?? item.productPrice ?? 0) * item.quantity;
            }
            return total;
        }, 0);
    }, [cartData, selectedItems]); // Depend on BOTH cartData AND selectedItems

    // const memoizedCartTotal = useMemo(() => <CartTotal />, [cartData]); // No longer needed

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
                            cartData.map((item) => {
                                const key = `${item.productId}-${item.variant?.variantId || "no-variant"}-${item.variant?.selectedOption?.optionId || "no-option"}`;
                                return (
                                  <CartItem
                                    key={key}
                                    item={item}
                                    formatIDR={formatIDR}
                                    handleQuantityChange={handleQuantityChange}
                                    handleRemoveItem={handleRemoveItem}
                                    isSelected={selectedItems[key] || false} // Pass isSelected prop
                                    toggleSelect={() => toggleSelectItem(item.productId, item.variant?.variantId, item.variant?.selectedOption?.optionId)} // Pass toggle function
                                  />
                                );
                            })
                        ) : (
                            <p className="text-center text-gray-600">Keranjang Anda kosong.</p> // Pesan yang lebih baik
                        )}
                    </div>

                    {/* Cart Summary */}
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
                            className="w-full py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition duration-300"
                            onClick={handleCheckout} // Gunakan handleCheckout
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

// --- components/CartItem.jsx --- (Corrected)
const CartItem = React.memo(({ item, formatIDR, handleQuantityChange, handleRemoveItem, isSelected, toggleSelect }) => {
  // console.log("CartItem rendering. Item:", item); // VERY IMPORTANT DEBUG LOG

  const optionStock = item.variant?.selectedOption?.optionStock ?? item.productStock ?? 0;
  const itemPrice = item.variant?.selectedOption?.optionPrice ?? item.productPrice ?? 0;
  const totalPrice = itemPrice * item.quantity;

  // --- Debouncing and Local Quantity ---
  const [localQuantity, setLocalQuantity] = useState(item.quantity);

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
   const debouncedHandleQuantityChange = useCallback(
      debounce((productId, variantId, optionId, newQuantity) => {
        if (newQuantity > optionStock) {
              alert('Melebihi stok yang ada.')
              setLocalQuantity(optionStock)
              return; // Prevent updates if exceeding stock
          }
        if (newQuantity < 1) {
          alert("Kuantitas tidak boleh kurang dari 1.");
          setLocalQuantity(1); // Reset ke 1
          return
        }
          handleQuantityChange(productId, variantId, optionId, newQuantity);
      }, 300),
      [handleQuantityChange, optionStock] // optionStock is a dependency!
  );

  // --- Handle Quantity Input Change ---
  const handleQuantityInputChange = (e) => {
      const newValue = parseInt(e.target.value, 10);
      if (!isNaN(newValue)) {
        setLocalQuantity(newValue);
        debouncedHandleQuantityChange(item.productId, item.variant?.variantId, item.variant?.selectedOption?.optionId, newValue)
      } else {
         setLocalQuantity(1);
         debouncedHandleQuantityChange(item.productId, item.variant?.variantId, item.variant?.selectedOption?.optionId, 1);

      }
  };


  return (
      <div className="relative flex flex-col sm:flex-row justify-between items-center py-4 border-b border-gray-300 w-full bg-gray-50 rounded-md p-4">
          {/* Checkbox untuk memilih item */}
          <div className="absolute top-2 left-2">
            <label>
              <input
                type="checkbox"
                checked={isSelected}
                onChange={toggleSelect}
                className="form-checkbox h-5 w-5 text-blue-600"
              />
              <span className="sr-only">Select item</span>
              {isSelected ? (
                  <CheckCircle2 className="absolute top-0 left-0 h-5 w-5 text-blue-600 pointer-events-none" />
              ) : null}
            </label>
          </div>
          <button
              className="absolute top-2 right-2 text-red-500 hover:text-red-700"
              onClick={() => handleRemoveItem(item.productId, item.variant?.variantId, item.variant?.selectedOption?.optionId)}
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
                  src={item.productImages[0]} // Gunakan index 0
                  alt={item.productName}
                  className="w-36 h-36 object-cover rounded-lg"
              />
              <div className="flex-1 space-y-2">
                  <p className="text-lg font-semibold">{item.productName}</p>
                  {item.variant && item.variant.selectedOption && (
                      <p className="text-sm text-gray-600">
                          {item.variant.variantName} - {item.variant.selectedOption.optionName}
                      </p>
                  )}

                 <p className="text-sm text-gray-600">
                      Category: {item.productCategory || "No Category"} <br />  {/*Handle null/undefined category*/}
                      Subcategory: {item.productSubCategory || "No Subcategory"} {/*Handle null/undefined subcategory*/}
                  </p>
                  <p className="text-lg font-bold">
                      {formatIDR(itemPrice)} {/* Gunakan itemPrice */}
                  </p>

                  <div className="flex gap-4 items-center">
                       <button
                          className="px-3 py-1 text-sm border rounded-md bg-gray-200 hover:bg-gray-300"
                          onClick={() => {
                              const newQuantity = Math.max(1, localQuantity - 1); // Ensure quantity doesn't go below 1
                              setLocalQuantity(newQuantity);
                              debouncedHandleQuantityChange(item.productId, item.variant?.variantId, item.variant?.selectedOption?.optionId, newQuantity);
                          }}
                          disabled={item.quantity <= 1}
                          >
                          -
                      </button>
                      <input
                          type="number"
                          value={localQuantity}
                          onChange={handleQuantityInputChange}
                          className="w-16 text-center py-1 border rounded-md"
                          min="1"
                          max={optionStock}
                      />
                       <button
                          className="px-3 py-1 text-sm border rounded-md bg-gray-200 hover:bg-gray-300"
                          onClick={() => {
                              const newQuantity = Math.min(optionStock, localQuantity + 1); // Ensure quantity doesn't exceed stock
                              setLocalQuantity(newQuantity);
                              debouncedHandleQuantityChange(item.productId, item.variant?.variantId, item.variant?.selectedOption?.optionId, newQuantity);

                          }}
                          disabled={item.quantity >= optionStock}
                      >
                          +
                      </button>
                  </div>
                  <p className="text-sm text-gray-600">Stock: {optionStock}</p>
                  <p className="text-sm text-gray-600 mt-2">Total: {formatIDR(totalPrice)}</p> {/* Gunakan totalPrice */}
              </div>
          </div>
      </div>
  );
}, (prevProps, nextProps) => {
// Only re-render if relevant props change
  return (
      prevProps.item.quantity === nextProps.item.quantity &&
      prevProps.item.variant?.selectedOption?.optionPrice === nextProps.item.variant?.selectedOption?.optionPrice &&
      prevProps.item.productPrice === nextProps.item.productPrice &&
      prevProps.item.productStock === nextProps.item.productStock && // Bandingkan stock
      prevProps.item.variant?.selectedOption?.optionStock === nextProps.item.variant?.selectedOption?.optionStock && //Bandingkan stock
      prevProps.isSelected === nextProps.isSelected // Re-render jika selection berubah
  );
});

export default Cart;