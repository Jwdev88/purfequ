import React from 'react'
import {assets} from '../assets/assets'

const Hero = () => {
  return (
    <div className="flex flex-col md:flex-row h-screen py-2">
    <div className="w-full md:w-1/2 flex flex-col justify-center p-6 md:p-12">
        <p className="text-gray-500 mb-4">OUR BEST PRODUCT.</p>
        <h1 className="text-3xl md:text-5xl font-bold mb-4">Data to enrich your business</h1>
     
        <div className="flex space-x-4">
            <button className="bg-blue-500 text-white px-6 py-3 rounded-lg">SHOP NOW</button>
           
        </div>
    </div>
    <div className="w-full md:w-1/2">
        <img too={'/cart'} src={assets.hero_img} alt="A laptop on a wooden desk with a chair" className="w-full h-full object-cover"/>
    </div>
</div>
  )
}

export default Hero
