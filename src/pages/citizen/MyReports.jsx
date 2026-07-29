import React, { useEffect, useState } from "react";
import { auth, db } from "../../firebase/firebase";
import { ref, onValue } from "firebase/database";

import {
  Search,
  MapPin,
  Calendar,
  AlertTriangle,
  User,
  CheckCircle,
  Clock
} from "lucide-react";

import "../../styles/myreports.css";

export default function MyReports() {

  const [reports, setReports] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {

    if (!auth.currentUser) return;

    const uid = auth.currentUser.uid;

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

  const filteredReports = reports.filter((report) =>
    report.area.toLowerCase().includes(search.toLowerCase())
  );

  function statusClass(status) {

    if (status === "Resolved") return "resolved";

    if (status === "In Progress") return "progress";

    return "pending";

  }

  function statusIcon(status) {

    if (status === "Resolved")
      return <CheckCircle size={16} />;

    if (status === "In Progress")
      return <AlertTriangle size={16} />;

    return <Clock size={16} />;

  }

  return (

    <div className="myReports">

      <div className="pageHeader">

        <h1>My Reports</h1>

        <p>

          View all leakage reports submitted by you.

        </p>

      </div>

      <div className="searchBox">

        <Search size={18} />

        <input
          placeholder="Search by Area..."
          value={search}
          onChange={(e)=>setSearch(e.target.value)}
        />

      </div>

      {

        filteredReports.length === 0 ?

        (

          <div className="emptyCard">

            No reports found.

          </div>

        )

        :

        filteredReports.map((report)=>(

          <div
            className="reportCard"
            key={report.id}
          >

            <div className="reportHeader">

              <div>

                <h2>

                  <MapPin size={18} />

                  {report.area}

                </h2>

                <span>

                  {report.landmark}

                </span>

              </div>

              <div
                className={`status ${statusClass(report.status)}`}
              >

                {statusIcon(report.status)}

                {report.status}

              </div>

            </div>

            <div className="description">

              {report.description}

            </div>

            <div className="detailsGrid">

              <div>

                <Calendar size={16}/>

                <span>

                  {report.reportedAt}

                </span>

              </div>

              <div>

                <AlertTriangle size={16}/>

                <span>

                  Severity :

                  {" "}

                  {report.severity}

                </span>

              </div>

              <div>

                <User size={16}/>

                <span>

                  Engineer :

                  {" "}

                  {

                    report.engineer

                    ?

                    report.engineer

                    :

                    "Not Assigned"

                  }

                </span>

              </div>

            </div>

          </div>

        ))

      }

    </div>

  );

}