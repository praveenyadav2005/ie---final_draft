// App.jsx
import React from 'react';
import { useNavigate } from "react-router-dom"; 
import { AppProvider } from './context/AppContext';
import { Outlet } from 'react-router-dom'; 
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  const navigate = useNavigate();

  return (
    <AppProvider navigate={navigate}>
      <div className="bg-gray-900 text-white min-h-screen w-full">
        <div className="container mx-auto p-4">
          {/* Outlet renders the nested routes */}
          <Outlet />
        </div>
        <ToastContainer 
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="dark"
        />
      </div>
    </AppProvider>
  );
}

export default App;