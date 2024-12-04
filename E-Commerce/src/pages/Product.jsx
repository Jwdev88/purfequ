import React, { useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';
import RelatedProducts from '../components/RelatedProducts';
import { assets } from '../assets/assets';
import { toast } from 'react-toastify';
const Product = () => {
  const { productId } = useParams();
  const { products, addToCart, formatIDR } = useContext(ShopContext);
  const [productData, setProductData] = useState(null); // Inisialisasi dengan null
  const [image, setImage] = useState('');
  const [size, setSize] = useState('')

  const handleAddToCart = () => {
    if (productData.sizes.length > 0 && !size) {
      // Jika ada pilihan size dan belum dipilih, tampilkan pesan error
      toast.error('Please select a size');
    } else {
      // Jika tidak ada pilihan size atau size sudah dipilih, tambahkan ke cart
      addToCart(productData._id, size);
    }
  };


  const fetchProductData = async () => {

    products.find((item) => {
      if (item._id === productId) {
        setProductData(item)
        setImage(item.image[0])

        return null
      }
    })
  }


  useEffect(() => {
    fetchProductData();
  }, [productId, products]);

  return productData ? (
    <div className="border-t-2 pt-10 transition-opacity ease-in duration-500 opacity-100">
      {/* Produk data */}
      <div className="flex gap-12 sm:gap-12 flex-col sm:flex-row">
        {/* Produk image */}
        <div className="flex-1 flex flex-col-reverse gap-3 sm:flex-row">
          <div className="flex sm:flex-col overflow-x-auto sm:overflow-y-scroll justify-between sm:justify-normal sm:w-[18.7%] w-full scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            {
              productData.image.map((item, index) => (
                <img
                  onClick={() => setImage(item)}
                  src={item}
                  key={index}
                  className="w-[24%] sm:w-full sm:mb-3 flex-shrink-0 cursor-pointer" // Tambahkan cursor-pointer
                  alt=""
                />
              ))}
          </div>
          <div className="w-full sm:w-[80%]">
            <img className="w-full h-auto" src={image} alt="" />
          </div>
        </div>

        {/* Info produk */}
        <div className="flex-1">
          <h1 className="font-medium text-2xl gap-1 mt-2">{productData.name}</h1>
          <div className="flex items-center gap-1 mt-2">
            <img src={assets.star_icon} className="w-3 h-3" alt="" /> {/* Perbaiki className */}
            <img src={assets.star_icon} className="w-3 h-3" alt="" /> {/* Perbaiki className */}
            <img src={assets.star_icon} className="w-3 h-3" alt="" /> {/* Perbaiki className */}
            <img src={assets.star_icon} className="w-3 h-3" alt="" /> {/* Perbaiki className */}
            <img src={assets.star_dull_icon} className="w-3 h-3" alt="" /> {/* Perbaiki className */}
            <p className="pl-2">(122)</p>
          </div>
          <p className="mt-2 text-2xl font-medium">

            {formatIDR(productData.price)}
          </p>

          <p className="mt-2 text-sm font-medium">
            <span className="font-semibold">Category : </span> {productData.category}
          </p>
          <p className="mt-3 text-gray-500 md:w-4/5">{productData.description}</p>
          <div className="flex flex-col gap-4 my-8">

            {productData.sizes.length > 0 && ( // Tampilkan hanya jika sizes.length > 0
              <div>
                <p>Select Sizes</p>
                <div className="flex flex-wrap gap-2">
                  {productData.sizes.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => setSize(item)}
                      className={`size-button border px-3 py-2 rounded-md border-gray-200 hover:bg-gray-100 
                     ${item === size ? 'active-size bg-blue-100 border-blue-500 text-blue-700' : ''}`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <button onClick={handleAddToCart} className='bg-black text-white px-8 py-3 text-sm mt-4 active:bg-gray-700'>
              ADD TO CART
            </button>
          </div>
          <hr className='mt-8 sm:2-4/5' />
          <div className='text-sm text-gray-500 flex flex-col gap-1'>
            <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Culpa perferendis debitis omnis numquam. Qui sit provident ipsum pariatur perspiciatis cum harum, vitae dolorem quam repellat doloribus! Iure sint officiis perspiciatis.</p>
          </div>
        </div>
      </div>
      {/* Desciptiom & Review Sectiom */}
      <div className='mt-20'>
        <div className='flex'>
          <b className='border px-5 py-3 text-sm'>Description</b>
          <b className='border px-5 py-3 text-sm'>Reviews (122) </b>

        </div>
        <div className='flex flex-col gap-4 border px-6 py-6 text-sm text-gray-500'>
          <p>Lorem, ipsum dolor sit amet consectetur adipisicing elit. Asperiores, omnis similique? Similique exercitationem harum veniam aperiam minima earum? Eius culpa eligendi dolore fugiat dicta temporibus ducimus consectetur dolor quo cum.</p>
          <p>Lorem, ipsum dolor sit amet consectetur adipisicing elit. Asperiores, omnis similique? Similique exercitationem harum veniam aperiam minima earum? Eius culpa eligendi dolore fugiat dicta temporibus ducimus consectetur dolor quo cum.</p>
        </div>
      </div>
      {/*Display related products*/}

      <RelatedProducts category={productData.category} subCategory={productData.subCategory} />


    </div>
  ) : (
    <div className="opacity-0"></div>
  );
};

export default Product;