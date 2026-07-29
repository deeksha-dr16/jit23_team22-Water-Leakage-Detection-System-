import React, { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "../../firebase/firebase";
import {
    History,
    Search,
    CheckCircle,
    AlertTriangle,
    Clock
} from "lucide-react";

import "../../styles/history.css";

export default function HistoryPage() {

    const [history, setHistory] = useState([]);
    const [search, setSearch] = useState("");

    useEffect(() => {

        const historyRef = ref(db, "ReportedLeaks");

        return onValue(historyRef, (snapshot) => {

            const data = snapshot.val();

            if (!data) return;

            const arr = [];

            Object.keys(data).forEach(key => {

                arr.push({
                    id: key,
                    ...data[key]
                });

            });

            arr.reverse();

            setHistory(arr);

        });

    }, []);

    const filtered = history.filter(item =>

        item.area?.toLowerCase().includes(search.toLowerCase()) ||

        item.status?.toLowerCase().includes(search.toLowerCase())

    );

    return (

        <div className="historyContainer">

            <div className="historyHeader">

                <History size={40} />

                <div>

                    <h1>Leak History</h1>

                    <p>Complete History of Reported Leakages</p>

                </div>

            </div>

            <div className="searchBox">

                <Search />

                <input

                    placeholder="Search by Area or Status"

                    value={search}

                    onChange={(e) => setSearch(e.target.value)}

                />

            </div>

            <div className="timeline">

                {

                    filtered.map(item => (

                        <div
                            className="timelineCard"
                            key={item.id}
                        >

                            <div className="left">

                                {

                                    item.status === "Resolved"

                                        ?

                                        <CheckCircle color="#00ff99" />

                                        :

                                        item.status === "Pending"

                                            ?

                                            <Clock color="#ffcc00" />

                                            :

                                            <AlertTriangle color="#ff4d4f" />

                                }

                            </div>

                            <div className="right">

                                <h2>

                                    {item.area}

                                </h2>

                                <h4>
                                    📍 Landmark: {item.landmark}
                                </h4>

                                <p>

                                    {item.description}

                                </p>

                                <div className="bottomRow">

                                    <span>
                                        Status: {item.status}
                                    </span>

                                    <span>

                                        {item.reportedAt}

                                    </span>

                                </div>

                            </div>

                        </div>

                    ))

                }

            </div>

        </div>

    );

}