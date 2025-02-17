import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import React from "react";
// Notifikasi Sukses
export const notifySuccess = (message) => {
  toast.success(message, {
    position: "top-right",
    autoClose: 2000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    theme: "colored",
  });
};

// Notifikasi Error
export const notifyError = (message) => {
  toast.error(message, {
    position: "top-right",
    autoClose: 2000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    theme: "colored",
  });
};



// Notifikasi dengan tombol aksi (Login / Close)
export const notifyWarningWithAction = ({ message, onConfirm }) => {
  toast.warn(
    <div>
      <p>{message}</p>
      <div className="flex gap-2 mt-2">
        <button
          onClick={() => {
            toast.dismiss();
            onConfirm();
          }}
          className="px-4 py-1 bg-blue-500 text-white rounded-md"
        >
          Confirm
        </button>
        <button
          onClick={() => toast.dismiss()}
          className="px-4 py-1 bg-gray-400 text-white rounded-md"
        >
          Close
        </button>
      </div>
    </div>,
    {
      position: "top-right",
      autoClose: false, // Tidak otomatis hilang
      closeOnClick: false,
      draggable: false,
      theme: "colored",
    }
  );
};