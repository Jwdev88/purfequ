import React from 'react'
import {NavLink} from 'react-router-dom'
import { assets } from '../assets/assets'
const Sidebar = () => {
  return (
    <div className='w-[18%] min-h-screen border-2'>
        <div className='flex flex-col gap-4 pt-6 pl-[20%] text-[15px]'>
            <NavLink className='flex items-center gap-3 border border-gray-300 border-r-0 px-3 py-2 rounded-l' to={'/product/list'}> 
                <img className='w-5 h-5' src={assets.order_icon} alt="" />
                <p className='hidden md:block'>Product Items</p>
            </NavLink>
            
            <NavLink className='flex items-center gap-3 border border-gray-300 border-r-0 px-3 py-2 rounded-l' to={'/orders'}> 
                <img className='w-5 h-5' src={assets.order_icon} alt="" />
                <p className='hidden md:block'>Orders</p>
            </NavLink>

            <NavLink className='flex items-center gap-3 border border-gray-300 border-r-0 px-3 py-2 rounded-l' to={'/category/list'}> 
                <img className='w-5 h-5' src={assets.order_icon} alt="" />
                <p className='hidden md:block'>Category</p>
            </NavLink>

            <NavLink className='flex items-center gap-3 border border-gray-300 border-r-0 px-3 py-2 rounded-l' to={'/subcategory/list'}> 
                <img className='w-5 h-5' src={assets.order_icon} alt="" />
                <p className='hidden md:block'>subCategory</p>
            </NavLink>
        
        </div>
    </div>
  )
}

export default Sidebar;