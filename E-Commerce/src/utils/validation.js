// utils/validation.js
export const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };
  
  export const validatePhone = (phone) => {
      // Regular expression untuk validasi nomor telepon (contoh sederhana)
      const re = /^[0-9]{8,15}$/; // Hanya angka, 8-15 digit. Sesuaikan!
      return re.test(phone);
  }