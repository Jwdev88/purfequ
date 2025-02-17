// utils/apiCall.js
import axios from "axios";

export const apiCall = async (url, method = "GET", data = {}, token = "") => {
  try {
    const config = {
      method,
      url,
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : undefined, // Correct
      },
      data: data, // Axios handles this correctly
    };

    const response = await axios(config);
    return { data: response.data, status: response.status, ok: true }; // Return status
  } catch (error) {
    // IMPORTANT:  Get status and message consistently.
    const status = error.response?.status || 500; // Default to 500 if no response
    const errorMessage = error.response?.data?.message || error.message || "An unknown error occurred";
    // console.error("API Call Error:", errorMessage, error.response); // Log for debugging
    // Throw the error, so the caller can handle it.
    throw { message: errorMessage, status: status }; // Throw an object with message and status
  }
};