import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import CitizenSidebar from "./CitizenSidebar";

function CitizenLayout() {
  return (
    <div className="app">
      <CitizenSidebar />

      <div className="mainContent">
        <Navbar />

        <div className="pageContent">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default CitizenLayout;