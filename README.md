# Invoice App (MERN Stack)

A comprehensive Invoice Management Application built with the MERN stack (MongoDB, Express, React, Node.js). This application allows businesses to create, manage, and track invoices, customers, and products with ease.

## Features

### 🚀 Core Invoice Management
-   **Create & Edit Invoices**: Easy-to-use interface to create professional invoices.
-   **GST Support**: Built-in fields for Business and Client GSTIN, with automatic tax calculations.
-   **PDF Generation**: Instantly download invoices as PDF files.
-   **Status Tracking**: Track invoices as Pending, Paid, or Overdue.

### 👥 Customer & Product Management
-   **Customer Database**: Save customer details (Name, Email, GST, Address) for quick access.
-   **Product Database**: Save products/services with prices to auto-fill line items.
-   **Smart Auto-fill**: Select saved customers and products to populate invoice fields automatically.

### 💳 Payments & Finance
-   **Record Payments**: Track partial or full payments (Cash, Bank, UPI, etc.) against invoices.
-   **Auto-Status Update**: Invoices automatically switch to 'Paid' status when the balance clears.
-   **Payment History**: View a detailed history of all payments made for an invoice.

### 📊 Reports & Analytics
-   **Dashboard Overview**: View total Sales, total Paid amount, and total Pending amount at a glance.
-   **Visual Charts**: Interactive bar charts to visualize financial performance over time.
-   **Cloud Synced**: All data is securely stored in the cloud (MongoDB) and accessible from anywhere.

### 🔒 Security
-   **User Authentication**: Secure Signup and Login functionality using JWT.
-   **Data Privacy**: Each user has their own private database of clients and invoices.

## Tech Stack

-   **Frontend**: React.js, Context API, Chart.js, HTML2Canvas, JSPDF
-   **Backend**: Node.js, Express.js
-   **Database**: MongoDB (Mongoose)
-   **Authentication**: JSON Web Tokens (JWT)

## Getting Started

### Prerequisites

-   Node.js installed
-   MongoDB installed or a MongoDB Atlas connection string

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/yourusername/invoice-app.git
    cd invoice-app
    ```

2.  **Install Dependencies:**
    ```bash
    # Install server dependencies
    cd server
    npm install

    # Install client dependencies
    cd ../client
    npm install
    ```

3.  **Environment Setup:**
    -   Create a `.env` file in the `server` directory.
    -   Add the following variables:
        ```env
        MONGO_URI=your_mongodb_connection_string
        JWT_SECRET=your_jwt_secret
        PORT=5000
        ```

4.  **Run the Application:**
    -   **Start Backend:** `cd server && npm run server` (runs on port 5000)
    -   **Start Frontend:** `cd client && npm run dev` (runs on port 5173 or similar)

## Screenshots
*(Add screenshots of Dashboard, Invoice Form, and Reports here)*

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request.

## License

This project is open source and available under the [MIT License](LICENSE).
