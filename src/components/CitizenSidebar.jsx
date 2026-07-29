import { NavLink } from "react-router-dom";
import { Home, AlertTriangle, History, UserCircle } from "lucide-react";
import "../styles/sidebar.css";

function CitizenSidebar() {
  return (
    <aside className="sidebar">

      <h2 className="logo">💧 WaterShield</h2>

      <nav>

        <NavLink className="menuLink" to="/citizen/dashboard">
          <Home />
          <span>Dashboard</span>
        </NavLink>

        <NavLink className="menuLink" to="/citizen/report">
          <AlertTriangle />
          <span>Report Leak</span>
        </NavLink>

        <NavLink className="menuLink" to="/citizen/reports">
          <History />
          <span>My Reports</span>
        </NavLink>

        <NavLink className="menuLink" to="/citizen/profile">
          <UserCircle />
          <span>Profile</span>
        </NavLink>

      </nav>

    </aside>
  );
}

export default CitizenSidebar;