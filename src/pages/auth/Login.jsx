import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
    signInWithEmailAndPassword
} from "firebase/auth";
import { ref, get } from "firebase/database";
import { auth, db } from "../../firebase/firebase";

import {
    Mail,
    Lock,
    LogIn,
    Droplets
} from "lucide-react";

import "../../styles/login.css";

export default function Login() {

    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [loading, setLoading] = useState(false);

    const [error, setError] = useState("");

    async function handleLogin(e) {

        e.preventDefault();

        setLoading(true);

        setError("");

        try {

            // Firebase Authentication
            const userCredential =
                await signInWithEmailAndPassword(
                    auth,
                    email,
                    password
                );

            const uid = userCredential.user.uid;

            // Read role from Realtime Database
            const snapshot = await get(
                ref(db, `Users/${uid}`)
            );

            if (!snapshot.exists()) {

                setError("User information not found.");

                setLoading(false);

                return;

            }

            const user = snapshot.val();

            if (user.role === "admin") {

                navigate("/admin/dashboard");

            }

            else if (user.role === "citizen") {

                navigate("/citizen/dashboard");

            }

            else {

                setError("Invalid user role.");

            }

        }

        catch (err) {

            switch (err.code) {

                case "auth/user-not-found":
                    setError("User not found.");
                    break;

                case "auth/wrong-password":
                    setError("Incorrect password.");
                    break;

                case "auth/invalid-email":
                    setError("Invalid email address.");
                    break;

                default:
                    setError(err.message);

            }

        }

        setLoading(false);

    }

    return (

        <div className="loginPage">

            <div className="loginCard">

                <div className="loginHeader">

                    <Droplets
                        size={55}
                        color="#38bdf8"
                    />

                    <h1>

                        WaterShield

                    </h1>

                    <p>

                        Smart Water Leakage Detection System

                    </p>

                </div>

                <form
                    onSubmit={handleLogin}
                >

                    <div className="inputBox">

                        <Mail size={18} />

                        <input

                            type="email"

                            placeholder="Email"

                            value={email}

                            onChange={(e) =>
                                setEmail(e.target.value)
                            }

                            required

                        />

                    </div>

                    <div className="inputBox">

                        <Lock size={18} />

                        <input

                            type="password"

                            placeholder="Password"

                            value={password}

                            onChange={(e) =>
                                setPassword(e.target.value)
                            }

                            required

                        />

                    </div>

                    {error &&

                        <div className="errorBox">

                            {error}

                        </div>

                    }

                    <button
                        className="loginBtn"
                        disabled={loading}
                    >

                        <LogIn size={18} />

                        {

                            loading

                                ?

                                "Logging in..."

                                :

                                "Login"

                        }

                    </button>

                </form>

                <div className="registerText">

                    Don't have an account?

                    <Link to="/register">

                        Register

                    </Link>

                </div>

            </div>

        </div>

    );

}