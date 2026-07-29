import { useEffect, useState } from "react";
import { auth, db } from "../firebase/firebase";
import { ref, get } from "firebase/database";
import { Bell, UserCircle } from "lucide-react";
import "../styles/navbar.css";

export default function Navbar() {

    const [name, setName] = useState("");

    useEffect(() => {

        async function loadUser() {

            if (!auth.currentUser) return;

            const snap = await get(
                ref(db, `Users/${auth.currentUser.uid}`)
            );

            if (snap.exists()) {

                setName(snap.val().name);

            }

        }

        loadUser();

    }, []);

    return (

        <div className="navbar">

            <h2>

                Welcome, {name || "User"}

            </h2>

            <div className="navRight">

                <Bell />

                <UserCircle size={34} />

            </div>

        </div>

    );

}