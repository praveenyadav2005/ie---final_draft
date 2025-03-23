// src/components/SharedDashboard.jsx
import React, { useState } from "react";
import { motion } from "framer-motion";
import { useAppContext } from "../context/AppContext";
import { ImCross } from "react-icons/im";
import ShareModal from "./ShareModal";
import { Buffer } from "buffer";
import nacl from "tweetnacl";
import CryptoJS from "crypto-js";

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
      const encryptedAESKeyHex = await  getEncryptedPasskey(selectedFile.cid, selectedFile.sharedBy);
      
      console.log("encryptedAESKeyHex:", encryptedAESKeyHex);

      const cleanHex = encryptedAESKeyHex.startsWith("0x") 
    ? encryptedAESKeyHex.slice(2) 
    : encryptedAESKeyHex;


      const encryptedAESKeyBuffer = Buffer.from(cleanHex, "hex");

      console.log("encryptedAESKeyBuffer:", encryptedAESKeyBuffer, "Length:", encryptedAESKeyBuffer.length);

      console.log("nacl.box.nonceLength:", nacl.box.nonceLength);

      // Split into nonce and encrypted data
      const nonce = encryptedAESKeyBuffer.subarray(0, nacl.box.nonceLength);
      const encryptedData = encryptedAESKeyBuffer.subarray(nacl.box.nonceLength);

      console.log("Nonce:", nonce, "Length:", nonce.length);
      console.log("Encrypted Data:", encryptedData, "Length:", encryptedData.length);

      const senderPublicKey = await fetchPublicKey(selectedFile.sharedBy);
      console.log("Public Key:", senderPublicKey);
      const senderPublicKeyUint8Array = new Uint8Array(Buffer.from(senderPublicKey, "hex"));
      console.log("Public Key (Uint8Array):", senderPublicKeyUint8Array);
      console.log("Private Key:", privateKey);

      // Decrypt the AES key using the private key
      const decryptedAESKey = nacl.box.open(
        new Uint8Array(encryptedData),
        new Uint8Array(nonce),
        senderPublicKeyUint8Array,  // sender's public key
        new Uint8Array(Buffer.from(privateKey, "hex"))  // your private key
      );
      console.log("Decrypted AES Key:", decryptedAESKey);

      if (!decryptedAESKey) {
        throw new Error("Failed to decrypt the AES key. Ensure the keys are correct.");
      }

      // Fetch the encrypted file from IPFS
      const fileUrl = `${ipfsGateway}${selectedFile.cid}`;
      const response = await fetch(fileUrl);
      if (!response.ok) throw new Error("Failed to download file from IPFS.");

      console.log("response", response); // Corrected logging

      const responseFileData = await response.arrayBuffer();
      const responseData = new Uint8Array(responseFileData); // Convert to Uint8Array

      // Extract the IV and encrypted file data
      const iv = responseData.slice(0, 12); // First 12 bytes are the IV
      const encryptedFileData = responseData.slice(12); // Remaining bytes are the encrypted file
      console.log("IV:", iv, "Length:", iv.length);

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
    )
      // Create a Blob from the decrypted file
      const blob = new Blob([decryptedFile], { type: selectedFile.fileType || "application/octet-stream" }); // Use selectedFile.fileType
      const blobUrl = URL.createObjectURL(blob);

      // Create and trigger download link
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = selectedFile.fileName || "download"; // Ensure a fallback name
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);

      setSelectedFile(null);
      alert("File downloaded successfully!");
    } catch (error) {
      console.error("Error downloading file:", error);
      alert(`Failed to download file: ${error.message}`);
    }
  };

  const handleViewFiles = async () => {
    try {
      // If there are no existing shared files, fetch them first
      if (!sharedFiles || sharedFiles.length === 0) {
        await getSharedFiles();
        // If still no files after fetching
        if (!sharedFiles || sharedFiles.length === 0) {
          setError("No shared files available.");
          return;
        }
      }
      
      if (searchType === "All") {
        // For "All" type, you might want to refresh the files anyway
        await getSharedFiles();
        console.log(sharedFiles);
        setFilteredFiles(sharedFiles);
        return;
      }
      
      if (searchType === "name") {
        const result = sharedFiles.filter((file) =>
          file.name.toLowerCase().includes(inputValue.toLowerCase())
        );
        setFilteredFiles(result);
      } else {
        const result = await getSharedFilesBySender(inputValue);
        setFilteredFiles(result);
      }
    } catch (error) {
      setError("Error fetching or filtering files: " + error.message);
    }
  };

  const handleClearSearch = () => {
    setInputValue("");
    setFilteredFiles(sharedFiles);
    setError("");
  };

  return (
    <div className="p-4 bg-gray-900 rounded-lg mt-4">
      <h2 className="text-2xl font-bold text-white mb-4">View Shared Files</h2>
      <div className="flex gap-2 mb-4">
        <select
          value={searchType}
          onChange={(e) => setSearchType(e.target.value)}
          className="p-2 rounded-lg border border-gray-700 bg-gray-800 text-white"
        >
          <option value="name">Search by Name</option>
          <option value="sender">Search by Sender</option>
          <option value="All">All files</option>
        </select>
        <input
          type="text"
          placeholder={searchType === "name" ? "Enter file name" : "Enter sender address"}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="w-full p-2 rounded-lg border border-gray-700 bg-gray-800 text-white"
        />
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
                {file.fileType.startsWith("image/") ? (
                  <img
                    src={`${ipfsGateway}${file.cid}`}
                    alt={file.name}
                    className="w-full h-32 object-cover rounded-md"
                  />
                ) : (
                  <div className="flex items-center justify-center h-32 bg-gray-700 rounded-md">
                    <span className="text-gray-400">No Preview</span>
                  </div>
                )}
                <h3 className="text-lg font-bold truncate mt-2 text-white">{file.name}</h3>
                <p className="text-sm text-white">File size: {(Number(file.size) / 1024).toFixed(2)} KB</p>
                <p className="text-sm text-white">Last: {new Date(Number(file.lastModified)).toLocaleString()}</p>
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