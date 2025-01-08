import React, { useReducer } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Box, ChakraProvider, theme, Container, CSSReset } from '@chakra-ui/react';
import Home from './pages/Home';
import Collection from './pages/Collection';
import Contact from './pages/Contact';
import Product from './pages/Product';
import Cart from './pages/Cart';
import Login from './pages/Login';
import PlaceOrder from './pages/PlaceOrder';
import Orders from './pages/Orders';
import Navbar from './components/Navbar';
import About from './pages/About';
import Footer from './components/Footer';
import SearchBar from './components/SearchBar';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const initialState = {
  isLogin: false,
};

const reducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN':
      return { ...state, isLogin: true };
    case 'LOGOUT':
      return { ...state, isLogin: false };
    default:
      return state;
  }
};

const App = () => {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <ChakraProvider theme={theme}>
      <CSSReset />
      <ToastContainer />
      <Box px={["1", "5vw", "7vw", "9vw"]}>
        <Navbar isLogin={state.isLogin} dispatch={dispatch} />
        <SearchBar />
        <Container maxW="container.xl" py={4}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="collection" element={<Collection />} />
            <Route path="about" element={<About />} />
            <Route path="contact" element={<Contact />} />
            <Route path="product/:productId" element={<Product />} />
            <Route path="cart" element={<Cart />} />
            <Route path="login" element={<Login dispatch={dispatch} />} />
            <Route path="place-order" element={<PlaceOrder />} />
            <Route path="orders" element={<Orders />} />
          </Routes>
        </Container>
        <Footer />
      </Box>
    </ChakraProvider>
  );
};

export default App;
