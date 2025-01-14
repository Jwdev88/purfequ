import axios from 'axios';
import { toast } from 'react-toastify';
import { apiCall } from '../utils/apiCall';

const backendUrl = import.meta.env.VITE_BACKEND_URL;
export const CartService = {
  getUserCart: async (token) => {
    const url = `${backendUrl}/api/cart/get`;
    return await apiCall(url, 'GET', {}, token);
  },
  addToCart: async (token, productId, variantId, optionId, quantity) => {
    const url = `${backendUrl}/api/cart/add`;
    const data = { productId, variantId, optionId, quantity };
    return await apiCall(url, 'POST', data, token);
  },
  updateQuantity: async (token, productId, variantId, optionId, quantity) => {
    const url = `${backendUrl}/api/cart/update`;
    const data = { productId, variantId, optionId, quantity };
    return await apiCall(url, 'POST', data, token);
  },
  removeItemFromCart: async (token, productId, variantId, optionId) => {
    const url = `${backendUrl}/api/cart/update`;
    const data = { productId, variantId, optionId, quantity: 0 };
    return await apiCall(url, 'POST', data, token);
  },
  clearCart: async (token) => {
    const url = `${backendUrl}/api/cart/clear`;
    return await apiCall(url, 'POST', {}, token);
  }
};
