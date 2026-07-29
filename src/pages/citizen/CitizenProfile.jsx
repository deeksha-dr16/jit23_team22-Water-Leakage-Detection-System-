import React, { useEffect, useState } from "react";
import { auth, db } from "../../firebase/firebase";
import { ref, get, update } from "firebase/database";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";

import {
  User,
  Mail,
  Phone,
  Shield,
  Save,
  LogOut
} from "lucide-react";

import "../../styles/citizenprofile.css";

export default function CitizenProfile() {

  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    role: ""
  });

  useEffect(() => {

    async function loadProfile() {

      if (!auth.currentUser) return;

      const uid = auth.currentUser.uid;

      const snapshot = await get(ref(db, `Users/${uid}`));

      if (snapshot.exists()) {

        setProfile(snapshot.val());

      }

      setLoading(false);

    }

    loadProfile();

  }, []);

  function handleChange(e) {

    setProfile({

      ...profile,

      [e.target.name]: e.target.value

    });

  }

  async function saveProfile() {

    if (!auth.currentUser) return;

    setSaving(true);

    try {

      await update(

        ref(db, `Users/${auth.currentUser.uid}`),

        {

          name: profile.name,

          phone: profile.phone

        }

      );

      alert("Profile updated successfully.");

    }

    catch (err) {

      alert(err.message);

    }

    setSaving(false);

  }

  async function logout() {

    await signOut(auth);

    navigate("/login");

  }

  if (loading) {

    return (

      <div className="profileContainer">

        <div className="profileCard">

          Loading Profile...

        </div>

      </div>

    );

  }

  return (

    <div className="profileContainer">

      <div className="profileCard">

        <div className="profileHeader">

          <div className="avatar">

            <User size={45} />

          </div>

          <div>

            <h2>{profile.name}</h2>

            <p>WaterShield Citizen</p>

          </div>

        </div>

        <div className="profileForm">

          <div className="inputGroup">

            <label>

              <User size={16} />

              Name

            </label>

            <input
              name="name"
              value={profile.name}
              onChange={handleChange}
            />

          </div>

          <div className="inputGroup">

            <label>

              <Mail size={16} />

              Email

            </label>

            <input
              value={profile.email}
              disabled
            />

          </div>

          <div className="inputGroup">

            <label>

              <Phone size={16} />

              Phone

            </label>

            <input
              name="phone"
              value={profile.phone}
              onChange={handleChange}
            />

          </div>

          <div className="inputGroup">

            <label>

              <Shield size={16} />

              Role

            </label>

            <input
              value={profile.role}
              disabled
            />

          </div>

        </div>

        <div className="buttonGroup">

          <button
            className="saveBtn"
            onClick={saveProfile}
            disabled={saving}
          >

            <Save size={18} />

            {

              saving

              ?

              "Saving..."

              :

              "Save Changes"

            }

          </button>

          <button
            className="logoutBtn"
            onClick={logout}
          >

            <LogOut size={18} />

            Logout

          </button>

        </div>

      </div>

    </div>

  );

}