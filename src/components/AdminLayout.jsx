import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import AdminSidebar from "./AdminSidebar";

function AdminLayout() {
  return (
    <div className="app">
      <AdminSidebar />

      <div className="mainContent">
        <Navbar />

        <div className="pageContent">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default AdminLayout;