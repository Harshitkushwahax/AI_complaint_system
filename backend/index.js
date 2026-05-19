// index.js
const dns = require('dns').promises;   // or just require('dns') in older Node
dns.setServers(['8.8.8.8', '1.1.1.1']);

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();

// ======================
// MIDDLEWARE
// ======================
app.use(express.json());
app.use(cors());

// ======================
// DATABASE CONNECTION
// ======================
mongoose
  .connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/aiComplaintDB")
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

// ======================
// USER SCHEMA
// ======================
const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },

  email: {
    type: String,
    required: true,
    unique: true,
  },

  password: {
    type: String,
    required: true,
  },
});

const User = mongoose.model("User", UserSchema);

// ======================
// COMPLAINT SCHEMA
// ======================
const ComplaintSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },

  email: {
    type: String,
    required: true,
    match: [/^\S+@\S+\.\S+$/, "Invalid Email"],
  },

  title: {
    type: String,
    required: true,
  },

  description: {
    type: String,
    required: true,
  },

  category: {
    type: String,
    required: true,
  },

  location: {
    type: String,
    required: true,
  },

  status: {
    type: String,
    default: "Pending",
  },

  priority: {
    type: String,
    default: "Medium",
  },

  department: {
    type: String,
    default: "General Department",
  },

  aiSummary: {
    type: String,
  },

  autoResponse: {
    type: String,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Complaint = mongoose.model("Complaint", ComplaintSchema);

// ======================
// JWT AUTH MIDDLEWARE
// ======================
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({
      message: "Access Denied. No Token Provided",
    });
  }

  try {
    const verified = jwt.verify(token, "SECRETKEY");
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({
      message: "Invalid Token",
    });
  }
};

// ======================
// AI ANALYSIS FUNCTION
// ======================
const analyzeComplaint = (description, category) => {
  let priority = "Medium";
  let department = "General Department";

  const text = description.toLowerCase();

  // Priority Detection
  if (
    text.includes("fire") ||
    text.includes("electric") ||
    text.includes("danger") ||
    text.includes("urgent")
  ) {
    priority = "High";
  }

  // Department Recommendation
  if (category.toLowerCase().includes("water")) {
    department = "Water Department";
  } else if (category.toLowerCase().includes("electric")) {
    department = "Electricity Department";
  } else if (category.toLowerCase().includes("garbage")) {
    department = "Sanitation Department";
  } else if (category.toLowerCase().includes("road")) {
    department = "Road Maintenance Department";
  }

  // AI Summary
  const aiSummary =
    description.length > 100
      ? description.substring(0, 100) + "..."
      : description;

  // Auto Response
  const autoResponse = `Dear User, your complaint has been received and forwarded to the ${department}. Priority Level: ${priority}.`;

  return {
    priority,
    department,
    aiSummary,
    autoResponse,
  };
};

// ======================
// AUTH ROUTES
// ======================

// SIGNUP
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    // Check existing user
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    // Hash Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create User
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    res.status(201).json({
      message: "User Registered Successfully",
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
});

// LOGIN
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find User
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "User Not Found",
      });
    }

    // Compare Password
    const validPassword = await bcrypt.compare(
      password,
      user.password
    );

    if (!validPassword) {
      return res.status(401).json({
        message: "Invalid Password",
      });
    }

    // Generate JWT Token
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
      },
      "SECRETKEY",
      {
        expiresIn: "1d",
      }
    );

    res.status(200).json({
      message: "Login Successful",
      token,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
});

// ======================
// COMPLAINT ROUTES
// ======================

// 1. ADD COMPLAINT
app.post("/api/complaints", verifyToken, async (req, res) => {
  try {
    const {
      name,
      email,
      title,
      description,
      category,
      location,
    } = req.body;

    // Validation
    if (
      !name ||
      !email ||
      !title ||
      !description ||
      !category ||
      !location
    ) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    // AI Analysis
    const aiResult = analyzeComplaint(description, category);

    // Create Complaint
    const complaint = new Complaint({
      name,
      email,
      title,
      description,
      category,
      location,
      priority: aiResult.priority,
      department: aiResult.department,
      aiSummary: aiResult.aiSummary,
      autoResponse: aiResult.autoResponse,
    });

    await complaint.save();

    res.status(201).json({
      message: "Complaint Stored Successfully",
      complaint,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
});

// 2. GET ALL COMPLAINTS
app.get("/api/complaints", verifyToken, async (req, res) => {
  try {
    const complaints = await Complaint.find();

    res.status(200).json(complaints);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
});

// 3. UPDATE COMPLAINT STATUS
app.put("/api/complaints/:id", verifyToken, async (req, res) => {
  try {
    const { status } = req.body;

    const updatedComplaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    res.status(200).json({
      message: "Complaint Status Updated",
      updatedComplaint,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
});

// 4. DELETE COMPLAINT
app.delete("/api/complaints/:id", verifyToken, async (req, res) => {
  try {
    await Complaint.findByIdAndDelete(req.params.id);

    res.status(200).json({
      message: "Complaint Deleted Successfully",
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
});

// 5. SEARCH COMPLAINT BY LOCATION
app.get(
  "/api/complaints/search",
  verifyToken,
  async (req, res) => {
    try {
      const { location } = req.query;

      const complaints = await Complaint.find({
        location: {
          $regex: location,
          $options: "i",
        },
      });

      res.status(200).json(complaints);
    } catch (err) {
      res.status(500).json({
        message: err.message,
      });
    }
  }
);

// 6. FILTER BY CATEGORY
app.get(
  "/api/complaints/category/:category",
  verifyToken,
  async (req, res) => {
    try {
      const complaints = await Complaint.find({
        category: req.params.category,
      });

      res.status(200).json(complaints);
    } catch (err) {
      res.status(500).json({
        message: err.message,
      });
    }
  }
);

// ======================
// AI ANALYZER API
// ======================
app.post("/api/ai/analyze", verifyToken, (req, res) => {
  try {
    const { description, category } = req.body;

    const result = analyzeComplaint(description, category);

    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
});

// ======================
// DEFAULT ROUTE
// ======================
app.get("/", (req, res) => {
  res.send("AI Smart Complaint Management System API Running");
});

// ======================
// SERVER
// ======================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server Running on Port ${PORT}`);
});

/*
==================================================
INSTALL REQUIRED PACKAGES
==================================================

npm init -y

npm install express mongoose cors dotenv bcryptjs jsonwebtoken

npm install --save-dev nodemon

==================================================
PACKAGE.JSON SCRIPTS
==================================================

"scripts": {
  "start": "node index.js",
  "dev": "nodemon index.js"
}

==================================================
CREATE .env FILE
==================================================

MONGO_URI=mongodb://127.0.0.1:27017/aiComplaintDB
PORT=5000

==================================================
RUN PROJECT
==================================================

npm run dev

==================================================
TEST API USING POSTMAN
==================================================

1. Signup
POST http://localhost:5000/api/auth/signup

{
  "name":"Rahul",
  "email":"rahul@gmail.com",
  "password":"123456"
}

2. Login
POST http://localhost:5000/api/auth/login

{
  "email":"rahul@gmail.com",
  "password":"123456"
}

Copy Token

3. Add Complaint
POST http://localhost:5000/api/complaints

Headers:
authorization : YOUR_TOKEN

Body:
{
  "name":"Rahul Kumar",
  "email":"rahul@gmail.com",
  "title":"Water Leakage Issue",
  "description":"Water pipeline damaged near market area.",
  "category":"Water Supply",
  "location":"Ghaziabad"
}

4. Get Complaints
GET http://localhost:5000/api/complaints

5. Update Status
PUT http://localhost:5000/api/complaints/ID

{
  "status":"Resolved"
}

6. Search by Location
GET http://localhost:5000/api/complaints/search?location=Ghaziabad

==================================================
RENDER DEPLOYMENT
==================================================

1. Push code to GitHub
2. Open Render
3. Create Web Service
4. Connect GitHub Repository
5. Build Command:
   npm install
6. Start Command:
   node index.js
7. Add Environment Variable:
   MONGO_URI = your mongodb atlas url

==================================================
EXPECTED OUTPUTS
==================================================

✔ Complaint stored successfully
✔ AI detects priority
✔ Department recommendation
✔ AI summary generated
✔ JWT authentication working
✔ Password encrypted using bcrypt
✔ Protected routes secured
✔ CRUD operations successful

*/