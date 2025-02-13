import React, { useState, useContext, useEffect, useCallback } from 'react';
import { ShopContext } from '../context/ShopContext';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { InputField, Button, TextareaField, SelectField } from '../components/ui'; // Import yang benar
import { validateEmail, validatePhone } from '../utils/validation';
import { apiCall } from '../utils/apiCall'; // Import apiCall

const AddAddress = () => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        street: '',  // Ganti 'address' jadi 'street'
        city: '',      // ID Kota
        cityText: '',       // Tambahkan cityText, state
        province: '',  // ID Provinsi
        provinceText: '',     // Tambahkan provinceText, state
        state: '',
        postalCode: '',
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const { token, backendUrl } = useContext(ShopContext);
    const navigate = useNavigate();

    const [provinces, setProvinces] = useState([]);
    const [cities, setCities] = useState([]);


    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setErrors({ ...errors, [e.target.name]: '' });
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

      // --- Fetch Provinces ---
    const fetchProvinces = useCallback(async () => {
      try {
        const response = await fetch(`${backendUrl}/api/rajaongkir/provinces`, { // Sesuaikan endpoint
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          throw new Error("Failed to fetch provinces");
        }
        const data = await response.json();
         if (data.success) {
                setProvinces(data.provinces);
            } else {
                throw new Error(data.message || "Failed to fetch provinces");
            }
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
            const response = await fetch(`${backendUrl}/api/rajaongkir/cities/${provinceId}`, { // Sesuaikan endpoint
            headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) {
            throw new Error("Failed to fetch cities");
            }
            const data = await response.json();
            if(data.success){
                setCities(data.cities);
            } else {
                throw new Error(data.message || "Failed to fetch cities");
            }
        } catch (error) {
            console.error(error);
            toast.error(error.message);
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


    const validate = () => {
        const newErrors = {};

        if (!formData.firstName.trim()) newErrors.firstName = "First Name is required";
        if (!formData.lastName.trim()) newErrors.lastName = "Last Name is required";
        if (!formData.email.trim() || !validateEmail(formData.email)) newErrors.email = "Valid Email is required";
        if (!formData.phone.trim() || !validatePhone(formData.phone)) newErrors.phone = "Valid Phone Number is required";
        if (!formData.street.trim()) newErrors.street = "Street is required"; // Validasi street
        if (!formData.city) newErrors.city = "City is required";
        if (!formData.state.trim()) newErrors.state = "State is required";
        if (!formData.province) newErrors.province = "Province is required";
        if (!formData.postalCode.trim()) newErrors.postalCode = "Postal Code is required";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };


 // ... (import, state, dll.) ...

const handleSubmit = async (e) => {
  e.preventDefault();

  if (!validate()) {
      return;
  }

  setLoading(true);

  try {
      // Perubahan di sini: Kirim HANYA ID
      const addressData = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          street: formData.street,  // Gunakan 'street'
          cityId: formData.city,    // ID Kota
          provinceId: formData.province, // ID Provinsi
          state: formData.state,    // State (opsional, bisa dihapus jika tidak perlu)
          postalCode: formData.postalCode,
          city: formData.cityText, //tambahkan city
          province: formData.provinceText //tambahkan province
      };

      const response = await apiCall(`${backendUrl}/api/user/address`, "POST", addressData, token);

// ... (rest of handleSubmit) ...


            if (response.data.success) {
                toast.success(response.data.message);
                // Reset form (opsional, tergantung kebutuhan)
                setFormData({
                    firstName: '',
                    lastName: '',
                    email: '',
                    phone: '',
                    street: '',
                    city: '',
                    cityId: '',
                    province: '',
                    provinceId: '',
                    state: '',
                    postalCode: '',
                });
                navigate('/addresses'); // Redirect ke daftar alamat
            } else {
                // Handle error dari backend (misalnya, validasi di sisi server)
                toast.error(response.data.message || 'Failed to add address');
            }
        } catch (error) {
            console.error('Error adding address:', error);
            toast.error('An error occurred while adding the address.');
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="max-w-md mx-auto mt-8">
            <h2 className="text-2xl font-bold mb-4">Add New Address</h2>
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
                <TextareaField  // Gunakan TextareaField
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
                    Add Address
                </Button>
            </form>
        </div>
    );
};

export default AddAddress;