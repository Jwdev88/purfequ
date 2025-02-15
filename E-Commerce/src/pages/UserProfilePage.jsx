// --- components/UserProfile.jsx --- (NEW, COMBINED COMPONENT)
import React, { useState, useContext, useEffect, useCallback } from "react";
import { ShopContext } from "../context/ShopContext";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import {
  InputField,
  Button,
  TextareaField,
  SelectField,
} from "../components/ui"; // Import your UI components
import { validateEmail, validatePhone } from "../utils/validation";
import { apiCall } from "../utils/apiCall";
import { Loader2Icon } from "lucide-react";

const UserProfile = () => {
  const [userData, setUserData] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [addressLoading, setAddressLoading] = useState(false); //Separate loading state
  const [hasAddress, setHasAddress] = useState(false); // Track if the user has an address

  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [addressForm, setAddressForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    street: "",
    city: "",
    province: "",
    postalCode: "",
  });
  const [profileErrors, setProfileErrors] = useState({});
  const [addressErrors, setAddressErrors] = useState({});
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);

  const { token, backendUrl } = useContext(ShopContext);
  const navigate = useNavigate();

  const fetchUserProfile = useCallback(async () => {
    if (!token) return;
    setProfileLoading(true);
    try {
      const response = await apiCall(
        `${backendUrl}/api/user/me`,
        "GET",
        null,
        token
      );
      if (response.data.success) {
        setUserData(response.data.user);
        //Prefill profile form
        setProfileForm({
          name: response.data.user.name || "",
          email: response.data.user.email || "",
          currentPassword: "",
          newPassword: "",
          confirmNewPassword: "",
        });
      } else {
        throw new Error(
          response.data.message || "Failed to fetch user profile"
        );
      }
    } catch (error) {
      toast.error(error.message);
      navigate("/login"); // Redirect to login on error
    } finally {
      setProfileLoading(false);
    }
  }, [token, backendUrl, navigate]);

  // --- Fetch Provinces ---
  const fetchProvinces = useCallback(async () => {
    try {
      const response = await apiCall(
        `${backendUrl}/api/rajaongkir/provinces`,
        "GET",
        null,
        token
      );
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
  const fetchCities = useCallback(
    async (provinceId) => {
      if (!provinceId) {
        setCities([]);
        return;
      }

      try {
        const response = await apiCall(
          `${backendUrl}/api/rajaongkir/cities/${provinceId}`,
          "GET",
          null,
          token
        );
        if (!response.data.success) {
          throw new Error(response.data.message || "Failed to fetch cities");
        }
        setCities(response.data.cities);
      } catch (error) {
        console.error("Error fetching cities:", error);
        toast.error(error.message);
        setCities([]); // Clear cities on error
      }
    },
    [backendUrl, token]
  );

  useEffect(() => {
    fetchProvinces();
  }, [fetchProvinces]);

  const fetchAddresses = useCallback(async () => {
    if (!token) return;
    setAddressLoading(true);
    try {
      const response = await apiCall(
        `${backendUrl}/api/user/addresses`,
        "GET",
        null,
        token
      );
      if (response.data.success) {
        if (response.data.addresses && response.data.addresses.length > 0) {
          const address = response.data.addresses[0]; // Get the first address
          setAddressForm({
            firstName: address.firstName,
            lastName: address.lastName,
            email: address.email,
            phone: address.phone,
            street: address.street,
            city: address.cityId, // Use cityId for the select value
            province: address.provinceId, // Use provinceId for the select value
            postalCode: address.postalCode,
            _id: address._id, // IMPORTANT: Store the address ID
          });
          setHasAddress(true); // Set hasAddress to true
          if (address.provinceId) {
            await fetchCities(address.provinceId);
          }
        } else {
          setHasAddress(false); // Set hasAddress to false if no addresses
        }
      } else {
        throw new Error(response.data.message || "Failed to fetch addresses");
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setAddressLoading(false);
    }
  }, [token, backendUrl, fetchCities]); // Add fetchCities to dependencies
  useEffect(() => {
    if (addressForm.province) {
      fetchCities(addressForm.province);
    }
  }, [addressForm.province, fetchCities]);

  useEffect(() => {
    if (token) {
      fetchUserProfile();
      fetchAddresses();
    } else {
      navigate("/login");
    }
  }, [token, navigate, fetchUserProfile, fetchAddresses]);

  const handleProfileChange = (e) => {
    setProfileForm({ ...profileForm, [e.target.name]: e.target.value });
    setProfileErrors({ ...profileErrors, [e.target.name]: "" });
  };

  const handleAddressChange = (e) => {
    setAddressForm({ ...addressForm, [e.target.name]: e.target.value });
    setAddressErrors({ ...addressErrors, [e.target.name]: "" });
  };

  const handleProvinceChange = (provinceId) => {
    const selectedProvince = provinces.find(
      (p) => p.province_id === provinceId
    );
    setAddressForm((prev) => ({
      ...prev,
      province: provinceId,
      provinceText: selectedProvince ? selectedProvince.province : "",
      city: "", // Reset city
      cityText: "",
    }));

    if (provinceId) {
      fetchCities(provinceId);
    } else {
      setCities([]);
    }
  };

  const handleCityChange = (cityId) => {
    const selectedCity = cities.find((c) => c.city_id === cityId);
    setAddressForm((prev) => ({
      ...prev,
      city: cityId,
      cityText: selectedCity ? selectedCity.city_name : "",
    }));
  };

  const validateProfile = () => {
    const newErrors = {};
    if (!profileForm.name.trim()) newErrors.name = "Name is required";
    if (!profileForm.email.trim() || !validateEmail(profileForm.email))
      newErrors.email = "Valid email is required";
    setProfileErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateAddress = () => {
    const newErrors = {};

    if (!addressForm.firstName.trim())
      newErrors.firstName = "First Name is required";
    if (!addressForm.lastName.trim())
      newErrors.lastName = "Last Name is required";
    if (!addressForm.email.trim() || !validateEmail(addressForm.email))
      newErrors.email = "Valid Email is required";
    if (!addressForm.phone.trim() || !validatePhone(addressForm.phone))
      newErrors.phone = "Valid Phone Number is required";
    if (!addressForm.street.trim()) newErrors.street = "Street is required"; // Validate 'street'
    if (!addressForm.city) newErrors.city = "City is required"; // cityId
    if (!addressForm.province) newErrors.province = "Province is required"; //provinceId
    if (!addressForm.postalCode.trim())
      newErrors.postalCode = "Postal Code is required";

    setAddressErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProfileSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!validateProfile()) return;

      setProfileLoading(true);
      try {
        const updateData = { name: profileForm.name, email: profileForm.email };
        if (profileForm.newPassword) {
          updateData.currentPassword = profileForm.currentPassword;
          updateData.newPassword = profileForm.newPassword;
          updateData.confirmNewPassword = profileForm.confirmNewPassword;
        }

        const response = await apiCall(
          `${backendUrl}/api/user/profile`,
          "PUT",
          updateData,
          token
        );
        if (response.data.success) {
          toast.success(response.data.message);
          fetchUserProfile(); // Re-fetch user data
          setProfileForm((prev) => ({
            ...prev,
            currentPassword: "",
            newPassword: "",
            confirmNewPassword: "",
          })); //clear form
        } else {
          throw new Error(response.data.message || "Failed to update profile");
        }
      } catch (error) {
        console.error("Error updating profile:", error);
        toast.error(error.message);
      } finally {
        setProfileLoading(false);
      }
    },
    [profileForm, token, backendUrl, fetchUserProfile]
  );

  const handleAddressSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!validateAddress()) return;

      setAddressLoading(true);
      try {
        const addressData = {
          firstName: addressForm.firstName,
          lastName: addressForm.lastName,
          email: addressForm.email,
          phone: addressForm.phone,
          street: addressForm.street,
          cityId: addressForm.city,
          city: addressForm.cityText,
          provinceId: addressForm.province,
          province: addressForm.provinceText,
          postalCode: addressForm.postalCode,
        };

        let response;
        if (addressForm._id) {
          // Update existing address
          response = await apiCall(
            `${backendUrl}/api/user/address/${addressForm._id}`,
            "PUT",
            addressData,
            token
          );
        } else {
          // Add new address
          response = await apiCall(
            `${backendUrl}/api/user/address`,
            "POST",
            addressData,
            token
          );
        }

        if (response.data.success) {
          toast.success(response.data.message);
          //Refetch data
          fetchAddresses();
          // Reset the form only if adding a *new* address.
          if (!addressForm._id) {
            setAddressForm({
              // Keep this reset only for add
              firstName: "",
              lastName: "",
              email: "",
              phone: "",
              street: "",
              city: "",
              cityText: "",
              province: "",
              provinceText: "",
              postalCode: "",
            });
          }
        } else {
          throw new Error(
            response.data.message ||
              `Failed to ${addressForm._id ? "update" : "add"} address`
          );
        }
      } catch (error) {
        console.error(
          `Error ${addressForm._id ? "updating" : "adding"} address:`,
          error
        );
        toast.error(error.message);
      } finally {
        setAddressLoading(false);
      }
    },
    [addressForm, token, backendUrl, fetchAddresses]
  );

  if (!userData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2Icon className="animate-spin h-16 w-16 mr-4" />
        <span className="text-lg font-semibold">Loading...</span>
      </div>
    ); // Keep this, it handles initial loading
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">User Profile</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Profile Update Form */}
        <div>
          <h2 className="text-xl font-semibold mb-2">Update Profile</h2>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <InputField
              label="Name"
              name="name"
              value={profileForm.name}
              onChange={handleProfileChange}
              error={profileErrors.name}
              required
            />

            <InputField
              label="Email"
              name="email"
              type="email"
              value={profileForm.email}
              onChange={handleProfileChange}
              error={profileErrors.email}
              placeholder=""
              required
              isDisabled={true}

            />
            <InputField
              label="Current Password"
              name="currentPassword"
              type="password"
              value={profileForm.currentPassword}
              onChange={handleProfileChange}
            />
            <InputField
              label="New Password"
              name="newPassword"
              type="password"
              value={profileForm.newPassword}
              onChange={handleProfileChange}
            />
            <InputField
              label="Confirm New Password"
              name="confirmNewPassword"
              type="password"
              value={profileForm.confirmNewPassword}
              onChange={handleProfileChange}
            />
            <Button type="submit" loading={profileLoading} className="w-full">
              {profileLoading ? "Updating..." : "Update Profile"}
            </Button>
          </form>
        </div>

        {/* Address Form */}
        <div>
          <h2 className="text-xl font-semibold mb-2">
            {hasAddress ? "Update Address" : "Add Address"}
          </h2>
          <form onSubmit={handleAddressSubmit} className="space-y-4">
            <InputField
              label="First Name"
              name="firstName"
              value={addressForm.firstName}
              onChange={handleAddressChange}
              error={addressErrors.firstName}
              required
            />
            <InputField
              label="Last Name"
              name="lastName"
              value={addressForm.lastName}
              onChange={handleAddressChange}
              error={addressErrors.lastName}
              required
            />
            <InputField
              label="Email"
              name="email"
              type="email"
              value={addressForm.email}
              onChange={handleAddressChange}
              error={addressErrors.email}
              required
            />
            <InputField
              label="Phone"
              name="phone"
              type="tel"
              value={addressForm.phone}
              onChange={handleAddressChange}
              error={addressErrors.phone}
              required
            />
            <TextareaField
              label="Street"
              name="street"
              value={addressForm.street}
              onChange={handleAddressChange}
              error={addressErrors.street}
              required
            />
            <SelectField
              label="Province"
              value={addressForm.province}
              onChange={(value) => handleProvinceChange(value)}
              options={provinces.map((province) => ({
                value: province.province_id,
                label: province.province,
              }))}
              error={addressErrors.province}
              required
            />

            <SelectField
              label="City"
              value={addressForm.city}
              onChange={(value) => handleCityChange(value)}
              options={cities.map((city) => ({
                value: city.city_id,
                label: city.city_name,
              }))}
              disabled={cities.length === 0}
              error={addressErrors.city}
              required
            />

            <InputField
              label="Postal Code"
              name="postalCode"
              value={addressForm.postalCode}
              onChange={handleAddressChange}
              error={addressErrors.postalCode}
              required
            />

            <Button type="submit" loading={addressLoading} className="w-full">
              {hasAddress ? "Update Address" : "Add Address"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
