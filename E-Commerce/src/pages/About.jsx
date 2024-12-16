import React from "react";
import { assets } from "../assets/assets";

const About = () => {
  return (
    <section className="flex flex-col md:flex-row h-screen py-2">
      <div className="w-full md:w-1/2 flex flex-col justify-center p-6 md:p-12">
        <p className="text-gray-500 mb-4">About As.</p>
        <h1 className="text-3xl md:text-5xl font-bold leading-tight tracking-wide mb-4">
          PT. Sukses Mulia Seimbang
        </h1>
        <p className="mb-4">
          Didirikan pada tahun 2011, PT Sukses Mulia Seimbang adalah importir
          dan distributor terkemuka yang berbasis di Tangerang, Indonesia.
        </p>
        <p className="mb-4">
          Brand Owner PT. Sukses Mulia Seimbang memiliki 2 Brand, Purfequ dan
          SMS Petro. Purfequ® berfokus pada Sandblasting, Vaporblasting,
          Chemical Spray dan Sarung Tangan. SMS Petro berfokus pada penyediaan
          kebutuhan pendukung bisnis tekstile.
        </p>
        <p className="mb-4">
          Distribusi PT. Sukses Mulia Seimbang adalah perusahaan yang berperan
          sebagai titik distribusi utama untuk berbagai produk kebutuhan
          industri Sandblasting, Vaportblasting, dan Tekstil.
        </p>
        <p className="mb-4">
          Importer PT. Sukses Mulia Seimbang mengimpor berbagai jenis peralatan,
          seperti tools sandblasting, media abrasif, serta perlengkapan
          pelindung diri yang esensial untuk keselamatan kerja.
        </p>

        <div className="flex space-x-4">
          <button className="bg-blue-500 text-white px-6 py-3 rounded-lg">
            Learn More
          </button>
        </div>
      </div>
      <div className="w-full md:w-1/2">
        <img
          src={assets.hero_img}
          alt="A laptop on a wooden desk with a chair"
          className="w-full h-full object-cover"
        />
      </div>
    </section>
  );
};

export default About;