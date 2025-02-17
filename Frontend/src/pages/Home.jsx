import React from 'react'
import Hero from '../components/Hero'
import LatesCollection from '../components/LatesCollection'
import BestSeller from '../components/BestSeller'
import OurPolicy from '../components/OurPolicy'
import NewletterBox from '../components/NewletterBox'
const Home = () => {
  return (
    <div>
      <Hero />
      <LatesCollection />
      <BestSeller />
      <OurPolicy />
      <NewletterBox />
    </div>
  )
}

export default Home
