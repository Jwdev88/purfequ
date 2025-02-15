// --- components/Orders.js ---
import React, { useContext, useEffect, useState, useCallback } from "react";
import { ShopContext } from "../context/ShopContext";
import axios from "axios";
import { Loader2Icon as Loader } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { toast } from "react-toastify";

const Orders = () => {
    const { backendUrl, token, formatIDR } = useContext(ShopContext);
    const [orderData, setOrderData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedOrder, setExpandedOrder] = useState(null);
    const navigate = useNavigate();

    // --- Calculate Total ---
    const calculateTotal = (items, shippingCost) => {
        const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0);
        return subtotal + shippingCost;
    };

     // --- Load Order Data (now a useCallback) ---
    const loadOrderData = useCallback(async () => {
        try {
            if (!token) {
                setError("No token provided");
                return;
            }

            const response = await axios.post(
                `${backendUrl}/api/order/userorders`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                setOrderData(response.data.orders);
            } else {
                setError("Failed to fetch order data");
            }
        } catch (error) {
            console.error("Error fetching orders:", error);
            setError("An error occurred while fetching order data");
        } finally {
            setLoading(false);
        }
    }, [backendUrl, token]); // Dependencies for useCallback

    // --- Attempt Repayment (now a useCallback) ---
    const attemptRepayment = useCallback(async (orderId, midtransToken) => {
        if (!window.snap) {
            console.error("Snap.js is not loaded");
            toast.error("Payment system is not available.");
            return;
        }

        try {
            window.snap.pay(midtransToken, {
                onSuccess: (result) => {
                    toast.success("Payment successful!");
                    localStorage.removeItem('orderId');
                    loadOrderData(); // Re-fetch orders  <--- IMPORTANT
                    navigate('/orders');
                },
                onPending: (result) => {
                    toast.info("Payment pending. Please check your order status.");
                    localStorage.removeItem('orderId');
                    loadOrderData();  // Re-fetch orders  <--- IMPORTANT
                    navigate('/orders');
                },
                onError: (result) => {
                    toast.error("Payment failed!");
                    // No navigation on error; allow retry
                },
                onClose: () => {
                    toast.warn("Payment window closed.");
                    navigate(`/orders`);  // Stay on /orders
                }
            });
        } catch (error) {
            console.error("Error re-attempting payment:", error);
            toast.error("Failed to re-attempt payment.");
        }
    }, [navigate, loadOrderData]); // Add loadOrderData to dependencies

      // --- useEffect for Initial Load and Polling ---
    useEffect(() => {
        loadOrderData(); // Initial fetch

        const queryParams = new URLSearchParams(window.location.search);
        const urlOrderId = queryParams.get('orderId');
        if (urlOrderId) {
          navigate('/orders', { replace: true });
        }

        // Polling: Re-fetch data every 5 seconds (adjust as needed)
        const intervalId = setInterval(() => {
            loadOrderData();
        }, 5000); // 5000 milliseconds = 5 seconds

        // Cleanup function: Clear the interval when the component unmounts
        return () => clearInterval(intervalId);
    }, [loadOrderData, navigate]); // Depend on loadOrderData (which is now memoized)


    if (loading) {
        return (
            <div className="flex justify-center items-center py-8 text-xl">
                <Loader className="animate-spin w-8 h-8" /> Loading...
            </div>
        );
    }

    if (error) {
        return <div className="text-center text-red-600 py-8">{error}</div>;
    }
     // --- Main Render ---
  return (
    <div className="container mx-auto px-4 py-8">
      {orderData.length > 0 ? (
        <div className="max-h-[70vh] overflow-y-auto p-2 border rounded-lg shadow-sm bg-gray-50">
          {orderData.map((order) => (
            <div key={order._id} className="bg-white shadow-md rounded-lg p-6 mb-6">
              <h2 className="text-2xl font-semibold">Order ID: {order.orderId || order._id}</h2>
              <div className="mt-2 text-gray-700">
                <p>
                  Status:{" "}
                  <span className="font-semibold">
                    {/* Improved Status Display */}
                    {order.status === "paid"
                      ? "Paid"
                      : order.status === "pending"
                      ? "Pending Payment"
                      : order.status === "failed"
                      ? "Payment Failed"
                      : order.status === 'Order Received'
                      ? 'Order Received'
                      :  order.status === 'Packing'
                      ? 'Packing'
                      : order.status === 'In Transit'
                      ? 'In Transit'
                      : order.status === 'Delivered'
                      ? 'Delivered'
                      : order.status}
                  </span>
                </p>
                <p>Payment Method: {order.paymentMethod}</p>

                {/* Display Payment Type and VA Number */}
                {order.paymentType && (
                    <p>Payment Type: {order.paymentType}</p>
                )}
                {order.vaNumber && (
                    <p>
                        VA Number ({order.bank.toUpperCase()}): {order.vaNumber}
                    </p>
                )}
                <p className="text-gray-700">
                  Subtotal: {formatIDR(calculateTotal(order.items, 0))}
                </p>
                <p>Shipping Cost: {formatIDR(order.ongkir)}</p>
                <p className="text-gray-700 font-semibold">
                  Total Order: {formatIDR(calculateTotal(order.items, order.ongkir))}
                </p>
                 {/* Display Notes and Tracking Number */}
                {order.notes && <p>Notes: {order.notes}</p>}
                {order.trackingNumber && <p>Tracking Number: {order.trackingNumber}</p>}
                <p className="text-sm text-gray-500">
                  Order Date:{" "}
                  {new Date(order.date).toLocaleDateString("id-ID", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
                 {/* Conditionally render the "Retry Payment" button */}
                {order.status === 'pending' && order.transactionToken && (
                    <button
                        onClick={() => attemptRepayment(order.orderId, order.transactionToken)}
                        className="mt-4 w-full bg-blue-500 hover:bg-blue-700 text-white p-3 rounded-lg font-semibold transition"
                    >
                        Retry Payment
                    </button>
                )}
              </div>

              <button
                className="mt-4 w-full bg-gray-200 hover:bg-gray-300 p-3 rounded-lg font-semibold transition"
                onClick={() =>
                  setExpandedOrder(expandedOrder === order._id ? null : order._id)
                }
              >
                {expandedOrder === order._id
                  ? "Hide Order Items"
                  : "Show Order Items"}
              </button>

              {expandedOrder === order._id && (
                <div className="mt-4 bg-gray-100 p-4 rounded-lg shadow-inner max-h-60 overflow-y-auto">
                  <h3 className="text-xl font-semibold mb-4">Ordered Items</h3>
                  {order.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex gap-4 items-center p-3 border rounded-lg bg-white shadow-sm"
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-20 h-20 object-cover rounded-md"
                      />
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg">{item.name}</h4>
                        <p>Quantity: {item.quantity}</p>
                        <p>Price: {formatIDR(item.price)}</p>
                        {/* Display variant details correctly */}
                        {item.variant && (
                        <>
                          <p>Variant: {item.variant.variantName}</p>
                          {item.variant.selectedOption && (
                            <p>Option: {item.variant.selectedOption.optionName}</p>
                          )}
                        </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-xl">No orders found.</p>
      )}
    </div>
    );
};

export default Orders;