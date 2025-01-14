import React, { useContext } from 'react';
import { ShopContext } from '../context/ShopContext';
import Title from './Title';

const CartTotal = () => {
  const { getCartAmount, formatIDR } = useContext(ShopContext);
  const totalAmount = getCartAmount();

  return (
    <div className="w-full max-h-32 bg-gray-50 dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <div className="text-md mb-4">
        <Title text1="CART" text2="TOTALS" />
      </div>
      <div className="space-y-4 mt-2 text-sm">
        <div className="flex justify-between w-full">
          <span>SubTotal Pesanan</span>
          <span>: {formatIDR(totalAmount)}</span>
        </div>
        <div className="border-t border-gray-300 dark:border-gray-700 pt-2" />
      </div>
    </div>
  );
};

export default CartTotal;
