import React, { useState, useContext, useEffect } from 'react';
import { ShopContext } from '../context/ShopContext'; // Ganti path context
import { toast } from 'react-toastify';

const UpdateProfile = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { token, backendUrl } = useContext(ShopContext);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${backendUrl}/api/user/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch user data");
      }

      const userData = await response.json();
      setName(userData.name);
      setEmail(userData.email);

    } catch (error) {
      console.error("Error fetching user data:", error);
      toast.error(error.message); // Gunakan toast
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${backendUrl}/api/user/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, email, currentPassword, newPassword, confirmNewPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message); // Notifikasi sukses
        // Update data user di context atau state global (jika perlu)
      } else {
        toast.error(data.message); // Notifikasi error
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('An error occurred while updating your profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchUserData();
    }
  }, [token, backendUrl]); // Tambahkan backendUrl ke dependency array

  if (loading && !name) { // Hanya tampilkan loading saat fetch data awal
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h2>Update Profile</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="name">Name:</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="currentPassword">Current Password:</label>
          <input
            type="password"
            id="currentPassword"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="newPassword">New Password:</label>
          <input
            type="password"
            id="newPassword"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="confirmNewPassword">Confirm New Password:</label>
          <input
            type="password"
            id="confirmNewPassword"
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
          />
        </div>
        <button type="submit" disabled={loading}>{loading ? "Updating..." : "Update Profile"}</button>
      </form>
    </div>
  );
};

export default UpdateProfile;