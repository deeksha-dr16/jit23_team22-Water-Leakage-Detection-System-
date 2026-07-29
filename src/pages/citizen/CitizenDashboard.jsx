import React, { useEffect, useState } from "react";
import { auth, db } from "../../firebase/firebase";
import { ref, onValue, get } from "firebase/database";

import {
  User,
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  MapPin
} from "lucide-react";

import "../../styles/citizendashboard.css";

export default function CitizenDashboard() {

  const [profile, setProfile] = useState({});
  const [reports, setReports] = useState([]);

  useEffect(() => {

    if (!auth.currentUser) return;

    const uid = auth.currentUser.uid;

    async function loadProfile() {

      const snap = await get(ref(db, `Users/${uid}`));

      if (snap.exists()) {
        setProfile(snap.val());
      }

    }

    loadProfile();

    const reportRef = ref(db, "ReportedLeaks");

    const unsubscribe = onValue(reportRef, (snapshot) => {

      const data = snapshot.val();

      if (!data) {
        setReports([]);
        return;
      }

      const list = [];

      Object.keys(data).forEach((key) => {

        if (data[key].citizenId === uid) {

          list.push({
            id: key,
            ...data[key]
          });

        }

      });

      list.reverse();

      setReports(list);

    });

    return () => unsubscribe();

  }, []);

  const total = reports.length;

  const pending = reports.filter(
    (r) => r.status === "Pending"
  ).length;

  const progress = reports.filter(
    (r) => r.status === "In Progress"
  ).length;

  const resolved = reports.filter(
    (r) => r.status === "Resolved"
  ).length;

  return (

    <div className="citizenDashboard">

      <div className="welcomeCard">

        <User size={40} />

        <div>

          <h1>
            Welcome,
            {" "}
            {profile.name || "Citizen"}
          </h1>

          <p>
            Monitor your reported water leakages in real time.
          </p>

        </div>

      </div>

      <div className="statsGrid">

        <div className="statCard total">

          <FileText size={32} />

          <h2>{total}</h2>

          <span>Total Reports</span>

        </div>

        <div className="statCard pending">

          <Clock size={32} />

          <h2>{pending}</h2>

          <span>Pending</span>

        </div>

        <div className="statCard progress">

          <AlertTriangle size={32} />

          <h2>{progress}</h2>

          <span>In Progress</span>

        </div>

        <div className="statCard resolved">

          <CheckCircle size={32} />

          <h2>{resolved}</h2>

          <span>Resolved</span>

        </div>

      </div>

      <div className="recentReports">

        <h2>Recent Reports</h2>

        {

          reports.length === 0 ?

          (

            <div className="empty">

              No reports submitted yet.

            </div>

          )

          :

          reports.slice(0,5).map((item)=>(

            <div
              key={item.id}
              className="reportCard"
            >

              <div className="top">

                <MapPin />

                <h3>{item.area}</h3>

              </div>

              <p>

                <b>Landmark:</b>

                {" "}

                {item.landmark}

              </p>

              <p>

                <b>Status:</b>

                {" "}

                <span
                  className={
                    item.status === "Resolved"
                    ? "green"
                    : item.status === "Pending"
                    ? "yellow"
                    : "orange"
                  }
                >

                  {item.status}

                </span>

              </p>

              <p>

                <b>Reported:</b>

                {" "}

                {item.reportedAt}

              </p>

            </div>

          ))

        }

      </div>

    </div>

  );

}