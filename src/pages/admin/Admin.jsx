import React, { useEffect, useState } from "react";
import { ref, onValue, update } from "firebase/database";
import { db } from "../../firebase/firebase";

import {
    ShieldCheck,
    Wrench,
    UserCheck,
    CheckCircle,
    Clock,
    AlertTriangle,
} from "lucide-react";

import "../../styles/admin.css";

export default function Admin() {

    const [reports, setReports] = useState([]);

    useEffect(() => {

        const reportRef = ref(db, "ReportedLeaks");

        return onValue(reportRef, (snapshot) => {

            const data = snapshot.val();

            if (!data) {
                setReports([]);
                return;
            }

            const list = Object.keys(data).map((key) => ({
                id: key,
                ...data[key],
            }));

            list.reverse();

            setReports(list);

        });

    }, []);

    async function assignEngineer(id) {

        await update(ref(db, `ReportedLeaks/${id}`), {
            status: "In Progress",
            engineer: "Assigned",
        });

    }

    async function completeRepair(id) {

        await update(ref(db, `ReportedLeaks/${id}`), {
            status: "Resolved",
            repairedAt: new Date().toLocaleString(),
            valveStatus: "OPEN",
        });

        // Optional:
        // If your ESP32 watches this value,
        // also update:
        //
        // WaterShield/System/RepairCompleted = true
        //
        // Then ESP32 can reopen the valve automatically.
    }

    return (

        <div className="adminPage">

            <div className="adminHeader">

                <ShieldCheck size={42} />

                <div>

                    <h1>WaterShield Admin Panel</h1>

                    <p>Real-Time Water Leakage Management & Engineer Assignment</p>

                </div>

            </div>

            <div className="reportGrid">

                {reports.map((item) => (

                    <div className="reportCard" key={item.id}>

                        <div className="topRow">

                            <h2>{item.area}</h2>

                            {item.status === "Pending" && (
                                <Clock color="#ffcc00" />
                            )}

                            {item.status === "In Progress" && (
                                <AlertTriangle color="#ff6b35" />
                            )}

                            {item.status === "Resolved" && (
                                <CheckCircle color="#00ff88" />
                            )}

                        </div>

                        <p>

                            <b>Citizen :</b> {item.name}

                        </p>

                        <p>

                            <b>Phone :</b> {item.phone}

                        </p>

                        <p>

                            <b>Landmark :</b> {item.landmark}

                        </p>

                        <p>

                            <b>Description :</b>

                            <br />

                            {item.description}

                        </p>

                        <p>

                            <b>Reported :</b>

                            <br />

                            {item.reportedAt}

                        </p>
                        {item.engineer && (

                            <p>

                                <b>Engineer:</b> {item.engineer}

                            </p>

                        )}

                        <div className="statusBox">

                            <b>Status:</b> {item.status}

                        </div>

                        <div className="buttonRow">

                            {item.status === "Pending" && (

                                <button
                                    className="assignBtn"
                                    onClick={() => assignEngineer(item.id)}
                                >

                                    <UserCheck size={18} />

                                    Assign Engineer

                                </button>

                            )}

                            {item.status === "In Progress" && (

                                <button
                                    className="completeBtn"
                                    onClick={() => completeRepair(item.id)}
                                >

                                    <Wrench size={18} />

                                    Repair Completed

                                </button>

                            )}

                            {item.status === "Resolved" && (

                                <button className="resolvedBtn">

                                    <CheckCircle size={18} />

                                    Completed

                                </button>

                            )}

                        </div>

                    </div>

                ))}

            </div>

        </div>

    );

}