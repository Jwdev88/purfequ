import React,{useContext} from 'react';
import { Box, Button } from "@chakra-ui/react";
import axios from 'axios';
import { ShopContext } from "../context/ShopContext";
const PaymentMethodMidtrans = ({ selectedMethod, setSelectedMethod, totalAmount, orderData }) => {
  const {  backendUrl,token } = useContext(ShopContext);
  const handleMidtransPayment = async () => {
    try {
      const response = await axios.post(`${backendUrl}/api/order/midtrans`, orderData, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        }
      });

      // Handle Midtrans response
      if (response.data.token) {
        window.snap.pay(response.data.token, {
          onSuccess: (result) => {
            console.log('Payment successful:', result);
            // Redirect or show success message
          },
          onPending: (result) => {
            console.log('Payment pending:', result);
            // Show pending message
          },
          onError: (result) => {
            console.error('Payment error:', result);
            // Show error message
          },
          onClose: () => {
            console.log('Payment popup closed');
            // Show closed message
          }
        });
      }
    } catch (error) {
      console.error('Midtrans payment error:', error);
      // Handle error
    }
  };

  return (
    <Box>
      <Button onClick={handleMidtransPayment}>Pay with Midtrans</Button>
    </Box>
  );
};

export default PaymentMethodMidtrans;
