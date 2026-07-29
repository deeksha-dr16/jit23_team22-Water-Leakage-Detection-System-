import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

/* Admin Pages */
import Dashboard from "./pages/admin/Dashboard";
import Notifications from "./pages/admin/Notifications";
import History from "./pages/admin/History";
import Admin from "./pages/admin/Admin";
import AdminProfile from "./pages/admin/AdminProfile";

/* Citizen Pages */
import CitizenDashboard from "./pages/citizen/CitizenDashboard";
import ReportLeak from "./pages/citizen/ReportLeak";
import MyReports from "./pages/citizen/MyReports";
import CitizenProfile from "./pages/citizen/CitizenProfile";

/* Layouts */
import AdminLayout from "./components/AdminLayout";
import CitizenLayout from "./components/CitizenLayout";

/* Route Protection */
import ProtectedRoute from "./components/ProtectedRoute";

import "./App.css";

function App() {

  return (

    <BrowserRouter>

      <Routes>

        {/* Authentication */}

        <Route path="/" element={<Login />} />

        <Route path="/register" element={<Register />} />



        {/* ================= ADMIN ================= */}

        <Route

          path="/admin"

          element={

            <ProtectedRoute allowedRole="admin">

              <AdminLayout />

            </ProtectedRoute>

          }

        >

          <Route path="dashboard" element={<Dashboard />} />

          <Route path="notifications" element={<Notifications />} />

          <Route path="history" element={<History />} />

          <Route path="manage" element={<Admin />} />

          <Route path="profile" element={<AdminProfile />} />

        </Route>



        {/* ================= CITIZEN ================= */}

        <Route

          path="/citizen"

          element={

            <ProtectedRoute allowedRole="citizen">

              <CitizenLayout />

            </ProtectedRoute>

          }

        >

          <Route path="dashboard" element={<CitizenDashboard />} />

          <Route path="report" element={<ReportLeak />} />

          <Route path="reports" element={<MyReports />} />

          <Route path="profile" element={<CitizenProfile />} />

        </Route>



        {/* Redirect */}

        <Route

          path="*"

          element={<Navigate to="/" replace />}

        />

      </Routes>

    </BrowserRouter>

  );

}

export default App;