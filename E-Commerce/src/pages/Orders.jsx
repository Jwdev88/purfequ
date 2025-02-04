import React, { useContext, useEffect, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import axios from "axios";
import { Loader } from "lucide-react";

const Orders = () => {
  const { backendUrl, token, formatIDR } = useContext(ShopContext);
  const [orderData, setOrderData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const calculateTotal = (items, shippingCost) => {
    const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0);
    return subtotal + shippingCost;
  };
  const loadOrderData = async () => {
    try {
      if (!token) {
        setError("Tidak ada token yang diberikan");
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
        setError("Gagal mengambil data order");
      }
    } catch (error) {
      setError("Terjadi kesalahan saat mengambil data order");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrderData();
  }, [token]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8 text-xl">
        <Loader className="animate-spin w-8 h-8" /> Sedang memuat...
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-600 py-8">{error}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {orderData.length > 0 ? (
        <div className="max-h-[70vh] overflow-y-auto p-2 border rounded-lg shadow-sm bg-gray-50">
          {orderData.map((order) => (
            <div key={order._id} className="bg-white shadow-md rounded-lg p-6 mb-6">
              <h2 className="text-2xl font-semibold">ID Order: {order._id}</h2>
              <div className="mt-2 text-gray-700">
                <p>Status: <span className="font-semibold">{order.status}</span></p>
                <p>Metode Pembayaran: {order.paymentMethod}</p>
                <p className="text-gray-700">Subtotal: {formatIDR(calculateTotal(order.items, 0))}</p>
                <p>Biaya Pengiriman: {formatIDR(order.ongkir)}</p>
                <p className="text-gray-700 font-semibold">Total Order: {formatIDR(calculateTotal(order.items, order.ongkir))}</p>
                <p className="text-sm text-gray-500">Tanggal Order: {new Date(order.date).toLocaleDateString("id-ID", {
                  weekday: "long", year: "numeric", month: "long", day: "numeric"
                })}</p>
              </div>

              <button
                className="mt-4 w-full bg-gray-200 hover:bg-gray-300 p-3 rounded-lg font-semibold transition"
                onClick={() => setExpandedOrder(expandedOrder === order._id ? null : order._id)}
              >
                {expandedOrder === order._id ? "Sembunyikan Item Order" : "Tampilkan Item Order"}
              </button>

              {expandedOrder === order._id && (
                <div className="mt-4 bg-gray-100 p-4 rounded-lg shadow-inner max-h-60 overflow-y-auto">
                  <h3 className="text-xl font-semibold mb-4">Item yang Dipesan</h3>
                  {order.items.map((item, index) => (
                    <div key={index} className="flex gap-4 items-center p-3 border rounded-lg bg-white shadow-sm">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-20 h-20 object-cover rounded-md"
                      />
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg">{item.name}</h4>
                        <p>Jumlah: {item.quantity}</p>
                        <p>Harga: {formatIDR(item.price)}</p>
                        <p>Variant: {item.variant?.name || "Tidak ada"} </p>
                        {item.variant && item.variant.selectedOption && (
                        <>
                          <p className="text-gray-700">
                            Variant: {item.variant.variantName}
                          </p>
                          <p className="text-gray-700">
                            Opsi: {item.variant.selectedOption.optionName}
                          </p>
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
        <p className="text-center text-xl">Tidak ada order yang ditemukan.</p>
      )}
    </div>
  );
};

export default Orders;
