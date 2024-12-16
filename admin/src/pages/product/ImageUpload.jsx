import React, { useState } from "react";
import {
  Box,
  Flex,
  FormControl,
  FormLabel,
  Image,
  Input,
  Text,
  Icon,
  FormErrorMessage,
} from "@chakra-ui/react";
import { FaUpload } from "react-icons/fa";

const ImageUpload = ({ uploadedImages, imageErrors, handleImageChange }) => {
  return (
    <FormControl mb={4} isInvalid={imageErrors.some(Boolean)}>
      <FormLabel>Upload Images</FormLabel>
      <Flex gap={4} wrap="wrap">
        {uploadedImages.map((image, index) => (
          <Box key={index} position="relative" width="96px" height="96px">
            <Image
              src={image.preview}
              alt={`Uploaded ${index}`}
              width="100%"
              height="100%"
              objectFit="cover"
              borderRadius="md"
            />
            {imageErrors[index] && (
              <Text color="red.500" fontSize="sm" position="absolute" bottom="0">
                {imageErrors[index]}
              </Text>
            )}
          </Box>
        ))}
        <Box position="relative" cursor="pointer">
          <label>
            <Flex
              justifyContent="center"
              alignItems="center"
              width="96px"
              height="96px"
              borderWidth={2}
              borderStyle="dashed"
              borderColor="gray.300"
              borderRadius="md"
              _hover={{ borderColor: "gray.500" }}
            >
              <Icon as={FaUpload} boxSize={8} color="gray.400" />
            </Flex>
            <Input
              type="file"
              multiple
              hidden
              onChange={handleImageChange}
              accept="image/*"
              aria-label="Upload images"
            />
          </label>
        </Box>
      </Flex>
      {imageErrors.some(Boolean) && (
        <FormErrorMessage>
          Some images have errors. Please check.
        </FormErrorMessage>
      )}
    </FormControl>
  );
};

export default ImageUpload;