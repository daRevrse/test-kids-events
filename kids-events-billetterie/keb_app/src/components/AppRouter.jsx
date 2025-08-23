import React from "react";
import { Routes, Route } from "react-router-dom";
import TicketingApp from "../App";
import AdminLogin from "./AdminLogin";
import AdminDashboard from "./AdminDashboard";

const AppRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<TicketingApp />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
    </Routes>
  );
};

export default AppRouter;
