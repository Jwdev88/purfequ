import React, { useContext, useEffect, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import Title from "../components/Title";
import CartTotal from "../components/CartTotal";
import usePlaceOrder from "../hooks/usePlaceOrder";
import { actionTypes } from "../context/actionTypes";
import PaymentMethodCOD from "./PaymentMethodCOD";
import PaymentMethodMidtrans from "./PaymentMethodMidtrans";

const InputField = ({ label, name, value, onChange, type = "text", ...props }) => (
  <div>
    <label className="block font-semibold">{label}</label>
    {type === "textarea" ? (
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        className="w-full p-2 border border-gray-300 rounded"
        rows={3}
        {...props}
      />
    ) : (
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        className="w-full p-2 border border-gray-300 rounded"
        {...props}
      />
    )}
  </div>
);

const SelectField = ({ label, value, onChange, options, disabled = false }) => (
  <div>
    <label className="block font-semibold">{label}</label>
    <select
      value={value}
      onChange={onChange}
      disabled={disabled}
      className="w-full p-2 border border-gray-300 rounded"
    >
      <option value="">Select {label}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </div>
);

const PlaceOrderForm = ({
  formData,
  dispatch,
  handleProvinceChange,
  handleCityChange,
  provinces,
  cities = [],
  isLoadingCost,
  cost,
  selectedService,
  formatIDR,
}) => {
  const handleInputChange = (field) => (e) =>
    dispatch({
      type: actionTypes.SET_FORM_DATA,
      payload: { [field]: e.target.value },
    });

  return (
    <div className="space-y-4 flex-1">
      <Title text1="DELIVERY" text2="INFORMATION" />
      <div className="space-x-4 flex w-full">
        <InputField
          label="First Name"
          name="firstName"
          value={formData.firstName || ""}
          onChange={handleInputChange("firstName")}
        />
        <InputField
          label="Last Name"
          name="lastName"
          value={formData.lastName || ""}
          onChange={handleInputChange("lastName")}
        />
      </div>

      <InputField
        label="Email"
        name="email"
        value={formData.email || ""}
        onChange={handleInputChange("email")}
        type="email"
      />

      <InputField
        label="Phone"
        name="phone"
        value={formData.phone || ""}
        onChange={handleInputChange("phone")}
        type="tel"
      />

      <InputField
        label="Address"
        name="address"
        value={formData.address || ""}
        onChange={handleInputChange("address")}
        type="textarea"
      />

      <SelectField
        label="Province"
        value={formData.selectedProvince || ""}
        onChange={(e) => handleProvinceChange(e.target.value)}
        options={provinces.map((province) => ({
          value: province.province_id,
          label: province.province,
        }))}
      />

      <SelectField
        label="City"
        value={formData.selectedCity || ""}
        onChange={(e) => handleCityChange(e.target.value)}
        options={cities.map((city) => ({
          value: city.city_id,
          label: city.city_name,
        }))}
        disabled={cities.length === 0}
      />

      {isLoadingCost ? (
        <div className="flex justify-center items-center p-4">
          <div className="spinner-border animate-spin" />
        </div>
      ) : (
        cost && (
          <div className="space-y-4">
            <p>Select Shipping Service:</p>
            {cost.map((service) => (
              <div key={service.service} className="flex items-center space-x-4">
                <input
                  type="radio"
                  value={service.service}
                  checked={selectedService?.service === service.service}
                  onChange={() =>
                    dispatch({
                      type: actionTypes.SET_SELECTED_SERVICE,
                      payload: service,
                    })
                  }
                  className="mr-2"
                />
                <label className="font-semibold">
                  {service.service} - {formatIDR(service.cost[0].value)}
                </label>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
};

const PlaceOrder = () => {
  const { backendUrl, cartItems, token, formatIDR, getCartAmount } =
    useContext(ShopContext);

  const [selectedMethod, setSelectedMethod] = useState("cod");

  const {
    state,
    dispatch,
    handleProvinceChange,
    handleCityChange,
    handleOrderSubmission,
  } = usePlaceOrder(cartItems, backendUrl, token);

  if (!state) {
    return <div className="flex justify-center items-center">Loading...</div>;
  }

  const { formData, cities, isLoadingCost, cost, selectedService, provinces } =
    state;

  const totalCart = getCartAmount();
  const shippingCost = selectedService?.cost[0]?.value || 0;
  const totalOrder = totalCart + shippingCost;

  const onSubmitHandler = async (event) => {
    event.preventDefault();
  
    const orderItems = cartItems.map((item) => {
      let itemPrice = item.productPrice || 0;
  
      if (item.variant && item.variant.selectedOption) {
        const selectedOption = item.variant.selectedOption;
  
        itemPrice = selectedOption.optionPrice || itemPrice;
      } else if (item.variant) {
        itemPrice = item.variant.variantPrice || 0;
      }
  
      // Pastikan kita menyertakan semua data yang diperlukan terkait dengan variant
      const variantData = item.variant
        ? {
            variantId: item.variant.variantId,
            variantName: item.variant.variantName,
            selectedOption: item.variant.selectedOption
              ? {
                  optionId: item.variant.selectedOption.optionId,
                  optionName: item.variant.selectedOption.optionName,
                  optionPrice: item.variant.selectedOption.optionPrice,
                  optionSku: item.variant.selectedOption.optionSku,
                  optionStock: item.variant.selectedOption.optionStock,
                  optionWeight: item.variant.selectedOption.optionWeight,
                }
              : null,
          }
        : null;
  
      return {
        id: item.productId,
        name: item.productName,
        quantity: item.quantity,
        price: itemPrice,
        productName: item.productName,
        productDescription: item.productDescription,
        productCategory: item.productCategory,
        productSubCategory: item.productSubCategory,
        productImages: item.productImages,
        variant: variantData,  // Pastikan data variant dikirim dengan benar
      };
    });
  
    const orderData = {
      items: orderItems,
      address: {
        address: formData.address,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        province: formData.selectedProvince || "", // Default to empty if no province
        city: formData.selectedCity || "", // Default to empty if no city
      },
      amount: totalCart,
      ongkir: shippingCost,
    };
  
    handleOrderSubmission(selectedMethod, orderData);
  };
  

  // Fix: Ensuring province change only when needed
  useEffect(() => {
    if (formData.selectedProvince && !cities.length) {
      handleProvinceChange(formData.selectedProvince);
    }
  }, [formData.selectedProvince, cities.length, handleProvinceChange]);

  return (
    <form onSubmit={onSubmitHandler} className="p-4 border border-gray-300 rounded-md">
      <div className="flex space-x-8">
        <PlaceOrderForm
          formData={formData}
          dispatch={dispatch}
          handleProvinceChange={handleProvinceChange}
          handleCityChange={handleCityChange}
          provinces={provinces}
          cities={cities}
          isLoadingCost={isLoadingCost}
          cost={cost}
          selectedService={selectedService}
          formatIDR={formatIDR}
        />
        <div className="flex-1 space-y-4">
          <CartTotal />
          <div className="p-4 bg-gray-100 border rounded">
            <p className="font-semibold">
              Shipping Cost: {formatIDR(shippingCost)}
            </p>
            <p className="font-semibold text-lg">
              Total Order: {formatIDR(totalOrder)}
            </p>
          </div>
          <p>Choose Payment Method:</p>
          <PaymentMethodCOD
            selectedMethod={selectedMethod}
            setSelectedMethod={setSelectedMethod}
          />
          <PaymentMethodMidtrans
            selectedMethod={selectedMethod}
            setSelectedMethod={setSelectedMethod}
          />
          <button
            type="submit"
            className="w-full mt-4 bg-teal-500 text-white py-2 rounded"
          >
            Place Order
          </button>
        </div>
      </div>
    </form>
  );
};

export default PlaceOrder;
