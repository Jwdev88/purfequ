import React, { useContext, useState, useMemo, useEffect } from "react";
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
    const { formatIDR,  clearCart, cartItems } = useContext(ShopContext); 

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

    const itemsToCheckout = useMemo(() => {
      const buyNowItem = localStorage.getItem('buyNowItem');
      const checkoutItems = localStorage.getItem('checkoutItems');

      if (buyNowItem) {
          try {
              const parsedItem = JSON.parse(buyNowItem);
              console.log("PlaceOrder - itemsToCheckout (buyNowItem):", parsedItem); 
              return [{
                  productId: parsedItem.productId,
                  productName: parsedItem.productName,
                  productImages: parsedItem.productImages,
                  productPrice: parsedItem.productPrice,
                  productStock: parsedItem.productStock,
                  productSku: parsedItem.productSku,
                  productWeight: parsedItem.productWeight,
                  quantity: parsedItem.quantity,
                  variant: parsedItem.variant ? {
                      variantId: parsedItem.variant.variantId,
                      variantName: parsedItem.variant.variantName,
                      selectedOption: parsedItem.variant.selectedOption ? {
                        optionId: parsedItem.variant.selectedOption.optionId,
                        optionName: parsedItem.variant.selectedOption.optionName,
                        optionPrice: parsedItem.variant.selectedOption.optionPrice,
                        optionStock: parsedItem.variant.selectedOption.optionStock,
                        optionSku: parsedItem.variant.selectedOption.optionSku,
                         optionWeight: parsedItem.variant.selectedOption.optionWeight
                      } : null,
                  } : null,
                  totalPrice: (parsedItem.variant?.selectedOption?.optionPrice ?? parsedItem.productPrice) * parsedItem.quantity
              }];
          } catch (error) {
              console.error("Error parsing buyNowItem:", error);
              toast.error("Data item 'Beli Sekarang' tidak valid.");
              return [];
          }
      } else if (checkoutItems) {
          try {
              const parsedItems = JSON.parse(checkoutItems);
              console.log("PlaceOrder - itemsToCheckout (checkoutItems):", parsedItems); 
              return parsedItems;
          } catch (error) {
              console.error("Error parsing checkoutItems:", error);
              toast.error("Data item checkout tidak valid.");
              return [];
          }
      }
      console.log("PlaceOrder - itemsToCheckout (cartItems):", cartItems); 
      return cartItems;
    }, [cartItems]);

    const onSubmitHandler = (event) => {
        event.preventDefault();

        if (!validateForm()) {
            return;
        }

        const orderItems = itemsToCheckout.map((item) => {
        const price =
          item.variant?.selectedOption?.optionPrice ??
          item.variant?.variantPrice ??
          item.productPrice ?? 0;
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
          cityId: formData.city,
          postalCode: formData.postalCode,
        },
        amount: totalCart, 
        ongkir: shippingCost, 
        paymentMethod: "midtrans",
        };

        handleOrderSubmission(orderData);
    };

    useEffect(() => {
        if (state.orderId) {
            localStorage.removeItem('buyNowItem');
            localStorage.removeItem('checkoutItems');
        }
    }, [state.orderId]);

    const { totalWeightKg, totalCart, shippingCost, totalOrder } = useMemo(() => {
        if (!itemsToCheckout || itemsToCheckout.length === 0) {
            return { totalWeightKg: 0, totalCart: 0, shippingCost: 0, totalOrder: 0 };
        }
        const totalWeightGram = itemsToCheckout.reduce((total, item) => {
            const itemWeight =
                item.variant?.selectedOption?.optionWeight ?? item.productWeight ?? 0;
            return total + itemWeight * item.quantity;
        }, 0);

        const totalWeightKg = totalWeightGram / 1000;
        const totalCart = itemsToCheckout.reduce((total, item) => {
            const itemPrice = item.variant?.selectedOption?.optionPrice ?? item.productPrice;
            return total + (itemPrice * item.quantity);
        }, 0);

        const shippingCost = selectedService?.cost[0]?.value || 0;
        const totalOrder = totalCart + shippingCost;
        return { totalWeightKg, totalCart, shippingCost, totalOrder };
    }, [itemsToCheckout, selectedService]);

    const [errors, setErrors] = useState({});

    const validateForm = () => {
        const newErrors = {};

        if (!formData.firstName.trim()) newErrors.firstName = "Nama Depan harus diisi";
        if (!formData.lastName.trim()) newErrors.lastName = "Nama Belakang harus diisi";
        if (!formData.email.trim() || !validateEmail(formData.email))
            newErrors.email = "Email yang valid harus diisi";
        if (!formData.phone.trim() || !validatePhone(formData.phone))
            newErrors.phone = "Nomor Telepon yang valid harus diisi";
        if (!formData.address.trim()) newErrors.address = "Alamat harus diisi";
        if (!formData.province) newErrors.province = "Provinsi harus dipilih";
        if (!formData.city) newErrors.city = "Kota harus dipilih";
        if (!formData.postalCode) newErrors.postalCode = "Kode Pos harus diisi";

        if (!selectedService) {
            toast.error("Silakan pilih layanan pengiriman.");
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

    return (
        <form onSubmit={onSubmitHandler} className="p-6 border rounded-md bg-white shadow-md">
            <div className="flex space-x-8 flex-wrap">
                <div className="space-y-6 flex-1">
                    <h2 className="text-xl font-bold mb-4">Informasi Pengiriman</h2>
                    <div className="space-x-4 flex w-full flex-wrap">
                        <InputField
                            label="Nama Depan"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleInputChange}
                            error={errors.firstName}
                            required
                        />
                        <InputField
                            label="Nama Belakang"
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
                        label="Telepon"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleInputChange}
                        error={errors.phone}
                        required
                    />
                    <TextareaField
                        label="Alamat"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        error={errors.address}
                        required
                    />

                    <InputField
                        label="Kode Pos"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleInputChange}
                        error={errors.postalCode}
                        required
                    />

                    <SelectField
                        label="Provinsi"
                        value={formData.province}
                        onChange={(value) => handleProvinceChange(value)}
                        options={provinces.map((province) => ({
                            value: province.province_id,
                            label: province.province,
                        }))}
                        error={errors.province}
                    />

                    <SelectField
                        label="Kota"
                        value={formData.city}
                        onChange={(value) => handleCityChange(value)}
                        options={cities.map((city) => ({
                            value: city.city_id,
                            label: city.city_name,
                        }))}
                        disabled={cities.length === 0}
                        error={errors.city}
                    />

                    <Button type="button" onClick={handleAddNewAddress} className="mt-2">
                        Tambah Alamat Baru
                    </Button>

                    {isLoadingCost ? (
                        <div className="flex items-center">
                            <Loader2Icon className="animate-spin mr-2" />
                            <span>Memuat opsi pengiriman...</span>
                        </div>
                    ) : (
                        formData.province &&  
                        formData.city &&      
                        cost && cost.length > 0 && (
                            <div className="space-y-4">
                                <p className="font-semibold">Pilih Layanan Pengiriman:</p>
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
                                            {service.description} - {formatIDR(service.cost[0].value)} (ETD: {service.cost[0].etd} hari)
                                        </label>
                                    </div>
                                ))}
                            </div>
                        )
                    )}
                </div>

                <div className="flex-1 space-y-6">
                    <div className="p-6 bg-gray-50 rounded-lg shadow-md">
                        <h3 className="text-lg font-semibold mb-4">Ringkasan Pesanan</h3>
                        <div className="space-y-4 text-sm">
                            <div className="flex justify-between">
                                <span>SubTotal Pesanan</span>
                                <span>{formatIDR(totalCart)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Biaya Pengiriman ({totalWeightKg} kg)</span>
                                <span>{formatIDR(shippingCost)}</span>
                            </div>
                            <div className="border-t border-gray-300 pt-2" />
                            <div className="flex justify-between text-xl font-semibold">
                                <span>Total Pesanan</span>
                                <span>{formatIDR(totalOrder)}</span>
                            </div>
                        </div>
                    </div>

                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? (
                            <div className="flex justify-center items-center">
                                <Loader2Icon className="animate-spin h-5 w-5 mr-2" />
                                Processing...
                            </div>
                        ) : (
                            "Bayar Pesanan"
                        )}
                    </Button>
                </div>
            </div>
        </form>
    );
};

export default PlaceOrder;
