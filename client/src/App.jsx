import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";

// Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Donations from "./pages/Donations";
import CreateDonation from "./pages/CreateDonation";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <main className="container">
          <Routes>
            <Route path="/" element={<Donations />} />
            <Route path="/donations" element={<Donations />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/pickups" element={<Dashboard />} />
            <Route path="/create-donation" element={<CreateDonation />} />
          </Routes>
        </main>
      </BrowserRouter>
    </AuthProvider>
  );
}