import React, { useEffect, useState } from "react";
import API from "../api";

function ComplaintList() {
  const [complaints, setComplaints] = useState([]);
  const [search, setSearch] = useState("");

  const fetchComplaints = async () => {
    try {
      const res = await API.get("/complaints");
      setComplaints(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const updateStatus = async (id) => {
    const status = prompt("Enter Status");

    if (!status) return;

    await API.put(`/complaints/${id}`, {
      status,
    });

    fetchComplaints();
  };

  const deleteComplaint = async (id) => {
    await API.delete(`/complaints/${id}`);
    fetchComplaints();
  };

  const searchByLocation = async () => {
    const res = await API.get(
      `/complaints/search?location=${search}`
    );

    setComplaints(res.data);
  };

  return (
    <div className="container">
      <h2>Complaint List</h2>

      <input
        type="text"
        placeholder="Search by Location"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <button onClick={searchByLocation}>Search</button>

      {complaints.map((item) => (
        <div className="card" key={item._id}>
          <h3>{item.title}</h3>

          <p>
            <strong>Name:</strong> {item.name}
          </p>

          <p>
            <strong>Email:</strong> {item.email}
          </p>

          <p>
            <strong>Description:</strong> {item.description}
          </p>

          <p>
            <strong>Category:</strong> {item.category}
          </p>

          <p>
            <strong>Location:</strong> {item.location}
          </p>

          <p>
            <strong>Status:</strong> {item.status}
          </p>

          <p>
            <strong>Priority:</strong> {item.priority}
          </p>

          <p>
            <strong>Department:</strong> {item.department}
          </p>

          <p>
            <strong>AI Summary:</strong> {item.aiSummary}
          </p>

          <p>
            <strong>Auto Response:</strong> {item.autoResponse}
          </p>

          <button onClick={() => updateStatus(item._id)}>
            Update Status
          </button>

          <button onClick={() => deleteComplaint(item._id)}>
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}

export default ComplaintList;