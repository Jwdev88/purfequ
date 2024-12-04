import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { backendURI } from '../App'
import { toast } from 'react-toastify'
import { NavLink, Link } from 'react-router-dom'
import { assets } from '../assets/assets'
const List = ({ token }) => {

  const [list, setList] = useState([])

  const fetchList = async () => {
    try {
      const response = await axios.get(backendURI + '/api/product/list')

      if (response.data.success) {
        setList(response.data.products);

      } else {
        toast.error(response.data.message)
      }

    } catch (error) {
      console.log(error.message)
      toast.error(error.message)
    }
  }

  const removeProduct = async (id) => {
    try {
      const response = await axios.post(backendURI + '/api/product/remove', { id }, { headers: { token } })

      if (response.data.success) {
        toast.success(response.data.message)
        await fetchList();

      } else {
        toast.error(response.data.message)
      }

    } catch (error) {
      toast.error(error.message)
    }
  }

  useEffect(() => {
    fetchList()
  }, [token])


  return (
    <>
      <NavLink
        className='flex items-center gap-2 border-gray-300 border-r-0 px-3 py-2 hover:bg-gray-200'
        to={'/add'}
      >
        <img className='w-5 h-5' src={assets.add_icon} alt="Add Items Icon" />
        <p className='hidden md:block'>Add Items</p>
      </NavLink>
      <p className='mb-2'>Product List</p>
      <div className='flex flex-col gap-2'>
        {/* List Table Title */}
        <div className='hidden md:grid grid-cols-[1fr_3fr_1fr_1fr_1fr] items-center py-1 px-2 border bg-gray-100 text-sm '>
          <b>image</b>
          <b>Name</b>
          <b>Category</b>
          <b>Price</b>
          <b className='text-center'>Action</b>
        </div>

        {/* List Product */}
        {
          list.map((item, index) => (
            <div className='grid grid-cols-[1fr_3fr_1fr] md:grid-cols-[1fr_3fr_1fr_1fr_1fr] items-center py-1 px-2 border bg-gray-100 text-sm' key={index}>
              <img className='w-12' src={item.image[0]} alt="" />
              <p>{item.name}</p>
              <p>{item.category}</p>
              <p>{item.price}</p>
              <div className="flex gap-2">
                <Link to={`/update/${item._id}`}>
                  <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded text-sm">
                    Update
                  </button>
                </Link>
                <button
                  onClick={() => removeProduct([item._id])}
                  className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-sm"
                >
                  Hapus
                </button>
              </div>
            </div>
          ))
        }


      </div>
    </>
  )
}

export default List
