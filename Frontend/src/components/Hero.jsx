import React from 'react';
import { assets } from '../assets/assets';
import { Link } from 'react-router-dom';

const Hero = () => {
  return (
    <section className="bg-gray-50 py-12 md:py-20" aria-label="Hero Section">
      <div className="container mx-auto px-6 flex flex-col md:flex-row items-center">
        {/* Text Content */}
        <div className="w-full md:w-1/2 md:pr-12">
          <p className="uppercase tracking-wide text-sm font-medium text-gray-500 mb-4">
            Surface Preparation Experts
          </p>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
            Advanced Sandblasting & VaporBlasting Solutions
          </h1>
          <h2 className="text-lg text-gray-700 mb-6 leading-relaxed">
            Achieve flawless finishes efficiently with our cutting-edge equipment and supplies.
          </h2>
          <div className="flex flex-wrap gap-4">
            <Link
              to="/collection"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3 rounded-full transition duration-200 shadow-md hover:shadow-lg"
              aria-label="Explore our collection"
            >
              Explore Collection
            </Link>
            <Link
              to="/about"
              className="inline-block bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold px-8 py-3 rounded-full transition duration-200"
              aria-label="Learn more about us"
            >
              Learn More
            </Link>
          </div>
        </div>

        {/* Hero Image */}
        <div className="w-full md:w-1/2 mt-8 md:mt-0">
          <img
            src={assets.hero_img}
            alt="A technician using vapor blasting equipment on a metal part to achieve a smooth finish"
            className="w-full h-auto rounded-lg shadow-xl object-cover"
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>
    </section>
  );
};

export default Hero;
