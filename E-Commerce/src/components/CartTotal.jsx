import React, { useContext } from 'react';
import { ShopContext } from '../context/ShopContext'
import Title from './Title'

const CartTotal = () => {
  const { getCartAmount, formatIDR } = useContext(ShopContext);
  const totalAmount = getCartAmount(); 



  return (
    <div className='w-full'>
      <div className='text-2xl'>
        <Title text1={'CART'} text2={'TOTALS'} />
      </div>
      <div className='flex flex-col gap-2 mt-2 text-sm'>
        <div className='flex justify-between'>
          <p>SubTotal Pesanan</p>
          <p>{formatIDR(totalAmount)}</p>
        </div>
        <hr />
      </div>
    </div>
  )
}

export default CartTotal