import React from "react";

const PaymentMethodMidtrans = ({ selectedMethod, setSelectedMethod }) => {
  return (
    <div className="mt-4">
      <button
        onClick={() => setSelectedMethod("midtrans")}
        className={`w-full py-2 bg-teal-500 text-white font-semibold rounded-md hover:bg-teal-600 transition duration-300 ${
          selectedMethod === "midtrans"? "bg-teal-600": ""
        }`}
      >
        Pay with Midtrans
      </button>
    </div>
  );
};

export default PaymentMethodMidtrans;