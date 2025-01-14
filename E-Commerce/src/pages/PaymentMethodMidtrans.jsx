import React, { useContext } from "react";
import axios from "axios";
import { ShopContext } from "../context/ShopContext";

const PaymentMethodMidtrans = ({ totalAmount, orderData }) => {
  const { backendUrl, token } = useContext(ShopContext);

  const handleMidtransPayment = async () => {
    try {
      if (!orderData || !totalPrice) {
        console.error("Order data or total amount is missing.");
        return;
      }

      console.log("Sending order data to backend:", orderData);

      const response = await axios.post(
        `${backendUrl}/api/order/midtrans`,
        orderData,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.token) {
        console.log("Midtrans token received:", response.data.token);

        window.snap.pay(response.data.token, {
          onSuccess: (result) => {
            console.log("Payment successful:", result);
            // Redirect or show success message
          },
          onPending: (result) => {
            console.log("Payment pending:", result);
            // Show pending message
          },
          onError: (result) => {
            console.error("Payment error:", result);
            // Show error message
          },
          onClose: () => {
            console.log("Payment popup closed");
            // Show closed message
          },
        });
      } else {
        console.error("Token not received from backend.");
      }
    } catch (error) {
      console.error("Midtrans payment error:", error.response?.data || error.message);
      // Show error message
    }
  };

  return (
    <div className="mt-4">
      <button
        onClick={handleMidtransPayment}
        className="w-full py-2 bg-teal-500 text-white font-semibold rounded-md hover:bg-teal-600 transition duration-300"
      >
        Pay with Midtrans
      </button>
    </div>
  );
};

export default PaymentMethodMidtrans;
