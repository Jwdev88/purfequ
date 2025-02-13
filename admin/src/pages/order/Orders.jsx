// --- components/Orders.js ---
import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { backendURI } from "../../App";
import {
  Loader2Icon as Loader,
  Edit,
  CheckCircle,
  AlertTriangle,
  Circle,
  Truck,
  Package,
  ShoppingBag,
  XCircle, // Icon for cancel/fail
  Check, // Icon for success/save
} from "lucide-react";

import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Heading,
  VStack,
  HStack,
  Text,
  Button,
  Select,
  Textarea,
  Input,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Box,
  Image,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
} from "@chakra-ui/react";

const Orders = () => {
  // const { backendUrl, token, formatIDR, user } = useContext(ShopContext); // NO CONTEXT
  const [orderData, setOrderData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const navigate = useNavigate();

  // --- State for Admin Updates ---
  const [editOrderId, setEditOrderId] = useState(null);
  const [editStatus, setEditStatus] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editTrackingNumber, setEditTrackingNumber] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // --- Format Currency (Inside the Component) ---
  const formatIDR = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // --- Calculate Total ---
  const calculateTotal = (items, shippingCost) => {
    const subtotal = items.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
    return subtotal + shippingCost;
  };
  // --- Load Order Data (useCallback) ---
  const loadOrderData = useCallback(async () => {
    try {
      // Get the token from localStorage (where your login should have stored it)
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user"));

      if (!token) {
        setError("No token provided. Please log in."); // More specific error
        setLoading(false); // Stop loading if no token
        return;
      }

      const response = await axios.post(
        `${backendURI}/api/order/list`,
        { headers: { Authorization: `Bearer ${token}` } } // Include token in headers
      );

      if (response.data.success) {
        setOrderData(response.data.orders);
      } else {
        setError("Failed to fetch order data: " + response.data.message);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      setError(
        "An error occurred: " + (error.response?.data?.message || error.message)
      );
    } finally {
      setLoading(false);
    }
  }, [backendURI]); //  Dependencies: backendURI and the token

  // --- Attempt Repayment (now a useCallback) ---
  const attemptRepayment = useCallback(
    async (orderId, midtransToken) => {
      if (!window.snap) {
        console.error("Snap.js is not loaded");
        toast.error("Payment system is not available.");
        return;
      }

      try {
        window.snap.pay(midtransToken, {
          onSuccess: (result) => {
            toast.success("Payment successful!");
            localStorage.removeItem("orderId");
            loadOrderData(); // Re-fetch orders  <--- IMPORTANT
            navigate("/orders");
          },
          onPending: (result) => {
            toast.info("Payment pending. Please check your order status.");
            localStorage.removeItem("orderId");
            loadOrderData(); // Re-fetch orders  <--- IMPORTANT
            navigate("/orders");
          },
          onError: (result) => {
            toast.error("Payment failed!");
            // No navigation on error; allow retry
          },
          onClose: () => {
            toast.warn("Payment window closed.");
            navigate(`/orders`); // Stay on /orders
          },
        });
      } catch (error) {
        console.error("Error re-attempting payment:", error);
        toast.error("Failed to re-attempt payment.");
      }
    },
    [navigate, loadOrderData]
  );

  useEffect(() => {
    loadOrderData();
    //Check params
    const queryParams = new URLSearchParams(window.location.search);
    const urlOrderId = queryParams.get("orderId");

    if (urlOrderId) {
      // *Don't* immediately attempt repayment.  Rely on the server's status.
      // Just remove the orderId from the URL.
      navigate("/orders", { replace: true }); // Remove the query parameter
    }

    //NO POLLING
  }, [loadOrderData, navigate]); // Depend on loadOrderData (which is now memoized)

  // --- Admin Update Functions ---

  const handleEdit = (order) => {
    setEditOrderId(order.orderId); // Use orderId, not _id
    setEditStatus(order.status);
    setEditNotes(order.notes || ""); // Handle potential null/undefined
    setEditTrackingNumber(order.trackingNumber || ""); // Handle potential null/undefined
  };

  const handleCancelEdit = () => {
    setEditOrderId(null);
    setEditStatus("");
    setEditNotes("");
    setEditTrackingNumber("");
  };
  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    const token = localStorage.getItem("token"); // Retrieve token
    try {
      const response = await axios.post(
        `${backendURI}/api/order/updateorderstatus`,
        {
          orderId: editOrderId,
          status: editStatus,
          notes: editNotes,
          trackingNumber: editTrackingNumber,
        },
        {
          headers: { Authorization: `Bearer ${token}` }, // Include token
        }
      );

      if (response.data.success) {
        toast.success("Order status updated!");
        loadOrderData();
        handleCancelEdit();
      } else {
        toast.error("Failed to update: " + response.data.message);
      }
    } catch (error) {
      console.error("Error updating:", error);
      toast.error(
        "Update error: " + (error.response?.data?.message || error.message)
      );
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert status="error">
        <AlertIcon />
        <AlertTitle>Error!</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }
  // Helper function to get status icon and color
  const getStatusIconAndColor = (status) => {
    switch (status) {
      case "paid":
        return {
          icon: <CheckCircle className="text-green-500" />,
          color: "text-green-500",
        };
      case "pending":
        return {
          icon: <Circle className="text-yellow-500" />,
          color: "text-yellow-500",
        };
      case "failed":
        return {
          icon: <AlertTriangle className="text-red-500" />,
          color: "text-red-500",
        };
      case "Order Received":
        return {
          icon: <ShoppingBag className="text-blue-500" />,
          color: "text-blue-500",
        };
      case "Packing":
        return {
          icon: <Package className="text-orange-500" />,
          color: "text-orange-500",
        };
      case "In Transit":
        return {
          icon: <Truck className="text-purple-500" />,
          color: "text-purple-500",
        };
      case "Delivered":
        return {
          icon: <CheckCircle className="text-green-500" />,
          color: "text-green-500",
        };
      default:
        return { icon: null, color: "text-gray-700" };
    }
  };

  const user = JSON.parse(localStorage.getItem("user"));

  return (
    <Box p={4} overflowX="auto">
        <Heading as="h1" size="xl" mb={6} textAlign={{ base: "center", md: "left" }}>
            Admin Order Management
        </Heading>
        {orderData.length > 0 ? (
            <TableContainer>
                <Table variant="striped" colorScheme="gray">
                    <Thead>
                        <Tr>
                            <Th>Order ID</Th>
                            <Th>Status</Th>
                            <Th>Payment Info</Th>
                            <Th>Total</Th>
                            <Th>Date</Th>
                            <Th>Address</Th>
                            <Th>Items</Th>
                            <Th>Notes</Th>
                            <Th>Tracking #</Th>
                            <Th>Actions</Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {orderData.map((order) => {
                            const { icon, color } = getStatusIconAndColor(order.status);
                            return (
                                <Tr key={order._id} _hover={{ bg: "gray.100" }}>
                                    <Td>{order.orderId || order._id}</Td>
                                    <Td>
                                        {editOrderId === order.orderId ? (
                                            <Select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} size="sm">
                                                <option value="">Select Status</option>
                                                <option value="Order Received">Order Received</option>
                                                <option value="Packing">Packing</option>
                                                <option value="In Transit">In Transit</option>
                                                <option value="Delivered">Delivered</option>
                                                <option value="Failed">Failed</option>
                                                <option value="Pending">Pending</option>
                                                <option value="Paid">Paid</option>
                                            </Select>
                                        ) : (
                                            <HStack>
                                                {icon}
                                                <Text color={color} fontWeight="bold">{order.status}</Text>
                                            </HStack>
                                        )}
                                    </Td>
                                    <Td>
                                        <Text>Type: {order.paymentType || '-'}</Text>
                                        {order.vaNumber && <Text>VA: {order.bank.toUpperCase()} - {order.vaNumber}</Text>}
                                    </Td>
                                    <Td>{formatIDR(calculateTotal(order.items, order.ongkir))}</Td>
                                    <Td>{new Date(order.date).toLocaleDateString()}</Td>
                                    <Td>
                                        <Box>
                                            <Text fontWeight="bold">{order.address.firstName} {order.address.lastName}</Text>
                                            <Text>{order.address.phone}</Text>
                                            <Text>{order.address.address}, {order.address.cityId}, {order.address.state}</Text>
                                        </Box>
                                    </Td>
                                    <Td>
                                        <Accordion allowToggle>
                                            <AccordionItem>
                                                <AccordionButton>
                                                    <Box flex='1' textAlign='left'>Show Items</Box>
                                                    <AccordionIcon />
                                                </AccordionButton>
                                                <AccordionPanel pb={4}>
                                                    {order.items.map((item, index) => (
                                                        <HStack key={index} p={2} borderRadius="md" spacing={4} alignItems="center">
                                                            <Image src={item.image} alt={item.name} boxSize="50px" objectFit="cover" borderRadius="md" />
                                                            <Box>
                                                                <Text fontWeight="bold">{item.name}</Text>
                                                                <Text>Qty: {item.quantity}</Text>
                                                                <Text>Price: {formatIDR(item.price)}</Text>
                                                            </Box>
                                                        </HStack>
                                                    ))}
                                                </AccordionPanel>
                                            </AccordionItem>
                                        </Accordion>
                                    </Td>
                                    <Td w="250px">
    {editOrderId === order.orderId ? (
        <Input
            value={editNotes}
            onChange={(e) => setEditNotes(e.target.value)}
            size="sm"
            w="full"
            minW="200px"
            maxW="300px"
            whiteSpace="nowrap"
            overflow="hidden"
            textOverflow="ellipsis"
            borderRadius="md"
            p={2}
        />
    ) : (
        <Text whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis">
            {order.notes || '-'}
        </Text>
    )}
</Td>

<Td w="200px">
    {editOrderId === order.orderId ? (
        <Input
            type="text"
            value={editTrackingNumber}
            onChange={(e) => setEditTrackingNumber(e.target.value)}
            size="sm"
            w="full"
            minW="150px"
            maxW="250px"
            whiteSpace="nowrap"
            overflow="hidden"
            textOverflow="ellipsis"
            borderRadius="md"
            p={2}
        />
    ) : (
        <Text whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis">
            {order.trackingNumber || '-'}
        </Text>
    )}
</Td>
                                   <Td>
                                        <HStack spacing={2} wrap="wrap">
                                            {editOrderId === order.orderId ? (
                                                <>
                                                    <Button onClick={handleUpdateStatus} isLoading={isUpdating} colorScheme="blue" size="sm">Save</Button>
                                                    <Button onClick={handleCancelEdit} colorScheme="gray" size="sm">Cancel</Button>
                                                </>
                                            ) : (
                                                <Button onClick={() => handleEdit(order)} colorScheme="yellow" size="sm" leftIcon={<Edit />}>Edit</Button>
                                            )}
                                        </HStack>
                                    </Td>
                                </Tr>
                            );
                        })}
                    </Tbody>
                </Table>
            </TableContainer>
        ) : (
            <Text textAlign="center" fontSize="xl">No orders found.</Text>
        )}
    </Box>
);

};

export default Orders;
