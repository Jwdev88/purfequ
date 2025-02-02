import React from "react";

const PaymentMethodCOD = ({ selectedMethod, setSelectedMethod }) => {
  return (
    <div className="mt-4">
      <button
        onClick={() => setSelectedMethod("cod")}
        className={`w-full py-2 bg-teal-500 text-white font-semibold rounded-md hover:bg-teal-600 transition duration-300 ${
          selectedMethod === "cod"? "bg-teal-600": ""
        }`}
      >
        Cash on Delivery (COD)
      </button>
    </div>
  );
};

export default PaymentMethodCOD;