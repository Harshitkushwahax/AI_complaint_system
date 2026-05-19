import React from "react";
import { Link } from "react-router-dom";

function Navbar() {
  return (
    <div className="navbar">
      <h2>AI Complaint System</h2>

      <div>
        <Link to="/">Add Complaint</Link>
        <Link to="/complaints">Complaints</Link>
        <Link to="/login">Login</Link>
        <Link to="/signup">Signup</Link>
      </div>
    </div>
  );
}

export default Navbar;