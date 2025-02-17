import React, { useState, useEffect, useContext } from 'react';
import { ShopContext } from '../context/ShopContext';
import { toast } from 'react-toastify';
import { InputField, TextareaField, Button } from './ui'; // Pastikan path ini benar
import { validateEmail, validatePhone } from '../utils/validation';

const AddressSelection = ({ selectedAddressId, onSelectAddress, newAddress, onNewAddressChange }) => {
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showNewAddressForm, setShowNewAddressForm] = useState(false);
     const [errors, setErrors] = useState({}); // Local errors for new address form
    const { token, backendUrl } = useContext(ShopContext);

    const fetchAddresses = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${backendUrl}/api/user/addresses`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch addresses');
            }
            const data = await response.json();
            setAddresses(data.addresses);
        } catch (error) {
            console.error('Error fetching addresses:', error);
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchAddresses();
        }
    }, [token, backendUrl]);


    const handleAddressSelect = (addressId) => {
        onSelectAddress(addressId);
        setShowNewAddressForm(false); // Sembunyikan form jika memilih alamat yang ada
    };

    const handleAddAddressClick = () => {
        onSelectAddress(null); // Reset pilihan
        setShowNewAddressForm(true); // Tampilkan form
        onNewAddressChange({ // Reset new address form
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            address: '',
            city: '',
            state: '', // Tambahkan state
            province: '',
            postalCode: ''
        });
        setErrors({}); //reset error
    };


    const handleNewAddressInputChange = (e) => {
        const { name, value } = e.target;
        onNewAddressChange({ ...newAddress, [name]: value });
        setErrors({ ...errors, [name]: '' }); // Clear errors on change

    };

     const validateNewAddress = () => { //pindahkan ke utils
        const newErrors = {};

        if (!newAddress?.firstName?.trim()) { //Safe navigation
            newErrors.firstName = 'First Name is required';
        }
        if (!newAddress?.lastName?.trim()) {
            newErrors.lastName = 'Last Name is required';
        }
        if (!newAddress?.email?.trim() || !validateEmail(newAddress.email)) {
            newErrors.email = 'Valid Email is required';
        }
        if (!newAddress?.phone?.trim() || !validatePhone(newAddress.phone)) {
            newErrors.phone = 'Valid Phone is required';
        }
        if (!newAddress?.address?.trim()) {
            newErrors.address = 'Address is required';
        }
        if (!newAddress?.city?.trim()) {
            newErrors.city = "City is required";
        }

        if (!newAddress?.state?.trim()) {
            newErrors.state = "State is required";
        }

        if (!newAddress?.province?.trim()) {
            newErrors.province = "Province is required";
        }
        if (!newAddress?.postalCode?.trim()) {
            newErrors.postalCode = "Postal Code is required";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    return (
        <div>
            <h3 className="text-lg font-semibold mb-2">Select Shipping Address:</h3>
            {loading && <p>Loading addresses...</p>}
            {!loading && addresses.length > 0 && (
                <div className="space-y-2">
                    {addresses.map((address) => (
                        <div key={address._id} className="flex items-center">
                            <input
                                type="radio"
                                id={`address-${address._id}`}
                                name="addressOption" // Ubah name
                                value={address._id}
                                checked={selectedAddressId === address._id}
                                onChange={() => handleAddressSelect(address._id)}
                                className="mr-2"
                            />
                            <label htmlFor={`address-${address._id}`} className="text-sm">
                                {address.firstName} {address.lastName}, {address.street}, {address.city}
                            </label>
                        </div>
                    ))}
                </div>
            )}
            {!loading && addresses.length === 0 && (
                <p className="text-sm">You have no saved addresses.</p>
            )}

            <Button type="button" onClick={handleAddAddressClick} className="mt-2">
                Use Different Address
            </Button>

            {showNewAddressForm && (
                <div className="mt-4">
                    <h4 className="text-md font-semibold mb-2">Enter New Address:</h4>
                    <div className="space-y-2">
                    <InputField
                        label="First Name"
                        name="firstName"
                        value={newAddress?.firstName || ''}  // Safe navigation
                        onChange={handleNewAddressInputChange}
                        error={errors.firstName}
                        required
                    />
                    <InputField
                        label="Last Name"
                        name="lastName"
                        value={newAddress?.lastName || ''} // Safe navigation
                        onChange={handleNewAddressInputChange}
                        error={errors.lastName}
                        required
                    />
                    <InputField
                        label="Email"
                        name="email"
                        type="email"
                        value={newAddress?.email || ''} // Safe navigation
                        onChange={handleNewAddressInputChange}
                        error={errors.email}
                        required
                    />
                    <InputField
                        label="Phone"
                        name="phone"
                        type="tel"
                        value={newAddress?.phone || ''} // Safe navigation
                        onChange={handleNewAddressInputChange}
                        error={errors.phone}
                        required
                    />
                    <TextareaField
                        label="Address"
                        name="address"
                        value={newAddress?.address || ''} // Safe navigation dan pastikan ada field address
                        onChange={handleNewAddressInputChange}
                        error={errors.address}
                        required
                    />
                    <InputField
                        label="City"
                        name="city"
                        value={newAddress?.city || ''}
                        onChange={handleNewAddressInputChange}
                        error={errors.city}
                        required

                    />
                      <InputField
                        label="State"
                        name="state"
                        value={newAddress?.state || ''}
                        onChange={handleNewAddressInputChange}
                        error={errors.state}
                        required

                    />
                     <InputField
                        label="Province"
                        name="province"
                        value={newAddress?.province || ''}  // Safe navigation
                        onChange={handleNewAddressInputChange}
                        error={errors.province}
                        required
                    />

                    <InputField
                        label="Postal Code"
                        name="postalCode"
                        value={newAddress?.postalCode || ''} // Safe navigation
                        onChange={handleNewAddressInputChange}
                        error={errors.postalCode}
                        required
                    />
                    </div>
                </div>
            )}
        </div>
    );
};

export default AddressSelection;