import React, { useContext, useState, useEffect } from "react";
import Title from "../components/Title";
import CartTotal from "../components/CartTotal";
import { assets } from "../assets/assets";
import { ShopContext } from "../context/ShopContext";
import axios from "axios";
import { toast } from "react-toastify";

const PlaceOrder = () => {
  const {
    navigate,
    backendUrl,
    cartItems,
    setCartItems,
    getCartAmount,
    products,
    token,
    provinces,
    cities,
    selectedProvince,
    setSelectedProvince,
    selectedCity,
    setSelectedCity,
    fetchCities,
    calculateCost,
    formatIDR,
  } = useContext(ShopContext);

  const [selectedService, setSelectedService] = useState(null);
  const [method, setMethod] = useState("cod");
  const [cost, setCost] = useState(null);
  const [isLoadingCost, setIsLoadingCost] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    alamat: "",
    city: selectedCity,
    state: selectedProvince,
    kodepos: "",
    phone: "",
  });

  useEffect(() => {
    // Fungsi untuk mengupdate cost dan formData
    const updateCostAndFormData = async () => {
      setCost(null);
      setIsLoadingCost(true);
      
      if (selectedCity) {
        try {
          const result = await calculateCost(selectedCity, 1000, "jne");
          setCost(result);
        } catch (error) {
          console.error("Error calculating cost:", error);
          toast.error("Failed to calculate shipping cost");
        }
      }

      setFormData((prevData) => ({
        ...prevData,
        city: selectedCity,
        state: selectedProvince,
      }));

      setIsLoadingCost(false);
    };

    // Panggil fungsi updateCostAndFormData dengan debounce
    const debouncedUpdate = debounce(updateCostAndFormData, 300);
    debouncedUpdate();
  }, [selectedCity, selectedProvince, calculateCost]);

  // Fungsi debounce
  function debounce(func, delay) {
    let timeoutId;
    return function () {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func.apply(this, arguments);
      }, delay);
    };
  }

  const handleProvinceChange = (event) => {
    const provinceId = event.target.value;
    setSelectedProvince(provinceId);
    fetchCities(provinceId);
    setSelectedCity("");
  };

  const handleCityChange = (event) => {
    setSelectedCity(event.target.value);
  };

  const onChangeHandler = (event) => {
    const { name, value } = event.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    try {
      const orderItems = Object.entries(cartItems).reduce(
        (acc, [productId, sizes]) => {
          Object.entries(sizes).forEach(([size, quantity]) => {
            if (quantity > 0) {
              const itemInfo = structuredClone(
                products.find((product) => product._id === productId),
              );
              if (itemInfo) {
                itemInfo.size = size;
                itemInfo.quantity = quantity;
                acc.push(itemInfo);
              }
            }
          });
          return acc;
        },
        [],
      );

      const orderData = {
        address: formData,
        items: orderItems,
        amount:
          getCartAmount() +
          (selectedService ? selectedService.cost[0].value : 0),
        shippingService: selectedService,
      };

      let response;
      switch (method) {
        case "cod":
          response = await axios.post(
            backendUrl + "/api/order/place",
            orderData,
            { headers: { token } },
          );
          if (response.data.success) {
            setCartItems({});
            navigate("/orders");
            toast.success("Order placed successfully!");
          } else {
            toast.error(response.data.message);
          }
          break;
        case "midtrans":
          response = await axios.post(
            backendUrl + "/api/order/midtrans",
            orderData,
            { headers: { token } },
          );
          if (response.data.success) {
            localStorage.setItem(
              "midtransTransactionToken",
              response.data.token,
            );
            window.snap.pay(response.data.token, {
              onSuccess: () => {
                setCartItems({});
                navigate("/orders");
                toast.success("Order placed successfully!");
              },
              onPending: (result) => console.log("Pending:", result),
              onError: (result) => {
                console.error("Error:", result);
                toast.error("Payment failed");
              },
              onClose: () => console.log("Closed"),
            });
          } else {
            toast.error(response.data.message);
          }
          break;
        default:
          break;
      }
    } catch (error) {
      console.error("Error placing order:", error);
      toast.error("Failed to place order");
    }
  };

  return (
    <form
      onSubmit={onSubmitHandler}
      className="flex flex-col sm:flex-row justify-between gap-4 pt-2 sm:pt-2 min-h-[80vh] border-t"
    >
      {/* Left side */}
      <div className="flex flex-col gap-4 w-full sm:max-w-[480px]">
        <div className="text-xl sm:text-2xl my-3">
          <Title text1={"DELIVERY"} text2={"INFORMATION"} />
        </div>
        <div className="flex gap-3">
          <input
            required
            onChange={onChangeHandler}
            name="firstName"
            value={formData.firstName}
            className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
            type="text"
            placeholder="First Name"
          />
          <input
            required
            onChange={onChangeHandler}
            name="lastName"
            value={formData.lastName}
            className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
            type="text"
            placeholder="Last Name"
          />
        </div>
        <input
          required
          onChange={onChangeHandler}
          name="email"
          value={formData.email}
          className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
          type="email"
          placeholder="Email address"
        />

        <input
          required
          onChange={onChangeHandler}
          name="phone"
          value={formData.phone}
          className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
          type="number"
          placeholder="Phone"
        />

        <input
          required
          onChange={onChangeHandler}
          name="kodepos"
          value={formData.kodepos}
          className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
          type="text"
          placeholder="Kode Pos"
        />
        <textarea
          inputMode="text"
          name="alamat"
          cols="40"
          rows="2"
          className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
          placeholder="Detail Alamat"
          value={formData.alamat}
          onChange={onChangeHandler}
          required
        ></textarea>
        <div className="flex gap-3">
          {/* Provinsi dropdown */}
          <div className="w-full">
            <label htmlFor="province"></label>
            <select
              id="province"
              value={selectedProvince}
              onChange={handleProvinceChange}
              className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
            >
              <option value="">Pilih Provinsi</option>
              {provinces.map((province) => (
                <option
                  key={province.province_id}
                  value={province.province_id}
                >
                  {province.province}
                </option>
              ))}
            </select>
          </div>
          {/* Kota dropdown */}
          <div className="w-full">
            <label htmlFor="city"></label>
            <select
              id="city"
              value={selectedCity}
              onChange={handleCityChange}
              disabled={!selectedProvince}
              className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
            >
              <option value="">Pilih Kota/Kabupaten</option>
              {cities.map((city) => (
                <option key={city.city_id} value={city.city_id}>
                  {city.city_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {isLoadingCost && <p>Loading shipping cost...</p>}

        {cost && (
          <div>
            <h3>Pilih Layanan Pengiriman:</h3>
            {cost.map((service) => (
              <div key={service.service} className="border p-2 mb-2">
                <input
                  type="radio"
                  id={service.service}
                  name="shippingService"
                  value={service.service}
                  checked={selectedService === service}
                  onChange={() => setSelectedService(service)}
                />
                <label htmlFor={service.service} className="ml-2">
                  {service.service} - {service.description} (
                  {formatIDR(service.cost[0].value)})
                </label>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right side */}
      <div className="w-full sm:w-1/2">
        <div className="mt-8 min-w-80">
          <CartTotal />
          {/* Display the calculated shipping cost */}
          <div className="flex flex-col gap-2 mt-2 text-sm">
            <div className="flex justify-between">
              <p>Total Biaya Pengiriman</p>
              {selectedService && (
                <p>{formatIDR(selectedService.cost[0].value)}</p>
              )}
            </div>

            <hr />

            {/* Calculate and display the total cost */}
            <div className="flex justify-between">
              <p>Total Pesanan</p>
              {selectedService && (
                <p className="font-semibold">
                  {formatIDR(
                    getCartAmount() + selectedService.cost[0].value,
                  )}
                </p>
              )}
            </div>

            <hr />
          </div>
          <div className="mt-12">
            <Title text1={"PAYMENT"} text2={"METHOD"} />
            {/* PAYMENT SELECT */}
            <div className="flex gap-3 flex-col lg:flex-row">
              <div
                onClick={() => setMethod("midtrans")}
                className="flex items-center gap-3 border p-2 px-3 cursor-pointer"
              >
                <p
                  className={`min-w-3.5 h-3.5 border rounded-full ${
                    method === "midtrans" ? "bg-green-500" : ""
                  }`}
                >
              
                </p>
                <p className="text-gray-500 text-sm font-medium mx-4">
                  MIDTRANS
                </p>
                <img className="h-5 mx-4 " src={assets.midtrans_logo} alt="" />
              </div>
              <div
                onClick={() => setMethod("cod")}
                className="flex items-center gap-3 border p-2 px-3 cursor-pointer"
              >
                <p
                  className={`min-w-3.5 h-3.5 border rounded-full ${
                    method === "cod" ? "bg-green-500" : ""
                  }`}
                ></p>
                <p className="text-gray-500 text-sm font-medium mx-4">
                  CASH ON DELIVERY
                </p>
              </div>
            </div>
          </div>
          <div className="w-full text-end mt-8">
            <button type="submit" className="bg-black text-white px-16 py-3 text-sm">
              Pembayaraan
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default PlaceOrder;