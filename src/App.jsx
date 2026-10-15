import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Protected from './components/Protected.jsx';
import Login from './pages/Login.jsx';
import Listings from './pages/Listings.jsx';
import ItemDetail from './pages/ItemDetail.jsx';
import SwapRequest from './pages/SwapRequest.jsx';
import Chat from './pages/Chat.jsx';
import Dashboard from './pages/Dashboard.jsx';
import AddItem from './pages/AddItem.jsx';
import Admin from './pages/Admin.jsx';

function App() {
  return (
    <div className="app">
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Listings />} />
          <Route path="/login" element={<Login />} />
          <Route path="/item/:id" element={<ItemDetail />} />
          <Route path="/swap/:id" element={<Protected><SwapRequest /></Protected>} />
          <Route path="/chat/:id" element={<Protected><Chat /></Protected>} />
          <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
          <Route path="/sell" element={<Protected><AddItem /></Protected>} />
          <Route path="/sell/:id" element={<Protected><AddItem /></Protected>} />
          <Route path="/admin" element={<Protected admin><Admin /></Protected>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="footer">ClothingSwap · Swap clothes, reduce waste</footer>
    </div>
  );
}

export default App;
