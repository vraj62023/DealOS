# DealOS - Full-Stack Deal Room & AI Matching Platform
[Live Demo Link](https://dealos-frontend.onrender.com)

DealOS is a modern, full-stack application designed to streamline deals, manage company data rooms, and facilitate matching between companies and potential lenders using AI. 

The project is structured as a monorepo consisting of a React-based frontend client and an Express-based backend server.

---

## 🚀 Key Features

*   **🔒 Secure User Authentication**: JWT token-based authorization and session management.
*   **🏢 Company Profile & Financials Manager**: Create, update, and manage company metrics, including a real-time tracking list for missing fields required for matchmaking.
*   **📁 Virtual Data Room**: Secure uploading, listing, and storage of transaction documents, teasers, and financials powered by Cloudinary and Multer.
*   **🤖 AI Copilot (Gemini AI)**:
    *   **Document Intelligence / OCR**: Extract financial and operational metrics from uploaded PDF/Word documents using Google Gemini.
    *   **Interactive Chatbot**: Ask questions about deal status, metrics, and documents with persistent chat history.
    *   **Background Probe Search**: Trigger automated searches for company profiles.
*   **🎯 Deal Matching Engine**: Match company requirements with lender criteria automatically based on profile completion.
*   **🛡️ Secure HMAC Webhooks**: Webhook endpoint using HMAC-SHA256 signature verification to safely receive automated third-party data uploads.

---

## 📂 Project Structure

```
DealOs/
├── client/                 # React Frontend (Vite, TailwindCSS, Redux Toolkit)
│   ├── src/
│   │   ├── app/            # Redux store and slices
│   │   ├── components/     # UI Components (OnePager, Sidebar, etc.)
│   │   ├── configs/        # Axios API configuration
│   │   ├── pages/          # Core pages (Dashboard, Dataroom, Settings)
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── server/                 # Node.js/Express Backend (Mongoose, Gemini, Cloudinary)
│   ├── configs/            # Database and Multer configurations
│   ├── controllers/        # Request handling and business logic
│   ├── models/             # Mongoose schemas (User, DealMatch, etc.)
│   ├── routes/             # REST API endpoints
│   ├── server.js           # Server entry point
│   └── package.json
└── README.md
```

---

## 🛠️ Tech Stack

### Frontend (Client)
*   **Core**: React 19, Vite
*   **State Management**: Redux Toolkit, React-Redux
*   **Styling**: Tailwind CSS v4, PostCSS, Lucide Icons
*   **Routing**: React Router DOM v7
*   **HTTP Client**: Axios

### Backend (Server)
*   **Core**: Node.js, Express
*   **Database**: MongoDB, Mongoose
*   **File Processing**: Multer, Cloudinary, Mammoth, PDF-Parse
*   **AI Engine**: Google Generative AI (`@google/generative-ai`)
*   **Security & Webhooks**: JSON Web Tokens (JWT), Bcrypt.js, HMAC-SHA256 verification

---

## ⚙️ Environment Variables Setup

Before running the application, create your environment files based on the provided templates:

### Backend (`/server/.env`)
Copy `server/.env.example` to `server/.env` and fill in the values:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
GEMINI_API_KEY=your_gemini_api_key
JWT_SECRET=your_jwt_signing_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
WEBHOOK_SECRET=your_webhook_hmac_secret
```

### Frontend (`/client/.env`)
Copy `client/.env.example` to `client/.env` and update the base URL:
```env
VITE_BASE_URL=http://localhost:5000/api
```

---

## 💻 Local Development Setup

### Prerequisites
*   Node.js (v18+ recommended)
*   MongoDB Instance (Atlas or Local)

### Steps

1.  **Clone the Repository**:
    ```bash
    git clone <your-repository-url>
    cd DealOs
    ```

2.  **Start Backend Server**:
    ```bash
    cd server
    npm install
    npm run dev
    ```
    *The server will start on `http://localhost:5000`*

3.  **Start Frontend Client**:
    ```bash
    cd ../client
    npm install
    npm run dev
    ```
    *Open `http://localhost:5173` in your browser to view the application.*

---

## 📡 API Endpoints

### Authentication
*   `POST /api/auth/register` - User Registration
*   `POST /api/auth/login` - User Login

### Company Profile
*   `GET /api/company` - Get Company Profile
*   `PUT /api/company/update` - Create or Update Profile & Financials

### Data Room
*   `GET /api/dataroom` - Get Uploaded Documents
*   `POST /api/dataroom/upload` - Upload Document (Supports PDF, DOCX, Images)

### AI Assistant
*   `POST /api/ai/probe-search` - Trigger Background Probe Search
*   `POST /api/ai/extract-document` - Upload document and extract intelligence with Gemini
*   `GET /api/ai/chat-history` - Retrieve chatbot history
*   `POST /api/ai/chat-message` - Save new chatbot message
*   `DELETE /api/ai/chat-history` - Clear chat logs

### Matching
*   `GET /api/matches` - Get matches or checklist block details

### Webhooks
*   `POST /api/webhooks/upload` - Secure HMAC-verified webhook endpoint for third-party uploads

---

## 🌐 Production Deployment

For details on deploying the application to production platforms like **Render**, refer to the deployment checklists for both Frontend and Backend services in your workspace setup.
