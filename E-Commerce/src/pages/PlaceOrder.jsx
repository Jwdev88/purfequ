// --- components/PlaceOrder.js ---
import React, { useContext, useState, useMemo } from "react";
import { ShopContext } from "../context/ShopContext";
import { toast } from "react-toastify";
import {
    InputField,
    Button,
    TextareaField,
    SelectField,
} from "../components/ui";
import { validateEmail, validatePhone } from '../utils/validation';
import { Loader2Icon } from "lucide-react";
import usePlaceOrder from "../hooks/usePlaceOrder";

const PlaceOrder = () => {
    const { cartItems, formatIDR, getCartAmount } = useContext(ShopContext);

    const {
        state,
        dispatch,
        handleProvinceChange,
        handleCityChange,
        handleOrderSubmission,
        handleServiceSelect
    } = usePlaceOrder();

    const {
        formData,
        cities,
        isLoading,
        isLoadingAddress,
        isLoadingCost,
        cost,
        selectedService,
        provinces,
    } = state;

    // --- Calculate Totals (useMemo for efficiency) ---
    const { totalWeightKg, totalCart, shippingCost, totalOrder } = useMemo(() => {
        const totalWeightGram = cartItems.reduce((total, item) => {
            const itemWeight =
                item.variant?.selectedOption?.optionWeight ?? item.productWeight ?? 0;
            return total + itemWeight * item.quantity;
        }, 0);

        const totalWeightKg = totalWeightGram / 1000;
        const totalCart = getCartAmount();
        const shippingCost = selectedService?.cost[0]?.value || 0;  // Safely access cost
        const totalOrder = totalCart + shippingCost;
        return { totalWeightKg, totalCart, shippingCost, totalOrder };
    }, [cartItems, selectedService, getCartAmount]);


    const [errors, setErrors] = useState({});

    const validateForm = () => {
        const newErrors = {};

        if (!formData.firstName.trim()) newErrors.firstName = "First Name is required";
        if (!formData.lastName.trim()) newErrors.lastName = "Last Name is required";
        if (!formData.email.trim() || !validateEmail(formData.email))
            newErrors.email = "Valid Email is required";
        if (!formData.phone.trim() || !validatePhone(formData.phone))
            newErrors.phone = "Valid Phone Number is required";
        if (!formData.address.trim()) newErrors.address = "Address is required";
        if (!formData.province) newErrors.province = "Province is required";
        if (!formData.city) newErrors.city = "City is required";
        if (!formData.state) newErrors.state = "State is required";
        if (!formData.postalCode) newErrors.postalCode = "Postal Code is required";

        if (!selectedService) {
            toast.error("Please select a shipping service.");
            return false;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (e) => {
        dispatch({
            type: "SET_FORM_DATA",
            payload: { [e.target.name]: e.target.value },
        });
        setErrors({ ...errors, [e.target.name]: "" });
    };

    const handleAddNewAddress = () => {
        dispatch({ type: "RESET_FORM" });
    };

    const onSubmitHandler = (event) => {
        event.preventDefault();

        if (!validateForm()) {
            return;
        }

        const orderItems = cartItems.map((item) => {
            const price =
                item.variant?.selectedOption?.optionPrice ??
                item.variant?.variantPrice ??
                item.productPrice ??
                0;
            const variantData = item.variant
                ? {
                      variantId: item.variant.variantId,
                      variantName: item.variant.variantName,
                      selectedOption: item.variant.selectedOption
                          ? {
                                optionId: item.variant.selectedOption.optionId,
                                optionName: item.variant.selectedOption.optionName,
                                optionPrice: item.variant.selectedOption.optionPrice,
                            }
                          : null,
                  }
                : null;

            return {
                id: item.productId,
                name: item.productName,
                quantity: item.quantity,
                price,
                variant: variantData,
                image: item.productImages[0],
            };
        });

        const orderData = {
            items: orderItems,
            address: {
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                phone: formData.phone,
                address: formData.address,
                provinceId: formData.province,
             // --- components/PlaceOrder.js --- (Continued from previous response)
             cityId: formData.city,
             state: formData.state,
             postalCode: formData.postalCode,
         },
         amount: totalCart,
         ongkir: shippingCost,
         paymentMethod: "midtrans",
     };

     handleOrderSubmission(orderData);
 };

 // Show loading spinner *only* when fetching the address or submitting
 if (isLoadingAddress || isLoading) {
     return (
         <div className="flex justify-center items-center h-screen">
             <Loader2Icon className="animate-spin h-10 w-10 text-indigo-600" />
             <p className="ml-2 text-lg text-gray-700">Loading...</p>
         </div>
     );
 }

 return (
     <form onSubmit={onSubmitHandler} className="p-6 border rounded-md bg-white shadow-md">
         <div className="flex space-x-8 flex-wrap">
             {/* Delivery Information Section */}
             <div className="space-y-6 flex-1">
                 <h2 className="text-xl font-bold mb-4">Delivery Information</h2>
                 <div className="space-x-4 flex w-full flex-wrap">
                     <InputField
                         label="First Name"
                         name="firstName"
                         value={formData.firstName}
                         onChange={handleInputChange}
                         error={errors.firstName}
                         required
                     />
                     <InputField
                         label="Last Name"
                         name="lastName"
                         value={formData.lastName}
                         onChange={handleInputChange}
                         error={errors.lastName}
                         required
                     />
                 </div>
                 <InputField
                     label="Email"
                     name="email"
                     type="email"
                     value={formData.email}
                     onChange={handleInputChange}
                     error={errors.email}
                     required
                 />
                 <InputField
                     label="Phone"
                     name="phone"
                     type="tel"
                     value={formData.phone}
                     onChange={handleInputChange}
                     error={errors.phone}
                     required
                 />
                 <TextareaField
                     label="Address"
                     name="address"
                     value={formData.address}
                     onChange={handleInputChange}
                     error={errors.address}
                     required
                 />
                 <InputField
                     label="State"
                     name="state"
                     value={formData.state}
                     onChange={handleInputChange}
                     error={errors.state}
                     required
                 />
                 <InputField
                     label="Postal Code"
                     name="postalCode"
                     value={formData.postalCode}
                     onChange={handleInputChange}
                     error={errors.postalCode}
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

                 {/* Add New Address Button */}
                 <Button type="button" onClick={handleAddNewAddress} className="mt-2">
                     Add New Address
                 </Button>

                 {/* Shipping Options */}
                 {isLoadingCost ? (
                     <div className="flex items-center">
                         <Loader2Icon className="animate-spin mr-2" />
                         <span>Loading shipping options...</span>
                     </div>
                 ) : (
                      formData.province && // Make sure a province is selected.
                     formData.city &&     // Make sure a city is selected.
                     cost && cost.length > 0 && ( // Ensure cost data is available.
                     <div className="space-y-4">
                         <p className="font-semibold">Select Shipping Service:</p>
                         {cost.map((service) => (
                             <div key={service.service} className="flex items-center">
                                 <input
                                     type="radio"
                                     id={`service-${service.service}`}
                                     name="shippingService"
                                     value={service.service}
                                     checked={selectedService?.service === service.service}
                                     onChange={() => handleServiceSelect(service)}
                                     className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                                 />
                                 <label htmlFor={`service-${service.service}`} className="text-sm">
                                     {service.description} - {formatIDR(service.cost[0].value)} (ETD: {service.cost[0].etd} days)
                                 </label>
                             </div>
                         ))}
                     </div>
                     )
                 )}
             </div>

             {/* Order Summary */}
             <div className="flex-1 space-y-6">
                 <div className="p-6 bg-gray-50 rounded-lg shadow-md">
                     <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
                     <div className="space-y-4 text-sm">
                         <div className="flex justify-between">
                             <span>SubTotal Pesanan</span>
                             <span>{formatIDR(totalCart)}</span>
                         </div>
                         <div className="flex justify-between">
                             <span>Shipping Cost ({totalWeightKg} kg)</span>
                             <span>{formatIDR(shippingCost)}</span>
                         </div>
                         <div className="border-t border-gray-300 pt-2" />
                         <div className="flex justify-between text-xl font-semibold">
                             <span>Total Order</span>
                             <span>{formatIDR(totalOrder)}</span>
                         </div>
                     </div>
                 </div>

                 <Button type="submit" className="w-full" disabled={isLoading}>
                     {isLoading ? "Placing Order..." : "Place Order"}
                 </Button>
             </div>
         </div>
     </form>
 );
};

export default PlaceOrder;