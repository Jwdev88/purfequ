

import React, { useState } from 'react';
import axios from 'axios';
import { backendURI } from "../../App";
import { Navigate } from 'react-router-dom';

const AddCategoryForm = () => {
  const [name, setName] = useState('');
  const [image, setImage] = useState(null);
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('active'); 
  const handleImageChange = (e) => {
    setImage(e.target.files[0]);
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) { 
      alert('Please enter a category name.'); 
      return;
    }
    if (!image) {
      alert('Please select an image file.');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('image', image); // Append the file
      formData.append('description', description);
      formData.append('status', status ? 'active' : 'inactive');

      const response = await axios.post(backendURI + '/api/category/add', formData, {
        headers: {
          'Content-Type': 'multipart/form-data' // Important for file uploads
        }
      });

      if (response.data.success) {
        // Optionally clear the form or show a success message
        Navigate('/category/list');
        setName('');
        setImage('');
        setDescription('');

      } else {
        console.error('Failed to create category:', response.data.message);
      }
    } catch (error) {
      console.error('Error creating category:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4">
      <div className="mb-4">
        <label htmlFor="name" className="block text-gray-700 font-bold mb-2">
          Name:
        </label>
        <input 
          type="text" 
          id="name" 
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          required 
        />
      </div>
      <div className="mb-4">
        <label htmlFor="image" className="block text-gray-700 font-bold mb-2">
          Image:
        </label>
        <input 
          type="file" 
          id="image" 
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
          onChange={handleImageChange} 
        />
      </div>
      <div className="mb-4">
        <label htmlFor="description" className="block text-gray-700 font-bold mb-2">
          Description:
        </label>
        <textarea 
          id="description" 
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
          value={description} 
          onChange={(e) => setDescription(e.target.value)} 
        />
      </div>
      <div className="mb-4">
        <label htmlFor="status" className="block text-gray-700 font-bold mb-2">
          Status:
        </label>
        <select 
          id="status" 
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
          value={status ? 'active' : 'inactive'} 
          onChange={(e) => setStatus(e.target.value === 'active')}
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>
      <button 
        type="submit" 
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
      >
        Create Category
      </button>
    </form>
  );
};

export default AddCategoryForm;
