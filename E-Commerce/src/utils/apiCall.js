import axios from "axios";

export const apiCall = async (url, method = "GET", data = {}, token = "") => {
  try {
    const config = {
      method,
      url,
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : undefined, // Correctly handles optional token
      },
      data: data, // Axios handles placing data in the body for POST/PUT/etc.
    };

    const response = await axios(config);
    return { data: response.data, ok: response.status >= 200 && response.status < 300 }; // Return data AND ok status
  } catch (error) {
    // Access the error message from the *Axios* response, if available
    const errorMessage = error.response?.data?.message || error.message || "An unknown error occurred";
    console.error("API Call Error:", errorMessage, error.response); // Log the full error
      return { data: {success: false, message: errorMessage}, ok: false}
  }
};