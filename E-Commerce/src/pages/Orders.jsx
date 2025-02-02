import React, { useContext, useEffect, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import axios from "axios";

const Orders = () => {
  const { backendUrl, token, currency } = useContext(ShopContext);
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrderItem, setSelectedOrderItem] = useState(null);  // Untuk menyimpan item yang diklik

  const loadOrderData = async () => {
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
        setError("Failed to fetch orders");
      }
    } catch (error) {
      setError("Error fetching order data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrderData();
  }, [token]);

  if (loading) {
    return <div className="flex justify-center items-center py-8 text-xl">Loading...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center py-8 text-xl text-red-600">{error}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {orderData && orderData.length > 0 ? (
        orderData.map((order) => (
          <div key={order._id} className="bg-white shadow-lg rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">Order ID: {order._id}</h2>

            {/* Order Address */}
            <div className="mb-6">
              <h3 className="text-xl font-semibold">Address</h3>
              <p>{order.address.firstName} {order.address.lastName}</p>
              <p>{order.address.address}</p>
              <p>{order.address.city}, {order.address.province}</p>
              <p>Phone: {order.address.phone}</p>
              <p>Email: {order.address.email}</p>
            </div>

            {/* Order Status and Payment Info */}
            <div className="mb-6">
              <h3 className="text-xl font-semibold">Order Status</h3>
              <p className="text-gray-700">Status: {order.status}</p>
              <p className="text-gray-700">Payment Method: {order.paymentMethod}</p>
              <p className="text-gray-700">Total Amount: {currency} {order.amount}</p>
            </div>

            {/* Order Items */}
            <div className="mb-4">
              <h3 className="text-xl font-semibold mb-4">Items Ordered</h3>
              <div className="max-h-80 overflow-y-auto">
                {order.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex mb-4 p-4 border rounded-lg bg-gray-50 shadow-sm cursor-pointer hover:bg-gray-200"
                    onClick={() => setSelectedOrderItem(item)}  // Mengatur item yang dipilih
                  >
                    {/* Menampilkan hanya satu gambar */}
                    <div className="flex-shrink-0">
                      {item.productImages && item.productImages.length > 0 && (
                        <img
                          src={item.productImages[0]}  // Menampilkan gambar pertama
                          alt={item.productName}
                          className="w-24 h-24 object-cover rounded-md"
                        />
                      )}
                    </div>

                    {/* Informasi item */}
                    <div className="ml-4 flex-1">
                      <h4 className="font-semibold text-lg">{item.productName}</h4>
                      <p className="text-gray-700">Quantity: {item.quantity}</p>
                      <p className="text-gray-700">Price: {currency} {item.price}</p>
                      {item.variant && item.variant.selectedOption && (
                        <>
                          <p className="text-gray-700">Variant: {item.variant.variantName}</p>
                          <p className="text-gray-700">Option: {item.variant.selectedOption.optionName}</p>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Menampilkan detail item yang dipilih */}
            {selectedOrderItem && (
              <div className="mt-6 p-4 border rounded-lg bg-gray-50 shadow-sm">
                <h4 className="text-xl font-semibold">Selected Item Details</h4>
                <div className="flex">
                  <img
                    src={selectedOrderItem.productImages[0]}  // Menampilkan gambar pertama
                    alt={selectedOrderItem.productName}
                    className="w-32 h-32 object-cover rounded-md"
                  />
                  <div className="ml-4">
                    <h5 className="text-lg font-semibold">{selectedOrderItem.productName}</h5>
                    <p>Quantity: {selectedOrderItem.quantity}</p>
                    <p>Price: {currency} {selectedOrderItem.price}</p>
                    {selectedOrderItem.variant && selectedOrderItem.variant.selectedOption && (
                      <>
                        <p>Variant: {selectedOrderItem.variant.variantName}</p>
                        <p>Option: {selectedOrderItem.variant.selectedOption.optionName}</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))
      ) : (
        <p className="text-center text-xl">No orders found.</p>
      )}
    </div>
  );
};

export default Orders;
