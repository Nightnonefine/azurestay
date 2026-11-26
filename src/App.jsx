import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import RequireAuth from './components/RequireAuth';
import RequireRole from './components/RequireRole';
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
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminHotels from './pages/admin/AdminHotels';
import AdminStats from './pages/admin/AdminStats';
import AdminUsers from './pages/admin/AdminUsers';
import OwnerBookings from './pages/owner/OwnerBookings';
import OwnerCalendar from './pages/owner/OwnerCalendar';
import OwnerDashboard from './pages/owner/OwnerDashboard';
import OwnerHotelDetail from './pages/owner/OwnerHotelDetail';
import OwnerHotelForm from './pages/owner/OwnerHotelForm';
import OwnerHotels from './pages/owner/OwnerHotels';
import OwnerStats from './pages/owner/OwnerStats';

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

            <Route element={<RequireRole roles={['Owner', 'Admin']} />}>
              <Route path="/owner" element={<OwnerDashboard />} />
              <Route path="/owner/hotels" element={<OwnerHotels />} />
              <Route path="/owner/hotels/new" element={<OwnerHotelForm />} />
              <Route path="/owner/hotels/:id/edit" element={<OwnerHotelForm />} />
              <Route path="/owner/hotels/:id" element={<OwnerHotelDetail />} />
              <Route path="/owner/hotels/:id/calendar" element={<OwnerCalendar />} />
              <Route path="/owner/bookings" element={<OwnerBookings />} />
              <Route path="/owner/stats" element={<OwnerStats />} />
            </Route>

            <Route element={<RequireRole roles={['Admin']} />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/hotels" element={<AdminHotels />} />
              <Route path="/admin/stats" element={<AdminStats />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
