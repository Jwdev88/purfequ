import axios from "axios";

export const apiCall = async (url, method = "GET", data = {}, token = "") => {
  try {
    const config = {
      method,
      url,
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : undefined,
      },
      data,
    };
    const response = await axios(config);
    return response;
  } catch (error) {
    throw error.response?.data?.message || error.message;
  }
};
