import React from "react";
import { assets } from "../assets/assets";

const About = () => {
  return (
    <section
      className="flex flex-col md:flex-row items-center py-6 md:py-10 bg-white shadow-md rounded-lg"
      aria-label="About PT. Sukses Mulia Seimbang"
    >
      {/* Text Content */}
      <div className="w-full md:w-1/2 flex flex-col justify-center p-6 md:p-12">
        <p className="text-gray-500 mb-3 uppercase tracking-wide font-medium">
          About Us
        </p>
        <h1 className="text-3xl md:text-5xl font-bold leading-tight tracking-wide mb-4">
          PT. Sukses Mulia Seimbang
        </h1>
        <h2 className="text-lg text-gray-700 font-medium mb-4">
          Importer & Distributor Sandblasting & Textile Industry Solutions
        </h2>
        <p className="mb-4 text-gray-600">
          Didirikan pada tahun 2011, PT Sukses Mulia Seimbang adalah importir
          dan distributor terkemuka yang berbasis di Tangerang, Indonesia.
        </p>
        <p className="mb-4 text-gray-600">
          Kami memiliki dua brand utama:{" "}
          <strong>Purfequ®</strong> (Sandblasting, Vaporblasting, Chemical Spray, dan
          Sarung Tangan) serta <strong>SMS Petro</strong> (produk pendukung industri tekstil).
        </p>
        <p className="mb-4 text-gray-600">
          Sebagai titik distribusi utama, kami menyediakan berbagai produk industri
          Sandblasting, Vaporblasting, dan Tekstil, serta mengimpor berbagai
          peralatan perlindungan kerja dan media abrasif.
        </p>

        <div className="flex space-x-4 mt-6">
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition duration-200 shadow-md hover:shadow-lg"
            aria-label="Learn more about PT. Sukses Mulia Seimbang"
          >
            Learn More
          </button>
        </div>
      </div>

      {/* About Image */}
      <div className="w-full md:w-1/2 mt-2 md:mt-0">
        <img
          src={assets.hero_img}
          alt="PT. Sukses Mulia Seimbang - Sandblasting and Textile Solutions"
          className="w-full h-auto rounded-lg shadow-xl object-cover"
          loading="lazy"
          decoding="async"
        />
      </div>
    </section>
  );
};

export default About;
