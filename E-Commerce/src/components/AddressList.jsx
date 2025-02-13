import React, { useState, useContext, useEffect } from 'react';
import { ShopContext } from '../context/ShopContext';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Button } from '../components/ui';
import { Trash2Icon, EditIcon } from 'lucide-react'; // Import ikon

const AddressList = () => {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(null); // State untuk konfirmasi hapus
  const { token, backendUrl } = useContext(ShopContext);


    const fetchAddresses = async () => { /* ... (tidak berubah) ... */
        try {
        setLoading(true);
        const response = await fetch(`${backendUrl}/api/user/addresses`, {
            headers: {
            Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch addresses');
        }

        const data = await response.json();
        setAddresses(data.addresses);
        } catch (error) {
        console.error('Error fetching addresses:', error);
        toast.error(error.message);
        } finally {
        setLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
        fetchAddresses();
        }
    }, [token, backendUrl]);

  const handleDeleteAddress = async (addressId) => {
        setShowConfirmation(addressId) // Menampilkan konfirmasi dialog
    };

     const confirmDelete = async (addressId) => {
        // ... (logika hapus tidak berubah) ...
          try {
            setLoading(true);
            const response = await fetch(`${backendUrl}/api/user/address/${addressId}`, {
                method: 'DELETE',
                headers: {
                Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to delete address');
            }

            setAddresses((prevAddresses) =>
                prevAddresses.filter((address) => address._id !== addressId)
            );
            toast.success("Address deleted successfully!");
            } catch (error) {
            console.error('Error deleting address:', error);
            toast.error(error.message);
            } finally {
            setLoading(false);
                setShowConfirmation(null); // Sembunyikan konfirmasi setelah hapus (berhasil atau gagal)
            }
    }

     const cancelDelete = () => {
        setShowConfirmation(null);
    };


  if (loading && addresses.length === 0) {
    return <div>Loading addresses...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-4">Your Addresses</h2>
      {addresses.length === 0 ? (
        <p>You have no saved addresses.</p>
      ) : (
        <ul className="space-y-4">
          {addresses.map((address) => (
            <li key={address._id} className="p-4 border rounded-md shadow-sm">
              <p>
                {address.firstName} {address.lastName}
              </p>
              <p>{address.street}, {address.city}, {address.state}</p>
              <p>{address.postalCode}</p>
                <p>{address.phone}</p>
                <p>{address.email}</p>
              <div className="mt-2 flex space-x-2">
                <Link
                  to={`/update-address/${address._id}`}
                  className="text-indigo-600 hover:text-indigo-900"
                >
                  <EditIcon size={16} /> {/* Ikon Edit */}
                </Link>
                <Button
                    onClick={() => handleDeleteAddress(address._id)}
                    className="bg-red-600 hover:bg-red-700 flex items-center" // Tambah flex
                    >
                    <Trash2Icon size={16} className="mr-1" /> {/* Ikon Trash */}
                    Delete
                </Button>
              </div>
               {/* Konfirmasi Hapus */}
                {showConfirmation === address._id && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <div className="bg-white p-6 rounded-lg shadow-lg">
                            <p className="mb-4">Are you sure you want to delete this address?</p>
                            <div className="flex justify-end space-x-2">
                                <Button onClick={cancelDelete} className="bg-gray-500 hover:bg-gray-600">Cancel</Button>
                                <Button onClick={() => confirmDelete(address._id)} className="bg-red-600 hover:bg-red-700">Delete</Button>
                            </div>
                        </div>
                    </div>
                )}
            </li>
          ))}
        </ul>
      )}
      <Link to="/add-address" className="mt-4 inline-block text-indigo-600 hover:text-indigo-900">
        Add New Address
      </Link>
    </div>
  );
};

export default AddressList;