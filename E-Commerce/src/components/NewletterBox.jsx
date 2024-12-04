import React from 'react'

const NewletterBox = () => {

    const onSubmitHandler = (event) =>{
        event.preventDefault();
    }

  return (
    <div className='text-center'>
    <p className='text-2x1 font-medium text-gray-800'>Subscribe now & get 20% off </p>
    <p className='text-gray-400 mt-3'>
    Lorem ipsum dolor sit amet consectetur adipisicing elit. Quaerat voluptate ad sunt doloribus, eius earum iusto et non ducimus illum officia quae culpa similique quibusdam, numquam libero placeat officiis? Itaque?
    </p>
      <form onSubmit={onSubmitHandler} className='w-full sm:w-1/2 flex items-center gap-3 mx-auto border pl-3 mt-3'>
        <input className='w-full sm:flex-1 outline-none' type="email"  placeholder='Enter your email' required/>
        <button type='submit' className='bg-black text-white text-xs px-10 py-4'>Subscribe</button>
      </form>
    </div>
  )
}

export default NewletterBox
