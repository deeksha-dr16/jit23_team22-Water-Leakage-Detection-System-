import React, { useEffect, useState } from "react";
import { ref, push, get } from "firebase/database";
import { auth, db } from "../../firebase/firebase";

import {
  MapPin,
  Phone,
  User,
  FileText,
  Camera,
  AlertTriangle
} from "lucide-react";

import "../../styles/report.css";

export default function ReportLeak() {

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [image, setImage] = useState(null);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    area: "",
    landmark: "",
    description: ""
  });

  useEffect(() => {

    async function loadCitizen() {

      if (!auth.currentUser) return;

      const uid = auth.currentUser.uid;

      const snapshot = await get(ref(db, `Users/${uid}`));

      if (snapshot.exists()) {

        const data = snapshot.val();

        setForm((prev) => ({
          ...prev,
          name: data.name || "",
          phone: data.phone || ""
        }));

      }

    }

    loadCitizen();

  }, []);

  function handleChange(e) {

    setForm({
      ...form,
      [e.target.name]: e.target.value
    });

  }

  async function submitReport(e) {

    e.preventDefault();

    if (!auth.currentUser) {

      alert("Please login first.");
      return;

    }

    setLoading(true);

    try {

      await push(ref(db, "ReportedLeaks"), {

        citizenId: auth.currentUser.uid,

        name: form.name,

        phone: form.phone,

        area: form.area,

        landmark: form.landmark,

        description: form.description,

        image: image ? image.name : "",

        status: "Pending",

        severity: "Unknown",

        engineer: "",

        repairedAt: "",

        source: "Citizen",

        latitude: "",

        longitude: "",

        reportedAt: new Date().toLocaleString()

      });

      setSuccess(true);

      setForm((prev) => ({
        ...prev,
        area: "",
        landmark: "",
        description: ""
      }));

      setImage(null);

      setTimeout(() => {

        setSuccess(false);

      }, 3000);

    }

    catch (err) {

      alert(err.message);

    }

    setLoading(false);

  }

  return (

    <div className="reportPage">

      <div className="glassCard">

        <div className="header">

          <AlertTriangle
            size={40}
            color="#FFD54F"
          />

          <div>

            <h1>Report Water Leakage</h1>

            <p>

              Report leakage and help WaterShield detect pipeline failures.

            </p>

          </div>

        </div>

        {

          success && (

            <div className="successBox">

              ✅ Report Submitted Successfully

            </div>

          )

        }

        <form onSubmit={submitReport}>

          <div className="grid">

            <div className="inputBox">

              <User size={18} />

              <input
                value={form.name}
                disabled
              />

            </div>

            <div className="inputBox">

              <Phone size={18} />

              <input
                value={form.phone}
                disabled
              />

            </div>

            <div className="inputBox">

              <MapPin size={18} />

              <input
                required
                name="area"
                placeholder="Area"
                value={form.area}
                onChange={handleChange}
              />

            </div>

            <div className="inputBox">

              <MapPin size={18} />

              <input
                required
                name="landmark"
                placeholder="Landmark"
                value={form.landmark}
                onChange={handleChange}
              />

            </div>

          </div>

          <div className="textareaBox">

            <FileText size={18} />

            <textarea
              rows="6"
              required
              name="description"
              placeholder="Describe the leakage..."
              value={form.description}
              onChange={handleChange}
            />

          </div>

          <div className="uploadBox">

            <Camera />

            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImage(e.target.files[0])}
            />

            {

              image &&

              <span className="fileName">

                {image.name}

              </span>

            }

          </div>

          <button
            className="submitBtn"
            disabled={loading}
          >

            {

              loading

                ? "Submitting..."

                : "Submit Report"

            }

          </button>

        </form>

      </div>

    </div>

  );

}