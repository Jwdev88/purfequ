import React from "react";
import { assets } from "../assets/assets";

const policyData = [
  {
    icon: assets.exchange_icon,
    title: "Easy Exchange",
    description: "Hassle-free exchange policy for all products.",
    alt: "Exchange Policy Icon",
  },
  {
    icon: assets.fast_shipping_icon, // Gantilah dengan ikon pengiriman cepat
    title: "Fast Shipping",
    description: "We provide fast & reliable shipping across all regions.",
    alt: "Fast Shipping Icon",
  },
  {
    icon: assets.customer_support_icon, // Gantilah dengan ikon dukungan pelanggan
    title: "24/7 Customer Support",
    description: "Our support team is always available to assist you.",
    alt: "Customer Support Icon",
  },
];

const OurPolicy = () => {
  return (
    <section className="py-20 text-center">
      <h2 className="text-2xl font-semibold text-gray-900 mb-8">
        Our <span className="text-blue-600">Policy</span>
      </h2>

      <div className="flex flex-col sm:flex-row justify-around gap-12 sm:gap-6 text-xs sm:text-sm md:text-base text-gray-700">
        {policyData.map((policy, index) => (
          <div key={index} className="max-w-xs mx-auto">
            <img src={policy.icon} className="w-12 m-auto mb-5" alt={policy.alt} />
            <p className="font-semibold">{policy.title}</p>
            <p className="text-gray-500">{policy.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default OurPolicy;
