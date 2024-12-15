import React, { useState, useCallback } from 'react';
import { Box, Button, HStack, Input } from '@chakra-ui/react';

// Debounce function to optimize input handling
const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// Option component for modularity
const Option = ({ option, optionIndex, variantIndex, handleOptionChange, removeOption }) => (
  <HStack key={option.id} spacing={3} mb={2}>
    <Input
      value={option.name}
      onChange={(e) => handleOptionChange(variantIndex, optionIndex, 'name', e.target.value)}
      placeholder="Option Name (e.g., Red, Large)"
    />
    <Input
      type="number"
      value={option.stock}
      onChange={(e) => handleOptionChange(variantIndex, optionIndex, 'stock', e.target.value)}
      placeholder="Stock"
    />
    <Input
      type="number"
      value={option.price}
      onChange={(e) => handleOptionChange(variantIndex, optionIndex, 'price', e.target.value)}
      placeholder="Price"
    />
    <Input
      type="number"
      value={option.weight}
      onChange={(e) => handleOptionChange(variantIndex, optionIndex, 'weight', e.target.value)}
      placeholder="Weight (gram)"
    />
    <Input
      value={option.sku}
      onChange={(e) => handleOptionChange(variantIndex, optionIndex, 'sku', e.target.value)}
      placeholder="SKU"
    />
    <Button colorScheme="red" onClick={() => removeOption(variantIndex, optionIndex)}>
      Remove Option
    </Button>
  </HStack>
);

const VariantsManager = () => {
  const [variants, setVariants] = useState([
    // Example initial state
    { id: 'variant1', name: '', options: [{ id: 'option1', name: '', stock: 0, price: 0, weight: 0, sku: '' }] },
  ]);

  const handleVariantChange = useCallback((index, field, value) => {
    const newVariants = [...variants];
    newVariants[index][field] = value;
    setVariants(newVariants);
  }, [variants]);

  const handleOptionChange = (variantIndex, optionIndex, field, value) => {
    if (variantIndex === undefined || optionIndex === undefined || field === undefined) {
      console.error('handleOptionChange: Missing required parameters.');
      return;
    }

    const newVariants = [...variants];

    if (!newVariants[variantIndex] || !newVariants[variantIndex].options || !newVariants[variantIndex].options[optionIndex]) {
      console.error('handleOptionChange: Invalid variant or option index.');
      return;
    }

    if (field === 'stock' || field === 'price' || field === 'weight') {
      const numericValue = parseFloat(value);
      if (isNaN(numericValue) || numericValue < 0) {
        console.error('handleOptionChange: Invalid numeric value.');
        return;
      }
      value = numericValue;
    }

    newVariants[variantIndex].options[optionIndex][field] = value;
    setVariants(newVariants);
  };

  const removeOption = (variantIndex, optionIndex) => {
    const newVariants = [...variants];
    newVariants[variantIndex].options.splice(optionIndex, 1);
    setVariants(newVariants);
  };

  const debouncedHandleVariantChange = debounce(handleVariantChange, 300);

  return (
    <div>
      {variants.map((variant, index) => (
        <Box key={variant.id} borderWidth="1px" borderRadius="md" p={4} mb={4}>
          <Input
            value={variant.name}
            onChange={(e) => debouncedHandleVariantChange(index, 'name', e.target.value)}
            placeholder="e.g., Color, Size"
          />
          {variant.options.map((option, optionIndex) => (
            <Option
              key={option.id}
              option={option}
              optionIndex={optionIndex}
              variantIndex={index}
              handleOptionChange={handleOptionChange}
              removeOption={removeOption}
            />
          ))}
        </Box>
      ))}
    </div>
  );
};

export default VariantsManager;