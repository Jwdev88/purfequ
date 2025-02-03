import React, { useContext, useEffect, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import Title from "../components/Title";
import CartTotal from "../components/CartTotal";
import usePlaceOrder from "../hooks/usePlaceOrder";
import { actionTypes } from "../context/actionTypes";
import PaymentMethodCOD from "./PaymentMethodCOD";
import PaymentMethodMidtrans from "./PaymentMethodMidtrans";

const InputField = ({
  label,
  name,
  value,
  onChange,
  type = "text",
  error = "",
}) => (
  <div className={`space-y-2`}>
    <label htmlFor={name} className="block font-semibold">
      {label}
    </label>
    {type === "textarea" ? (
      <textarea
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        className={`w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 ${
          error ? "border-red-500" : "border-gray-300"
        }`}
        rows={3}
      />
    ) : (
      <input
        id={name}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        className={`w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 ${
          error ? "border-red-500" : "border-gray-300"
        }`}
      />
    )}
    {error && <p className="text-sm text-red-500">{error}</p>}
  </div>
);

const SelectField = ({
  label,
  value,
  onChange,
  options,
  disabled = false,
  error = "",
}) => (
  <div className="space-y-2">
    <label htmlFor={label} className="block font-semibold">
      {label}
    </label>
    <select
      id={label}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={`w-full p-3 border rounded-md focus:outline-none focus:ring-2 ${
        error ? "border-red-500" : "border-gray-300"
      }`}
    >
      <option value="">Select {label}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
    {error && <p className="text-sm text-red-500">{error}</p>}
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
    <div className="space-y-6 flex-1">
      <Title text1="DELIVERY" text2="INFORMATION" />
      <div className="space-x-4 flex w-full flex-wrap">
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
          <div className="spinner-border animate-spin"></div>
          <p className="ml-2">Loading shipping options...</p>
        </div>
      ) : (
        formData.selectedProvince &&
        formData.selectedCity &&
        (cost && cost.length > 0 ? (
          <div className="space-y-4">
            <p>Select Shipping Service:</p>
            {cost.map((service) => (
              <div
                key={service.service}
                className="flex items-center space-x-4"
              >
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
                  {service.description} - {formatIDR(service.cost[0].value)}{" "}
                  (ETD: {service.cost[0].etd} days)
                </label>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 bg-yellow-100 border border-yellow-400 rounded-md">
            <p className="text-yellow-600 font-semibold">
              No available shipping options or cost is zero.
            </p>
            <p>
              Please check the selected province and city for valid services.
            </p>
          </div>
        ))
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
  const totalWeightGram = cartItems.reduce((total, item) => {
    const itemWeight =
      item.variant?.selectedOption?.optionWeight ?? item.productWeight ?? 0;
    return total + itemWeight * item.quantity;
  }, 0);

  const totalWeightKg = totalWeightGram / 1000; // Konversi gram ke kg

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
        price: itemPrice,
        variant: variantData,
        image: item.productImages[0],
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
        province: formData.selectedProvince || "",
        city: formData.selectedCity || "",
      },
      amount: totalCart,
      ongkir: shippingCost,
    };
    handleOrderSubmission(selectedMethod, orderData);
  };

  useEffect(() => {
    if (formData.selectedProvince && !cities.length) {
      handleProvinceChange(formData.selectedProvince);
    }
  }, [formData.selectedProvince, cities.length, handleProvinceChange]);

  return (
    <form
      onSubmit={onSubmitHandler}
      className="p-6 border rounded-md bg-white shadow-md"
    >
      <div className="flex space-x-8 flex-wrap">
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
        <div className="flex-1 space-y-6">
          {/* Subtotal, Shipping Cost, Total Order komponen terpisah */}
          <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span>SubTotal Pesanan</span>
                <span>{formatIDR(totalCart)}</span>
              </div>

              {/* Shipping Cost */}
              <div className="flex justify-between">
            
                <span>Shipping Cost ({totalWeightKg} kg)</span>
                <span>
                  {formatIDR(shippingCost)}
                  <br />
                  <span className="text-xs text-gray-500"></span>
                </span>
              </div>

              <div className="border-t border-gray-300 dark:border-gray-700 pt-2" />

              {/* Total Order */}
              <div className="flex justify-between text-xl font-semibold">
                <span>Total Order</span>
                <span>{formatIDR(totalOrder)}</span>
              </div>
            </div>
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
        </div>
      </div>
    </form>
  );
};

export default PlaceOrder;
