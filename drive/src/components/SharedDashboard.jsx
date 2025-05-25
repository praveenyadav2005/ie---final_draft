// src/components/SharedDashboard.jsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAppContext } from "../context/AppContext";
import { ImCross } from "react-icons/im";
import ShareModal from "./ShareModal";
import { Buffer } from "buffer";
import nacl from "tweetnacl";
import CryptoJS from "crypto-js";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';

function SharedDashboard() {
  const { getSharedFiles, getSharedFilesBySender, sharedFiles, contract, account, publicKey, privateKey, getEncryptedPasskey, fetchPublicKey} = useAppContext();
  const [searchType, setSearchType] = useState("All");
  const [inputValue, setInputValue] = useState("");
  const [filteredFiles, setFilteredFiles] = useState([]);
  const [error, setError] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);

  const ipfsGateway = "https://gateway.pinata.cloud/ipfs/";

  const handleFileClick = (file) => {
    setSelectedFile(file);
  };

  const handleCloseModal = () => {
    setSelectedFile(null);
  };

  const handleDownloadFile = async () => {
    if (!selectedFile) return;

    try {
      // Fetch the encrypted AES key from the contract
      const encryptedAESKeyHex = await getEncryptedPasskey(selectedFile.cid, selectedFile.sharedBy);
      
      const cleanHex = encryptedAESKeyHex.startsWith("0x") 
        ? encryptedAESKeyHex.slice(2) 
        : encryptedAESKeyHex;

      const encryptedAESKeyBuffer = Buffer.from(cleanHex, "hex");

      // Split into nonce and encrypted data
      const nonce = encryptedAESKeyBuffer.subarray(0, nacl.box.nonceLength);
      const encryptedData = encryptedAESKeyBuffer.subarray(nacl.box.nonceLength);

      const senderPublicKey = await fetchPublicKey(selectedFile.sharedBy);
      const senderPublicKeyUint8Array = new Uint8Array(Buffer.from(senderPublicKey, "hex"));

      // Decrypt the AES key using the private key
      const decryptedAESKey = nacl.box.open(
        new Uint8Array(encryptedData),
        new Uint8Array(nonce),
        senderPublicKeyUint8Array,  // sender's public key
        new Uint8Array(Buffer.from(privateKey, "hex"))  // your private key
      );

      if (!decryptedAESKey) {
        throw new Error("Failed to decrypt the AES key. Ensure the keys are correct.");
      }

      // Fetch the encrypted file from IPFS
      const fileUrl = `${ipfsGateway}${selectedFile.cid}`;
      const response = await fetch(fileUrl);
      if (!response.ok) throw new Error("Failed to download file from IPFS.");

      const responseFileData = await response.arrayBuffer();
      const responseData = new Uint8Array(responseFileData); // Convert to Uint8Array

      // Extract the IV and encrypted file data
      const iv = responseData.slice(0, 12); // First 12 bytes are the IV
      const encryptedFileData = responseData.slice(12); // Remaining bytes are the encrypted file

      // Import the decrypted AES key
      const aesKey = await window.crypto.subtle.importKey(
        "raw",
        decryptedAESKey,
        { name: "AES-GCM" },
        false,
        ["decrypt"]
      );

      // Decrypt the file
      const decryptedFile = await window.crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        aesKey,
        encryptedFileData
      );

      // Create a Blob from the decrypted file
      const blob = new Blob([decryptedFile], { type: selectedFile.fileType || "application/octet-stream" });
      const blobUrl = URL.createObjectURL(blob);

      // Create and trigger download link
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = selectedFile.fileName || "download";
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);

      setSelectedFile(null);
      toast.success("File downloaded successfully!", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      });
    } catch (error) {
      console.error("Error downloading file:", error);
      toast.error("Failed to download file: " + error.message, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      });
    }
  };

  const handleViewFiles = async () => {
    try {
      setError(""); // Clear previous errors
      
      if (searchType === "All") {
        // For "All" type, refresh the files
        await getSharedFiles();
        setFilteredFiles(sharedFiles || []);
        if (!sharedFiles || sharedFiles.length === 0) {
          setError("No shared files available.");
        }
        return;
      }
      
      // For sender search
      if (!inputValue.trim()) {
        setError("Please enter a sender address");
        return;
      }
      
      const result = await getSharedFilesBySender(inputValue);
      setFilteredFiles(result || []);
      
      if (!result || result.length === 0) {
        setError("No files found for this address.");
      }
    } catch (error) {
      console.error("Error in handleViewFiles:", error);
      setError("Error fetching files: " + error.message);
    }
  };

  const handleClearSearch = () => {
    setInputValue("");
    setFilteredFiles(sharedFiles);
    setError("");
  };

  // useEffect to load all shared files on component mount and when sharedFiles changes
  useEffect(() => {
    const loadAllSharedFiles = async () => {
      try {
        if (account) {  // Only fetch if we have an account
          await getSharedFiles();
          setFilteredFiles(sharedFiles || []);
          if (!sharedFiles || sharedFiles.length === 0) {
            setError("No shared files available.");
          }
        }
      } catch (error) {
        console.error("Error loading shared files:", error);
        setError("Error loading files: " + error.message);
      }
    };

    loadAllSharedFiles();
  }, [account]); // Only depend on account changes

  return (
    <div className="p-4 bg-gray-900 rounded-lg mt-4">
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
      <h2 className="text-2xl font-bold text-white mb-4">View Shared Files</h2>
      <div className="flex gap-2 mb-4">
        <select
          value={searchType}
          onChange={(e) => {
            setSearchType(e.target.value);
            setInputValue("");
            setError("");
          }}
          className="p-2 rounded-lg border border-gray-700 bg-gray-800 text-white"
        >
          <option value="All">All files</option>
          <option value="sender">Search by Sender</option>
        </select>
        {searchType === "sender" && (
          <input
            type="text"
            placeholder="Enter sender address"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="w-full p-2 rounded-lg border border-gray-700 bg-gray-800 text-white"
          />
        )}
        <button
          onClick={handleViewFiles}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
        >
          View
        </button>
      </div>
      {error && <p className="text-red-500 mt-2">{error}</p>}

      <div className="mt-8 w-full flex items-center justify-center">
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-4">
          {filteredFiles.length > 0 ? (
            filteredFiles.map((file, index) => (
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 120 }}
                key={index}
                onClick={() => handleFileClick(file)}
                className="p-4 bg-gray-800 hover:bg-gray-700 duration-150 rounded-lg shadow-md cursor-pointer"
              >
               
                  <div className="flex items-center justify-center h-32 bg-gray-700 rounded-md">
                    <span className="text-gray-400">No Preview <br/> (due to encrypted) </span>
                  </div>
              
                <h3 className="text-lg font-bold truncate mt-2 text-white">{file.fileName}</h3>
                <p className="text-sm text-white">File size: {(Number(file.fileSize) / 1024).toFixed(2)} KB</p>
              </motion.div>
            ))
          ) : ( 
            <p className="text-white mt-4">No files found for this address.</p>
          )}
        </div>
      </div>

      {selectedFile && (
        <ShareModal file={selectedFile} onClose={handleCloseModal} onDownload={handleDownloadFile} />
      )}
    </div>
  );
}

export default SharedDashboard;