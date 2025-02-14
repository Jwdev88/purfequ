// UserProfilePage.js
import React, { useState, useContext, useEffect, useCallback } from 'react';
import { ShopContext } from '../context/ShopContext';
import { toast } from 'react-toastify';
import { useNavigate, useParams } from 'react-router-dom'; // Removed Link (handled in components)
import { Button } from '../components/ui'; // Assuming you have a Button component

// Import the existing components!
import UpdateProfile from '../components/UpdateProfile'; // Adjust paths as needed
import AddAddress from '../components/AddAddress';
import UpdateAddress from'../components/UpdateAddress';
import AddressList from '../components/AddressList';


const UserProfilePage = () => {
    const [mode, setMode] = useState('profile');
    const [loading, setLoading] = useState(false); // Keep loading state if needed for transitions
    const { token } = useContext(ShopContext); // Only need token from context
    const navigate = useNavigate();
    const { addressId } = useParams();

    // Fetch address data *only* when in updateAddress mode.
    const fetchAddressData = useCallback(async (id) => {
      if (!token) return;

        try {
            setLoading(true);
           // const address = await fetchAddress(id, token);  // Assume you have a function to fetch address by ID
            const response = await fetch(`${backendUrl}/api/user/address/${addressId}`, {
                headers: {
                Authorization: `Bearer ${token}`,
                },
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to delete address');
            }
            const address = response.data.address

            if (!address) {
                toast.error("Address not found.");
                navigate("/profile"); // Redirect if no address found
                return;
            }
             // No need to setFormData here, pass the address as prop.
             return address;

        } catch (error) {
            toast.error(error.message || "Failed to fetch address.");
            navigate("/profile");
        } finally{
          setLoading(false)
        }
    }, [token, navigate]);


      useEffect(() => {
        if (mode === 'updateAddress' && addressId) {
          // No need to fetch here, pass addressId to UpdateAddress.
        }
    }, [mode, addressId, fetchAddressData]);


     const handleAddressDeleted = useCallback(() => {
       //fetchAddresses(); // Refresh the address list (if needed, depending on AddressList)
        // You could also pass a callback function to AddressList to handle this.
        setMode('addressList'); // Make sure you stay in addressList view

    }, []);



    return (
        <div className="container mx-auto p-4">
            <div className="flex space-x-4 mb-4">
                <Button onClick={() => setMode('profile')}>Update Profile</Button>
                <Button onClick={() => setMode('addressList')}>Address List</Button>
            </div>

            {loading && <div>Loading...</div>}

            {!loading && mode === 'profile' && <UpdateProfile />}
            {!loading && mode === 'addAddress' && <AddAddress />}
            {/* Pass addressId to UpdateAddress */}
            {!loading && mode === 'updateAddress' && addressId && <UpdateAddress addressId={addressId}  />}
            {!loading && mode === 'addressList' && <AddressList onAddressDeleted={handleAddressDeleted} />}
             <Button onClick={() => setMode('addAddress')} className="mt-4">
                Add New Address
            </Button>
        </div>
    );
};

export default UserProfilePage;