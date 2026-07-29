import React, { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "../../firebase/firebase";
import {
  AlertTriangle,
  Bell,
  ShieldAlert,
  CheckCircle,
  Power,
  Droplets,
} from "lucide-react";

import "../../styles/notifications.css";

export default function Notifications() {

  const [road1, setRoad1] = useState({});
  const [road2, setRoad2] = useState({});
  const [system, setSystem] = useState({});

  useEffect(() => {

    const root = ref(db, "WaterShield");

    return onValue(root, (snapshot) => {

      const data = snapshot.val();

      if (!data) return;

      setRoad1(data.Road1 || {});
      setRoad2(data.Road2 || {});
      setSystem(data.System || {});

    });

  }, []);

  const notifications = [];

  if (road1.LeakStatus !== "OK") {

    notifications.push({
      title: "Leak Detected",
      road: "Road 1",
      icon: <AlertTriangle color="#ff4d4f" />,
      color: "#ff4d4f",
      message:
        "Leak detected. Valve closed automatically. Repair required."
    });

  }

  if (road2.LeakStatus !== "OK") {

    notifications.push({
      title: "Leak Detected",
      road: "Road 2",
      icon: <AlertTriangle color="#ff4d4f" />,
      color: "#ff4d4f",
      message:
        "Leak detected. Valve closed automatically. Repair required."
    });

  }

  notifications.push({
    title: "Pump Status",
    road: "",
    icon: <Power color="#00d4ff" />,
    color: "#00d4ff",
    message:
      system.Pump === "ON"
        ? "Pump is running normally."
        : "Pump is currently OFF."
  });

  notifications.push({
    title: "Water Distribution",
    road: "",
    icon: <Droplets color="#00ffaa" />,
    color: "#00ffaa",
    message:
      "Water supply is active for healthy pipelines."
  });

  return (

    <div className="notifyContainer">

      <div className="notifyHeader">

        <Bell size={40} />

        <div>

          <h1>Notification Center</h1>
          <p>Real-Time Monitoring & Leak Alerts</p>

        </div>

      </div>

      <div className="notifyGrid">

        {notifications.map((item, index) => (

          <div
            key={index}
            className={`notifyCard ${item.title === "Leak Detected"
              ? "danger"
              : item.title === "Pump Status"
                ? "info"
                : "success"
              }`}
          >

            <div className="notifyTop">

              {item.icon}

              <div>

                <h3>{item.title}</h3>

                <small>{item.road}</small>

              </div>

            </div>

            <p>{item.message}</p>

            <div className="statusRow">

              {item.title === "Leak Detected" ? (

                <>
                  <ShieldAlert color="#ff4d4f" />

                  <span>Action Required</span>
                </>

              ) : (

                <>
                  <CheckCircle color="#00ff88" />

                  <span>Normal</span>
                </>

              )}

            </div>

          </div>

        ))}

      </div>

    </div>

  );

}