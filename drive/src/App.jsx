// App.jsx
import React from 'react';
import { useNavigate } from "react-router-dom"; 
import { AppProvider } from './context/AppContext';
import { Outlet } from 'react-router-dom'; 
function App() {
  const navigate = useNavigate();

  return (
    <AppProvider navigate={navigate}>
      <div className="bg-gray-900 text-white min-h-screen w-full">
        <div className="container mx-auto p-4">
          {/* Outlet renders the nested routes */}
          <Outlet />
        </div>
      </div>
    </AppProvider>
  );
}

export default App;