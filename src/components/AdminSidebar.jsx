import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Bell,
  History,
  Users,
  UserCircle
} from "lucide-react";

import "../styles/sidebar.css";

function AdminSidebar() {
  return (
    <aside className="sidebar">

      <h2 className="logo">💧 WaterShield</h2>

      <nav>

        <NavLink className="menuLink" to="/admin/dashboard">
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </NavLink>

        <NavLink className="menuLink" to="/admin/notifications">
          <Bell size={20} />
          <span>Notifications</span>
        </NavLink>

        <NavLink className="menuLink" to="/admin/history">
          <History size={20} />
          <span>History</span>
        </NavLink>

        <NavLink className="menuLink" to="/admin/manage">
          <Users size={20} />
          <span>Manage Users</span>
        </NavLink>

        <NavLink  className="menuLink" to="/admin/profile">
          <UserCircle size={20} />
          <span>Profile</span>
        </NavLink>

      </nav>

    </aside>
  );
}

export default AdminSidebar;