import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
    createUserWithEmailAndPassword
} from "firebase/auth";

import {
    ref,
    set
} from "firebase/database";

import { auth, db } from "../../firebase/firebase";

import {
    User,
    Mail,
    Phone,
    Lock,
    UserPlus,
    Droplets
} from "lucide-react";

import "../../styles/register.css";

export default function Register() {

    const navigate = useNavigate();

    const [form, setForm] = useState({

        name: "",

        email: "",

        phone: "",

        password: "",

        confirmPassword: ""

    });

    const [loading, setLoading] = useState(false);

    const [error, setError] = useState("");

    function handleChange(e) {

        setForm({

            ...form,

            [e.target.name]: e.target.value

        });

    }

    async function handleRegister(e) {

        e.preventDefault();

        setError("");

        if (form.password !== form.confirmPassword) {

            setError("Passwords do not match.");

            return;

        }

        setLoading(true);

        try {

            // Create Authentication User

            const userCredential =

                await createUserWithEmailAndPassword(

                    auth,

                    form.email,

                    form.password

                );
            const user = userCredential.user;

            // Force refresh the ID token
            await user.getIdToken(true);

            await set(
                ref(db, `Users/${user.uid}`),
                {
                    name: form.name,
                    email: form.email,
                    phone: form.phone,
                    role: "citizen"
                }
            );

            alert("Registration Successful!");

            navigate("/");

        }

        catch (err) {

            console.log("Full Error:", err);
            console.log("Error Code:", err.code);
            console.log("Error Message:", err.message);

            alert(err.message);

            setError(err.message);

        }

        setLoading(false);

    }

    return (

        <div className="registerPage">

            <div className="registerCard">

                <div className="registerHeader">

                    <Droplets

                        size={55}

                        color="#38bdf8"

                    />

                    <h1>

                        WaterShield

                    </h1>

                    <p>

                        Citizen Registration

                    </p>

                </div>

                <form

                    onSubmit={handleRegister}

                >

                    <div className="inputBox">

                        <User size={18} />

                        <input

                            type="text"

                            name="name"

                            placeholder="Full Name"

                            value={form.name}

                            onChange={handleChange}

                            required

                        />

                    </div>

                    <div className="inputBox">

                        <Mail size={18} />

                        <input

                            type="email"

                            name="email"

                            placeholder="Email"

                            value={form.email}

                            onChange={handleChange}

                            required

                        />

                    </div>

                    <div className="inputBox">

                        <Phone size={18} />

                        <input

                            type="tel"

                            name="phone"

                            placeholder="Phone Number"

                            value={form.phone}

                            onChange={handleChange}

                            required

                        />

                    </div>

                    <div className="inputBox">

                        <Lock size={18} />

                        <input

                            type="password"

                            name="password"

                            placeholder="Password"

                            value={form.password}

                            onChange={handleChange}

                            required

                        />

                    </div>

                    <div className="inputBox">

                        <Lock size={18} />

                        <input

                            type="password"

                            name="confirmPassword"

                            placeholder="Confirm Password"

                            value={form.confirmPassword}

                            onChange={handleChange}

                            required

                        />

                    </div>

                    {error &&

                        <div className="errorBox">

                            {error}

                        </div>

                    }

                    <button

                        className="registerBtn"

                        disabled={loading}

                    >

                        <UserPlus size={18} />

                        {

                            loading

                                ?

                                "Creating Account..."

                                :

                                "Register"

                        }

                    </button>

                </form>

                <div className="loginText">

                    Already have an account?

                    <Link to="/">

                        Login

                    </Link>

                </div>

            </div>

        </div>

    );

}