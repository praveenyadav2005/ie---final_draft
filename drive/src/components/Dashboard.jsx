// src/components/Dashboard.jsx
import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import UploadFile from './UploadFile';
import FileList from './FileList';
import ShareModal from './ShareModal';
import SharedDashboard from './SharedDashboard';

export default function Dashboard() {
  const { walletConnected, uploadedFiles, accounts, account, handleAccountChange } = useAppContext();
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  if (!walletConnected) return null;

  return (
    <div className="lg:w-[85%] md:w-[90%] w-[99%] mx-auto min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex flex-col p-6">
      {/* Header */}
      <h1 className="md:text-4xl text-3xl font-extrabold mb-6 tracking-wide">🚀 Your Dashboard</h1>

      {/* Account Selection Dropdown */}
      <div className="mb-6">
        <label htmlFor="account-select" className="block text-lg font-semibold mb-2">
          Select Account:
        </label>
        <select
          id="account-select"
          value={account}
          onChange={(e) => handleAccountChange(e)}
          className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
        >
          {accounts.map((acc, index) => (
            <option key={index} value={acc}>
              {acc}
            </option>
          ))}
        </select>
      </div>

      <UploadFile />

      {/* Uploaded Files Section */}
      <div className="mt-8 w-full">
        <h2 className="text-2xl font-semibold mb-4">📂 Uploaded Files</h2>
        {console.log("hello")}
        {console.log("uploadedFiles", uploadedFiles)}

        <FileList files={uploadedFiles} />
      </div>

      {/* Shared Files Section */}
      <SharedDashboard />

      {isShareModalOpen && <ShareModal onClose={() => setIsShareModalOpen(false)} />}
    </div>
  );
}