import React from 'react';
import { assets } from '../assets/assets';

const Hero = () => {
  return (
    <div className="flex flex-col md:flex-row h-screen py-2">
      {/* Text Content */}
      <div className="w-full md:w-1/2 flex flex-col justify-center p-6 md:p-12">
        <p className="text-gray-500 mb-4">SURFACE PREPARATION EXPERTS</p>
        <h1 className="text-2xl md:text-4xl font-bold mb-4">
          Discover our advanced Sandblasting and VaporBlasting solutions. Achieve a flawless finish efficiently.
        </h1>
        <div className="flex space-x-4">
          <button className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition duration-200">
            SHOP NOW
          </button>
        </div>
      </div>

      {/* Hero Image */}
      <div className="w-full md:w-1/2 flex justify-center items-center p-4 md:p-6">
        <img
          src={assets.hero_img}
          alt="Sandblasting and VaporBlasting equipment"
          className="w-full h-auto max-h-[80vh] object-cover rounded-lg shadow-lg"
          loading="lazy"
        />
      </div>
    </div>
  );
};

export default Hero;
