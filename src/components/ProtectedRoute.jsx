import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { ref, get } from "firebase/database";
import { auth, db } from "../firebase/firebase";

function ProtectedRoute({ children, allowedRole }) {

  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {

    const unsubscribe = onAuthStateChanged(auth, async (user) => {

      if (!user) {
        setAuthorized(false);
        setLoading(false);
        return;
      }

      try {

        const snapshot = await get(ref(db, `Users/${user.uid}`));

        if (snapshot.exists()) {

          const userData = snapshot.val();

          if (userData.role === allowedRole) {
            setAuthorized(true);
          } else {
            setAuthorized(false);
          }

        } else {

          setAuthorized(false);

        }

      } catch (error) {

        console.error(error);
        setAuthorized(false);

      }

      setLoading(false);

    });

    return () => unsubscribe();

  }, [allowedRole]);

  if (loading) {

    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontSize: "20px",
          fontWeight: "600"
        }}
      >
        Loading...
      </div>
    );

  }

  if (!authorized) {

    return <Navigate to="/" replace />;

  }

  return children;

}

export default ProtectedRoute;