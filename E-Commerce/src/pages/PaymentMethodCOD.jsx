import React from 'react';

const PaymentMethodCOD = ({ selectedMethod, setSelectedMethod }) => {
  return (
    <div>
      <div className="space-y-2">
        <input
          type="radio"
          id="cod"
          name="paymentMethod"
          value="cod"
          checked={selectedMethod === "cod"}
          onChange={() => setSelectedMethod("cod")}
          className="mr-2"
        />
        <label htmlFor="cod" className="text-sm font-semibold">
          Cash on Delivery (COD)
        </label>
      </div>
    </div>
  );
};

export default PaymentMethodCOD;
