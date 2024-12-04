import React, { useContext, useEffect, useState } from 'react'
import { ShopContext } from '../context/ShopContext'
import Title from './Title'; 
import ProductItem from './Productitem';

const LatesCollection = () => {
    const {products} = useContext(ShopContext);
    const [latestProducts,setLatestProducts]= useState([]);
    useEffect(()=>{
      setLatestProducts(products.slice(0,12));
    },[products])
  
  return (
    <div className='my-10'>
      <div className='text-center py-8 tex-3x1'>
        <Title text1={'LATEST'} text2={'COLLECTIONS'}/>
        <p className='2-3/4 m-auto text-xs sm:text-sm md:text-base text-gray-600'>
          Lorem ipsum dolor sit amet consectetur, adipisicing elit. Vero adipisci maxime cumque deserunt. Similique reprehenderit sit commodi repudiandae maiores provident consequuntur praesentium quod, labore delectus cupiditate iusto. Necessitatibus, officiis dignissimos.
        </p>
 
      </div>
      {/* Rendering Products */}
        <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 ig:grid-cols-5 gap-4 gap-y-6'>
          {
            latestProducts.map((item,index)=>(
             <ProductItem key={index} id={item._id} image={item.image} name={item.name} price={item.price} />
            ))
          }
        </div>
    </div>
  )
}

export default LatesCollection
