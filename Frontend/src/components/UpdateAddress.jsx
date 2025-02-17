import React, { useState, useContext, useEffect, useCallback } from 'react';
import { ShopContext } from '../context/ShopContext';
import { toast } from 'react-toastify';
import { useParams, useNavigate } from 'react-router-dom';
import { InputField, Button, TextareaField, SelectField } from '../components/ui';
import { validateEmail, validatePhone } from '../utils/validation';
import { apiCall } from '../utils/apiCall'; // Import apiCall

const UpdateAddress = ({ addressId, onAddressUpdated }) => { // Receive addressId and onAddressUpdated
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        street: '',  // Use 'street', not 'address'
        city: '',       // ID Kota
        cityText: '', // Added for display purposes
        province: '',   // ID Provinsi
        provinceText: '', // Added for display
        state: '',
        postalCode: '',
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const { token, backendUrl } = useContext(ShopContext);
    const navigate = useNavigate();

    const [provinces, setProvinces] = useState([]);
    const [cities, setCities] = useState([]);

      // --- Fetch Provinces ---
    const fetchProvinces = useCallback(async () => {
        try {
            const response = await apiCall(`${backendUrl}/api/rajaongkir/provinces`, 'GET', null, token);
            if (!response.data.success) {
                throw new Error(response.data.message || "Failed to fetch provinces");
            }
            setProvinces(response.data.provinces);
        } catch (error) {
            console.error(error);
            toast.error(error.message);
        }
    }, [backendUrl, token]);

    // --- Fetch Cities ---
    const fetchCities = useCallback(async (provinceId) => {
        if (!provinceId) {
            setCities([]);
            return;
        }

        try {
            const response = await apiCall(`<span class="math-inline">\{backendUrl\}/api/rajaongkir/cities/</span>{provinceId}`, 'GET', null, token );
            if (!response.data.success) {
                throw new Error(response.data.message || "Failed to fetch cities");
            }
          setCities(response.data.cities);
        } catch (error) {
            console.error("Error fetching cities:", error);
            toast.error(error.message);
            setCities([]); // Clear cities on error
        }
    }, [backendUrl, token]);

     useEffect(() => {
        fetchProvinces();
    }, [fetchProvinces]);

    useEffect(() => {
        if(formData.province){
            fetchCities(formData.province)
        }
    }, [formData.province, fetchCities])

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setErrors({ ...errors, [e.target.name]: '' }); // Clear error on change
    };

      const handleProvinceChange = (provinceId) => {
        const selectedProvince = provinces.find((p) => p.province_id === provinceId); // Cari objek provinsi
        setFormData(prev => ({
            ...prev,
            province: provinceId,
            provinceText: selectedProvince ? selectedProvince.province : '', // Set nama provinsi
            city: '',  // Reset city
            cityText: ''

        }));

        if (provinceId) {
            fetchCities(provinceId);
        } else {
            setCities([]); // Kosongkan pilihan kota
        }
    };

    const handleCityChange = (cityId) => {
      const selectedCity = cities.find((c) => c.city_id === cityId)
        setFormData(prev => ({
          ...prev,
          city: cityId,
          cityText: selectedCity ? selectedCity.city_name : ''
        }));
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.firstName.trim()) newErrors.firstName = "First Name is required";
        if (!formData.lastName.trim()) newErrors.lastName = "Last Name is required";
        if (!formData.email.trim() || !validateEmail(formData.email)) newErrors.email = "Valid Email is required";
        if (!formData.phone.trim() || !validatePhone(formData.phone)) newErrors.phone = "Valid Phone Number is required";
        if (!formData.street.trim()) newErrors.street = "Street is required";  // Validate 'street'
        if (!formData.city) newErrors.city = "City is required"; // cityId
        if (!formData.state.trim()) newErrors.state = "State is required";
        if (!formData.province) newErrors.province = "Province is required"; //provinceId
        if (!formData.postalCode.trim()) newErrors.postalCode = "Postal Code is required";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

     // --- Fetch Address Data ---
    useEffect(() => {
        const fetchAddress = async () => {
          if (!addressId || !token) { // No addressId, nothing to fetch
            return;
          }
            try {
                setLoading(true);
                const response = await apiCall(`<span class="math-inline">\{backendUrl\}/api/user/address/</span>{addressId}`, 'GET', null, token);

                if (!response.data.success) { // Assuming your backend sends { success: ..., address: ... }
                    throw new Error(response.data.message || 'Failed to fetch address');
                }

                const address = response.data.address;
                // Prefill formData
                setFormData({
                    firstName: address.firstName,
                    lastName: address.lastName,
                    email: address.email,
                    phone: address.phone,
                    street: address.street,
                    city: address.cityId,        // ID Kota
                    cityText: address.city,      // Nama Kota
                    province: address.provinceId,  // ID Provinsi
                    provinceText: address.province, //Nama Provinsi
                    state: address.state,
                    postalCode: address.postalCode,
                });
            } catch (error) {
                console.error('Error fetching address:', error);
                toast.error(error.message || 'Failed to fetch address.');
                navigate('/addresses');
            } finally {
                setLoading(false);
            }
        };

        if (addressId && token) {
            fetchAddress();
        }
    }, [addressId, token, backendUrl, navigate, fetchCities]); // Add fetchCities to the dependency array



    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        if (!validate()) {
            return;
        }

        setLoading(true);
        try {
             const updatedAddress = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                phone: formData.phone,
                street: formData.street,
                cityId: formData.city,          // ID Kota
                city: formData.cityText,        // Nama kota
                provinceId: formData.province,    // ID Provinsi
                province: formData.provinceText,  // Nama provinsi
                state: formData.state,
                postalCode: formData.postalCode,
            };
            const response = await apiCall(`${backendUrl}/api/user/address/${addressId}`, 'PUT', updatedAddress, token);

            if (response.data.success) {
                toast.success(response.data.message);
                if(onAddressUpdated) { // Call the callback
                    onAddressUpdated();
                }

            } else {
                toast.error(response.data.message || 'Failed to update address');
            }
        } catch (error) {
            console.error('Error updating address:', error);
            toast.error("An error occurred while updating the address.");
        } finally {
            setLoading(false);
        }
    }, [backendUrl, token, formData, addressId, onAddressUpdated]); // Add onAddressUpdated to dependencies


    if (loading) {
        return <div>Loading...</div>;
    }

    return (
      <div className="max-w-md mx-auto mt-8">
        <h2 className="text-2xl font-bold mb-4">Update Address</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <InputField
            label="First Name"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            error={errors.firstName}
            required
          />
          <InputField
            label="Last Name"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            error={errors.lastName}
            required
          />
          <InputField
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            required
          />
          <InputField
            label="Phone"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleChange}
            error={errors.phone}
            required
          />
          <TextareaField
            label="Street"
            name="street"
            value={formData.street}
            onChange={handleChange}
            error={errors.street}
            required
          />

          <SelectField
            label="Province"
            value={formData.province}
            onChange={(value) => handleProvinceChange(value)}
            options={provinces.map((province) => ({
              value: province.province_id,
              label: province.province,
            }))}
            error={errors.province}
          />

          <SelectField
            label="City"
            value={formData.city}
            onChange={(value) => handleCityChange(value)}
            options={cities.map((city) => ({
              value: city.city_id,
              label: city.city_name,
            }))}
            disabled={cities.length === 0}
            error={errors.city}
          />
          <InputField
            label="State"
            name="state"
            value={formData.state}
            onChange={handleChange}
            error={errors.state}
            required
          />
          <InputField
            label="Postal Code"
            name="postalCode"
            value={formData.postalCode}
            onChange={handleChange}
            error={errors.postalCode}
            required
          />

          <Button type="submit" loading={loading} className="w-full">
            {loading ? "Updating..." : "Update Address"}
          </Button>
        </form>
      </div>
    );
};

export default UpdateAddress;