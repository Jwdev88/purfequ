// --- components/UpdateProfile.jsx ---
import React, { useState, useContext, useCallback } from 'react'; // Import useCallback
import { ShopContext } from '../context/ShopContext';
import { toast } from 'react-toastify';
import { InputField, Button } from '../components/ui'; // Import components
import { validateEmail } from '../utils/validation'; // Import validation utilities
import { apiCall } from '../utils/apiCall';

const UpdateProfile = ({ userData, onProfileUpdated }) => { // Receive userData and onProfileUpdated
    const [name, setName] = useState(userData?.name || ''); // Initialize with userData
    const [email, setEmail] = useState(userData?.email || ''); // Initialize with userData
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({}); // Local error state

    const { token, backendUrl } = useContext(ShopContext);

    // --- Input Change Handlers ---
    const handleNameChange = (e) => {
        setName(e.target.value);
        setErrors({ ...errors, name: '' }); // Clear error on change
    };
    const handleEmailChange = (e) => {
        setEmail(e.target.value);
        setErrors({ ...errors, email: '' });
    };

    // --- Validation ---
    const validate = () => {
        const newErrors = {};
        if (!name.trim()) newErrors.name = "Name is required";
        if (!email.trim() || !validateEmail(email)) newErrors.email = "Valid email is required";
        // Password validation is done on the backend.

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0; // Return true if no errors
    };

    // --- Form Submission (useCallback) ---
    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();

        if (!validate()) return;

        setLoading(true);
        try {
            const updateData = { name, email }; // Only send updated fields
            if (newPassword) {
                // Only include password fields if a new password is provided
                updateData.currentPassword = currentPassword;
                updateData.newPassword = newPassword;
                updateData.confirmNewPassword = confirmNewPassword;
            }
             const response = await apiCall(`${backendUrl}/api/user/profile`, 'PUT', updateData, token);

            if (response.data.success) {
                toast.success(response.data.message);
                onProfileUpdated(); // Call the callback function!
                // Reset password fields after successful update
                setCurrentPassword('');
                setNewPassword('');
                setConfirmNewPassword('');
            } else {
                throw new Error(response.data.message || 'Failed to update profile');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    }, [name, email, currentPassword, newPassword, confirmNewPassword, token, backendUrl, onProfileUpdated]); // Add dependencies


    return (
        <div>
            <h2 className="text-2xl font-bold mb-4">Update Profile</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <InputField
                    label="Name"
                    name="name"
                    value={name}
                    onChange={handleNameChange}
                    error={errors.name}
                    required
                />
                <InputField
                    label="Email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={handleEmailChange}
                    error={errors.email}
                    required
                />
                <InputField
                    label="Current Password"
                    name="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                />
                <InputField
                    label="New Password"
                    name="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                />
                <InputField
                    label="Confirm New Password"
                    name="confirmNewPassword"
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                />

                <Button type="submit" loading={loading} className="w-full">
                    {loading ? 'Updating...' : 'Update Profile'}
                </Button>
            </form>
        </div>
    );
};

export default UpdateProfile;