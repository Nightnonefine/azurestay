import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import RequireAuth from './components/RequireAuth';
import { AuthProvider } from './context/AuthContext';
import About from './pages/About';
import BookingForm from './pages/BookingForm';
import Contact from './pages/Contact';
import Home from './pages/Home';
import HotelDetail from './pages/HotelDetail';
import HotelList from './pages/HotelList';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import Register from './pages/Register';
import BookingDetail from './pages/account/BookingDetail';
import MyBookings from './pages/account/MyBookings';
import Profile from './pages/account/Profile';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/hotels" element={<HotelList />} />
            <Route path="/hotels/:slug" element={<HotelDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/about-us" element={<About />} />
            <Route path="/contact" element={<Contact />} />

            <Route element={<RequireAuth />}>
              <Route path="/hotels/:slug/book" element={<BookingForm />} />
              <Route path="/account" element={<Profile />} />
              <Route path="/account/bookings" element={<MyBookings />} />
              <Route path="/account/bookings/:code" element={<BookingDetail />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
