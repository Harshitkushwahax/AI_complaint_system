import React, { useState } from "react";
import API from "../api";

function ComplaintForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    title: "",
    description: "",
    category: "",
    location: "",
  });

  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await API.post("/complaints", formData);

      setMessage(res.data.message);

      setFormData({
        name: "",
        email: "",
        title: "",
        description: "",
        category: "",
        location: "",
      });
    } catch (err) {
      setMessage(err.response.data.message);
    }
  };

  return (
    <div className="container">
      <h2>Complaint Registration</h2>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="name"
          placeholder="Enter Name"
          value={formData.name}
          onChange={handleChange}
        />

        <input
          type="email"
          name="email"
          placeholder="Enter Email"
          value={formData.email}
          onChange={handleChange}
        />

        <input
          type="text"
          name="title"
          placeholder="Complaint Title"
          value={formData.title}
          onChange={handleChange}
        />

        <textarea
          name="description"
          placeholder="Complaint Description"
          value={formData.description}
          onChange={handleChange}
        ></textarea>

        <input
          type="text"
          name="category"
          placeholder="Complaint Category"
          value={formData.category}
          onChange={handleChange}
        />

        <input
          type="text"
          name="location"
          placeholder="Location"
          value={formData.location}
          onChange={handleChange}
        />

        <button type="submit">Submit Complaint</button>
      </form>

      <p>{message}</p>
    </div>
  );
}

export default ComplaintForm;