import React from "react";
import "../styles/glasscard.css";

export default function GlassCard({
  title,
  icon,
  children,
}) {

  return (

    <div className="glassCard">

      <div className="glassHeader">

        <div className="glassIcon">

          {icon}

        </div>

        <h3>{title}</h3>

      </div>

      <div className="glassContent">

        {children}

      </div>

    </div>

  );

}