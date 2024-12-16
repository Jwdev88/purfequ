import React, { useState, useCallback, useEffect } from "react";
import { Box, Button, HStack, Input } from "@chakra-ui/react";
import axios from "axios";
import { backendURI } from "../../App";
// Debounce function to optimize input handling
const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// Option component for modularity
const Option = ({
  option,
  optionIndex,
  variantIndex,
  handleOptionChange,
  removeOption,
}) => (
  <HStack key={option.id} spacing={3} mb={2}>
    <Input
      value={option.name}
      onChange={(e) =>
        handleOptionChange(variantIndex, optionIndex, "name", e.target.value)
      }
      placeholder="Option Name (e.g., Red, Large)"
    />
    <Input
      type="number"
      value={option.stock}
      onChange={(e) =>
        handleOptionChange(variantIndex, optionIndex, "stock", e.target.value)
      }
      placeholder="Stock"
    />
    <Input
      type="number"
      value={option.price}
      onChange={(e) =>
        handleOptionChange(variantIndex, optionIndex, "price", e.target.value)
      }
      placeholder="Price"
    />
    <Input
      type="number"
      value={option.weight}
      onChange={(e) =>
        handleOptionChange(variantIndex, optionIndex, "weight", e.target.value)
      }
      placeholder="Weight (gram)"
    />
    <Input
      value={option.sku}
      onChange={(e) =>
        handleOptionChange(variantIndex, optionIndex, "sku", e.target.value)
      }
      placeholder="SKU"
    />
    <Button
      colorScheme="red"
      onClick={() => removeOption(variantIndex, optionIndex)}
    >
      Remove Option
    </Button>
  </HStack>
);

const VariantsManager = ({ productId }) => {
  const [newVariant, setNewVariant] = useState({ name: "", options: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [variants, setVariants] = useState([]);

  // useEffect(() => {
  //   fetchVariants();
  // }, [productId]);

  // const fetchVariants = async () => {
  //   try {
  //     setLoading(true);
  //     const response = await axios.get(`${backendURI}/api/product/${productId}/variants`,
  //       { headers: { token } });
  //     setVariants(response.data);
  //   } catch (err) {
  //     setError("Failed to fetch variants");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handleVariantChange = useCallback(
    (index, field, value) => {
      const newVariants = [...variants];
      newVariants[index][field] = value;
      setVariants(newVariants);
    },
    [variants]
  );

  const handleOptionChange = (variantIndex, optionIndex, field, value) => {
    if (
      variantIndex === undefined ||
      optionIndex === undefined ||
      field === undefined
    ) {
      console.error("handleOptionChange: Missing required parameters.");
      return;
    }

    const newVariants = [...variants];

    if (
      !newVariants[variantIndex] ||
      !newVariants[variantIndex].options ||
      !newVariants[variantIndex].options[optionIndex]
    ) {
      console.error("handleOptionChange: Invalid variant or option index.");
      return;
    }

    if (field === "stock" || field === "price" || field === "weight") {
      const numericValue = parseFloat(value);
      if (isNaN(numericValue) || numericValue < 0) {
        console.error("handleOptionChange: Invalid numeric value.");
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

  // const handleAddVariant = async () => {
  //   try {
  //     setLoading(true);
  //     const response = await axios.post(
  //       `${backendURI}/api/product/add/`,
  //       newVariant
  //     );
  //     setVariants([...variants, response.data]);
  //     setNewVariant({ name: "", options: [] }); // Reset form
  //   } catch (err) {
  //     setError("Failed to add variant");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handleUpdateVariant = async (variantId, updatedData) => {
    try {
      setLoading(true);
      const response = await axios.put(
        `${backendURI}/api/product/${productId}/variants/${variantId}`,
        updatedData
      );
      setVariants(
        variants.map((v) => (v._id === variantId ? response.data : v))
      );
    } catch (err) {
      setError("Failed to update variant");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVariant = async (variantId) => {
    try {
      setLoading(true);
      await axios.delete(`${backendURI}/api/product/${productId}/variants/${variantId}`);
      setVariants(variants.filter((v) => v._id !== variantId));
    } catch (err) {
      setError("Failed to delete variant");
    } finally {
      setLoading(false);
    }
  };

  const debouncedHandleVariantChange = debounce(handleVariantChange, 300);

  return (
    <div>
      <div>
        {loading && <p>Loading...</p>}
        {error && <p>{error}</p>}
      </div>
      {variants.map((variant, index) => (
        <Box key={variant.id} borderWidth="1px" borderRadius="md" p={4} mb={4}>
          <Input
            value={variant.name}
            onChange={(e) =>
              debouncedHandleVariantChange(index, "name", e.target.value)
            }
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
      <Button colorScheme="blue">
        Add Variant
      </Button>
    </div>
  );
};

export default VariantsManager;