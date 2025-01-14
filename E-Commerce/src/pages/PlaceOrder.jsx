import React, { useContext, useEffect, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import Title from "../components/Title";
import CartTotal from "../components/CartTotal";
import usePlaceOrder from "../hooks/usePlaceOrder";
import { actionTypes } from "../context/actionTypes";
import PaymentMethodCOD from "./PaymentMethodCOD";
import PaymentMethodMidtrans from "./PaymentMethodMidtrans";

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
}) => (
  <div className="space-y-4 flex-1">
    <Title text1="DELIVERY" text2="INFORMATION" />

    <div className="space-x-4 flex w-full">
      <div className="w-full">
        <label className="block font-semibold">First Name</label>
        <input
          type="text"
          name="firstName"
          value={formData.firstName || ""}
          onChange={(e) =>
            dispatch({
              type: actionTypes.SET_FORM_DATA,
              payload: { firstName: e.target.value },
            })
          }
          className="w-full p-2 border border-gray-300 rounded"
        />
      </div>
      <div className="w-full">
        <label className="block font-semibold">Last Name</label>
        <input
          type="text"
          name="lastName"
          value={formData.lastName || ""}
          onChange={(e) =>
            dispatch({
              type: actionTypes.SET_FORM_DATA,
              payload: { lastName: e.target.value },
            })
          }
          className="w-full p-2 border border-gray-300 rounded"
        />
      </div>
    </div>

    <div>
      <label className="block font-semibold">Email</label>
      <input
        type="email"
        name="email"
        value={formData.email || ""}
        onChange={(e) =>
          dispatch({
            type: actionTypes.SET_FORM_DATA,
            payload: { email: e.target.value },
          })
        }
        className="w-full p-2 border border-gray-300 rounded"
      />
    </div>

    <div>
      <label className="block font-semibold">Phone</label>
      <input
        type="tel"
        name="phone"
        value={formData.phone || ""}
        onChange={(e) =>
          dispatch({
            type: actionTypes.SET_FORM_DATA,
            payload: { phone: e.target.value },
          })
        }
        className="w-full p-2 border border-gray-300 rounded"
      />
    </div>

    <div>
      <label className="block font-semibold">Address</label>
      <textarea
        name="address"
        value={formData.address || ""}
        onChange={(e) =>
          dispatch({
            type: actionTypes.SET_FORM_DATA,
            payload: { address: e.target.value },
          })
        }
        className="w-full p-2 border border-gray-300 rounded"
        rows={3}
      />
    </div>

    <div>
      <label className="block font-semibold">Province</label>
      <select
        value={formData.selectedProvince || ""}
        onChange={(e) => handleProvinceChange(e.target.value)}
        className="w-full p-2 border border-gray-300 rounded"
      >
        <option value="">Select Province</option>
        {provinces.map((province) => (
          <option key={province.province_id} value={province.province_id}>
            {province.province}
          </option>
        ))}
      </select>
    </div>

    <div>
      <label className="block font-semibold">City</label>
      <select
        value={formData.selectedCity || ""}
        onChange={(e) => handleCityChange(e.target.value)}
        disabled={cities.length === 0}
        className="w-full p-2 border border-gray-300 rounded"
      >
        <option value="">Select City</option>
        {cities.map((city) => (
          <option key={city.city_id} value={city.city_id}>
            {city.city_name}
          </option>
        ))}
      </select>
    </div>

    {isLoadingCost ? (
      <div className="flex justify-center items-center p-4">
        <div className="spinner-border animate-spin" />
      </div>
    ) : (
      cost && (
        <div className="space-y-4">
          <p>Select Shipping Service:</p>
          <div>
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
        </div>
      )
    )}
  </div>
);

const PlaceOrder = () => {
  const {
    backendUrl,
    cartItems,
    token,
    formatIDR,
    state: shopState,
    getCartAmount
  } = useContext(ShopContext);
  const [selectedMethod, setSelectedMethod] = useState("cod");

  const {
    state,
    dispatch,
    handleProvinceChange,
    handleCityChange,
    handleSubmit,
  } = usePlaceOrder(cartItems, backendUrl, token);

  if (!state) {
    console.log("State tidak terdefinisi");
    return <div className="flex justify-center items-center">Loading...</div>;
  }

  const { formData, cities, isLoadingCost, cost, selectedService, provinces } = state;

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    const orderItems = cartItems.map((item) => ({
      productId: item.productId,
      variantId: item.variantId,
      optionId: item.optionId,
      quantity: item.quantity,
      totalPrice:totalCart+shippingCost
    }));

    

    handleSubmit(orderItems, { ...formData, token });
  };

  useEffect(() => {
    if (formData.selectedProvince && !cities.length) {
      handleProvinceChange(formData.selectedProvince);
    }
  }, [formData.selectedProvince, handleProvinceChange, cities.length]);

  // Menghitung total harga pesanan
  const totalCart = getCartAmount();

  const shippingCost = selectedService?.cost[0]?.value || 0;
  const totalOrder = totalCart + shippingCost;

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
            <p className="font-semibold">Shipping Cost: {formatIDR(shippingCost)}</p>
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