import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { backendURI } from "../../App";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  Image,
} from '@chakra-ui/react';

const AddCategoryForm = () => {
  const [name, setName] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('active');
  const navigate = useNavigate();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    const maxSize = 2 * 1024 * 1024; // 2MB

    if (file && validTypes.includes(file.type) && file.size <= maxSize) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    } else {
      toast.error('Invalid file type or size. Please select a valid image file under 2MB.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter a category name.');
      return;
    }
    if (!image) {
      toast.error('Please select an image file.');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('image', image);
      formData.append('description', description);
      formData.append('status', status);

      const response = await axios.post(`${backendURI}/api/category/add`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        toast.success('Category created successfully!');
        navigate('/category/list');
        setName('');
        setImage(null);
        setImagePreview(null);
        setDescription('');
      } else {
        toast.error(`Failed to create category: ${response.data.message}`);
      }
    } catch (error) {
      toast.error('Error creating category. Please try again later.');
      console.error('Error creating category:', error);
    }
  };

  return (
    <Box as="form" onSubmit={handleSubmit} p={4}>
      <FormControl id="name" mb={4} isRequired>
        <FormLabel>Name:</FormLabel>
        <Input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </FormControl>
      <FormControl id="image" mb={4}>
        <FormLabel>Image:</FormLabel>
        <Input
          type="file"
          onChange={handleImageChange}
        />
        {imagePreview && (
          <Image src={imagePreview} alt="Image Preview" mt={2} boxSize="150px" objectFit="cover" />
        )}
      </FormControl>
      <FormControl id="description" mb={4}>
        <FormLabel>Description:</FormLabel>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </FormControl>
      <FormControl id="status" mb={4}>
        <FormLabel>Status:</FormLabel>
        <Select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Select>
      </FormControl>
      <Button
        type="submit"
        colorScheme="blue"
        mt={4}
      >
        Create Category
      </Button>
    </Box>
  );
};

export default AddCategoryForm;