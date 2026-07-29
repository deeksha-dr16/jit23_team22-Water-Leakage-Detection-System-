import React from "react";

import "../styles/statuscard.css";

export default function StatusCard({

    title,

    value,

    icon,

    color

}) {

    return (

        <div
            className="statusCard"
            style={{

                borderTop: `5px solid ${color}`

            }}
        >

            <div className="statusTop">

                <div>

                    <h4>

                        {title}

                    </h4>

                    <h2>

                        {value}

                    </h2>

                </div>

                <div>

                    {icon}

                </div>

            </div>

        </div>

    );

}