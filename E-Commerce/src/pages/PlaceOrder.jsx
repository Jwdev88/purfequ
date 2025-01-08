import React, { useContext, useEffect, useState } from "react";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  VStack,
  HStack,
  Radio,
  RadioGroup,
  Spinner,
  Text,
} from "@chakra-ui/react";
import Title from "../components/Title";
import CartTotal from "../components/CartTotal";
import { ShopContext } from "../context/ShopContext";
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
  cities = [], // Ensure cities is always an array
  isLoadingCost,
  cost,
  selectedService,
  formatIDR,
}) => (
  <VStack spacing={4} flex={1}>
    <Title text1="DELIVERY" text2="INFORMATION" />

    <HStack spacing={4} w="full">
      <FormControl isRequired>
        <FormLabel>First Name</FormLabel>
        <Input
          name="firstName"
          value={formData.firstName || ""}
          onChange={(e) =>
            dispatch({
              type: actionTypes.SET_FORM_DATA,
              payload: { firstName: e.target.value },
            })
          }
        />
      </FormControl>
      <FormControl isRequired>
        <FormLabel>Last Name</FormLabel>
        <Input
          name="lastName"
          value={formData.lastName || ""}
          onChange={(e) =>
            dispatch({
              type: actionTypes.SET_FORM_DATA,
              payload: { lastName: e.target.value },
            })
          }
        />
      </FormControl>
    </HStack>
    <FormControl isRequired>
      <FormLabel>Email</FormLabel>
      <Input
        type="email"
        name="email"
        value={formData.email || ""}
        onChange={(e) =>
          dispatch({
            type: actionTypes.SET_FORM_DATA,
            payload: { email: e.target.value },
          })
        }
      />
    </FormControl>

    <FormControl isRequired>
      <FormLabel>Phone</FormLabel>
      <Input
        type="tel"
        name="phone"
        value={formData.phone || ""}
        onChange={(e) =>
          dispatch({
            type: actionTypes.SET_FORM_DATA,
            payload: { phone: e.target.value },
          })
        }
      />
    </FormControl>

    <FormControl isRequired>
      <FormLabel>Province</FormLabel>
      <Select
        value={formData.selectedProvince || ""} // Bind province value to state
        onChange={(e) => handleProvinceChange(e.target.value)}
      >
        <option value="">Select Province</option>
        {provinces.map((province) => (
          <option key={province.province_id} value={province.province_id}>
            {province.province}
          </option>
        ))}
      </Select>
    </FormControl>

    <FormControl isRequired>
      <FormLabel>City</FormLabel>
      <Select
        value={formData.selectedCity || ""} // Bind city value to state
        onChange={(e) => handleCityChange(e.target.value)}
        disabled={cities.length === 0} // Disable city select if no cities
      >
        <option value="">Select City</option>
        {cities.map((city) => (
          <option key={city.city_id} value={city.city_id}>
            {city.city_name}
          </option>
        ))}
      </Select>
    </FormControl>

    {isLoadingCost ? (
      <Spinner />
    ) : (
      cost && (
        <Box>
          <Text>Select Shipping Service:</Text>
          <RadioGroup
            onChange={(value) =>
              dispatch({
                type: actionTypes.SET_SELECTED_SERVICE,
                payload: cost.find((service) => service.service === value),
              })
            }
            value={selectedService?.service || ""}
          >
            {cost.map((service) => (
              <Radio key={service.service} value={service.service}>
                {service.service} - {formatIDR(service.cost[0].value)}
              </Radio>
            ))}
          </RadioGroup>
        </Box>
      )
    )}
  </VStack>
);

const PlaceOrder = () => {
  const {
    backendUrl,
    cartItems,
    token,
    formatIDR,
    state: shopState,
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
    return <Spinner />;
  }

  const { formData, cities, isLoadingCost, cost, selectedService, provinces } =
    state;

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    const orderItems = cartItems.map((item) => ({
      productId: item.productId,
      variantId: item.variantId,
      optionId: item.optionId,
      quantity: item.quantity,
      totalPrice:
        item.variant?.selectedOption?.optionPrice ?? item.productPrice ?? 0,
    }));

    const userId = shopState.userId; // Pastikan userId diambil dari ShopContext

    handleSubmit(orderItems, { ...formData, userId });
  };

  useEffect(() => {
    if (formData.selectedProvince && !cities.length) {
      handleProvinceChange(formData.selectedProvince);
    }
  }, [formData.selectedProvince, handleProvinceChange, cities.length]);

  return (
    <Box
      as="form"
      onSubmit={onSubmitHandler}
      p={4}
      borderWidth={1}
      rounded="md"
    >
      <HStack spacing={8} align="start">
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
        <Box flex={1}>
          <CartTotal />
          <Text>Choose Payment Method : </Text>
          <PaymentMethodCOD
            selectedMethod={selectedMethod}
            setSelectedMethod={setSelectedMethod}
          />
          <PaymentMethodMidtrans
            selectedMethod={selectedMethod}
            setSelectedMethod={setSelectedMethod}
          />
          <Button type="submit" colorScheme="teal" w="full" mt={4}>
            Place Order
          </Button>
        </Box>
      </HStack>
    </Box>
  );
};

export default PlaceOrder;
