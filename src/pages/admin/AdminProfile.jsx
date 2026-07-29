import { useEffect, useState } from "react";
import { auth, db } from "../../firebase/firebase";
import { ref, get, update } from "firebase/database";
import { User, Mail, Phone, Shield } from "lucide-react";

import "../../styles/adminprofile.css";

function AdminProfile() {

  const [editing, setEditing] = useState(false);

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    role: ""
  });

  useEffect(() => {
    async function loadProfile() {

      if (!auth.currentUser) return;

      const snapshot = await get(
        ref(db, `Users/${auth.currentUser.uid}`)
      );

      if (snapshot.exists()) {
        setProfile(snapshot.val());
      }
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

    await update(
      ref(db, `Users/${auth.currentUser.uid}`),
      {
        name: profile.name,
        phone: profile.phone
      }
    );

    alert("Profile Updated Successfully");

    setEditing(false);
  }

  return (
    <div className="adminProfile">

      <h1>Admin Profile</h1>

      <div className="profileCard">

        <div className="profileRow">
          <User size={20}/>
          <span>Name</span>

          {
            editing ?

            <input
              name="name"
              value={profile.name}
              onChange={handleChange}
            />

            :

            <strong>{profile.name}</strong>
          }

        </div>

        <div className="profileRow">
          <Mail size={20}/>
          <span>Email</span>
          <strong>{profile.email}</strong>
        </div>

        <div className="profileRow">
          <Phone size={20}/>
          <span>Phone</span>

          {
            editing ?

            <input
              name="phone"
              value={profile.phone}
              onChange={handleChange}
            />

            :

            <strong>{profile.phone}</strong>
          }

        </div>

        <div className="profileRow">
          <Shield size={20}/>
          <span>Role</span>
          <strong>{profile.role}</strong>
        </div>

        {
          editing ?

          <button
            className="editBtn"
            onClick={saveProfile}
          >
            Save Profile
          </button>

          :

          <button
            className="editBtn"
            onClick={() => setEditing(true)}
          >
            Edit Profile
          </button>
        }

      </div>

    </div>
  );
}

export default AdminProfile;