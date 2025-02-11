import React from 'react';
import { assets } from '../assets/assets';
import { Link } from 'react-router-dom'; // Import Link


const Hero = () => {
  return (
    <section className="bg-gray-50 py-12 md:py-20"> {/* Added background and padding */}
      <div className="container mx-auto px-4"> {/* Added container */}
        <div className="flex flex-col md:flex-row items-center"> {/* Removed h-screen, added items-center */}
          {/* Text Content */}
          <div className="w-full md:w-1/2 md:pr-16"> {/* Added padding-right on larger screens */}
            <p className="uppercase tracking-wide text-sm font-medium text-gray-500 mb-4">
              Surface Preparation Experts
            </p>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
              Advanced Sandblasting & VaporBlasting Solutions
            </h1>
            <p className="text-gray-700 mb-8 leading-relaxed">
                Achieve flawless finishes efficiently with our cutting-edge equipment and supplies.
            </p>
            <div className="flex space-x-4">
              <Link to="/collection" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3 rounded-full transition duration-200 shadow-md hover:shadow-lg">
                Explore Collection
              </Link>
              <Link to="/about" className="inline-block bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold px-8 py-3 rounded-full transition duration-200">
                Learn More
              </Link>
            </div>
          </div>

          {/* Hero Image */}
          <div className="w-full md:w-1/2 mt-8 md:mt-0"> {/* Added margin-top for spacing on mobile */}
            <img
              src={assets.hero_img}
              alt="Technician using vapor blasting equipment on a metal part" // More descriptive alt text
              className="w-full h-auto rounded-lg shadow-xl object-cover" // Removed max-h, added object-cover
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;