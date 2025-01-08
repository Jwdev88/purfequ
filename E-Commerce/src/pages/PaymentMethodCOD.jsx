import React from 'react';
import { Box, Radio, RadioGroup, Stack } from "@chakra-ui/react";

const PaymentMethodCOD = ({ selectedMethod, setSelectedMethod }) => {
  return (
    <Box>
      <RadioGroup value={selectedMethod} onChange={setSelectedMethod}>
        <Stack direction="column">
          <Radio value="cod">Cash on Delivery (COD)</Radio>
        </Stack>
      </RadioGroup>
    </Box>
  );
};

export default PaymentMethodCOD;
