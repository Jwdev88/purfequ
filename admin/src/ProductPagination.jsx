import React from "react";
import {
  Box,
  Button,
  Flex,
  Heading,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
const ProductPagination = ({ currentPage, totalPages, onPageChange }) => {
  return (
    <Flex justify="center" align="center" mt={4}>
      <Button
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        Previous
      </Button>
      <Text mx={2}>
        Page {currentPage} of {totalPages}
      </Text>
      <Button
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Next
      </Button>
    </Flex>
  );
};
export default ProductPagination