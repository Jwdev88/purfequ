import React from "react";
import { assets } from "../assets/assets";
import { Mail, Phone, Facebook, Instagram, Twitter } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  const menuItems = [
    { name: "Home", path: "/" },
    { name: "About Us", path: "/about" },
    { name: "Delivery", path: "/delivery" },
    { name: "Privacy Policy", path: "/privacy" },
  ];

  return (
    <footer className="mt-40 text-sm"> {/* BG tetap sama */}
      <div className="container mx-auto px-6 grid grid-cols-1 sm:grid-cols-[3fr_1fr_1fr] gap-10">
        {/* Logo & Deskripsi */}
        <div>
          <img className="mb-5 w-32" src={assets.logo2} alt="Purfequ Logo" />
          <p className="w-full md:w-2/3 text-gray-600">
            Discover high-quality products with Purfequ. We prioritize customer satisfaction and deliver excellence.
          </p>
        </div>

        {/* Navigation */}
        <nav aria-label="Company Navigation">
          <p className="text-xl font-medium mb-5">COMPANY</p>
          <ul className="flex flex-col gap-2 text-gray-600">
            {menuItems.map((item, index) => (
              <li key={index}>
                <Link to={item.path} className="hover:text-blue-600 transition">
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Contact */}
        <div>
          <p className="text-xl font-medium mb-5">GET IN TOUCH</p>
          <ul className="flex flex-col gap-2 text-gray-600">
            <li className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-gray-500" />
              <span>089614299962</span>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-500" />
              <span>contact@purfequ.com</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Social Media */}
      <div className="text-center mt-8">
        <p className="font-medium text-gray-700">Follow us on</p>
        <div className="flex justify-center gap-4 mt-2">
          <a href="https://facebook.com" aria-label="Facebook" target="_blank" rel="noopener noreferrer">
            <Facebook className="w-5 h-5 text-gray-500 hover:text-blue-600 transition" />
          </a>
          <a href="https://instagram.com" aria-label="Instagram" target="_blank" rel="noopener noreferrer">
            <Instagram className="w-5 h-5 text-gray-500 hover:text-pink-500 transition" />
          </a>
          <a href="https://twitter.com" aria-label="Twitter" target="_blank" rel="noopener noreferrer">
            <Twitter className="w-5 h-5 text-gray-500 hover:text-blue-400 transition" />
          </a>
        </div>
      </div>

      {/* Copyright */}
      <div className="mt-8">
        <hr className="border-gray-300" />
        <p className="py-5 text-sm text-center text-gray-500">
          Copyright 2024 @purfequ.com - All Rights Reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
