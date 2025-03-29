import React, { useState, useEffect } from 'react';
import FileModal from './FileModal';
import { motion } from "framer-motion";
import { useAppContext } from '../context/AppContext';
import CryptoJS from "crypto-js";
import nacl from "tweetnacl";
import { ethers } from "ethers";
import { Buffer } from "buffer";

function FileList({ files }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const { deleteFileFromContract, shareFile, publicKey, privateKey, account,revokeAccess,  getEncryptedAESKey } = useAppContext(); // Ensure account is available
  const [searchQuery, setSearchQuery] = useState('');
  const [showProgress, setShowProgress] = useState(false);
  const ipfsGateway = 'https://gateway.pinata.cloud/ipfs/';

  useEffect(() => {
    console.log("Updated Files:", files);
    if (files.length > 0) {
      setSearchQuery(""); 
    }
  }, [files]);

  const filteredFiles = (files || []).filter((file) =>
    (file?.fileName || "").toLowerCase().includes(searchQuery.toLowerCase()) // Ensure fileName exists
  );
  console.log("Filtered Files:", filteredFiles);
  

  const handleFileClick = (file) => {
    setSelectedFile(file);
  };

  const handleCloseModal = () => {
    setSelectedFile(null);
  };

  const handleDeleteFile = (cid) => {
    deleteFileFromContract(cid);
  };

  const handleShareFile = (cid, fileName, fileType, fileSize,address) => {
    shareFile(cid, fileName, fileType,fileSize, address);
    console.log("fs"+fileSize);
  };

  const handleRevokeFile = (cid,address) =>{
    console.log("enter");
    revokeAccess(cid,address);
    console.log("exit");
  }

  const handleDownloadFile = async () => {
    if (!selectedFile) return;

    try {
      // Fetch the encrypted AES key from the contract
      const encryptedAESKeyHex = await  getEncryptedAESKey(selectedFile.cid);
      
      console.log("encryptedAESKeyHex:", encryptedAESKeyHex);

      const encryptedAESKeyBuffer = Buffer.from(encryptedAESKeyHex, "hex");

      console.log("encryptedAESKeyBuffer:", encryptedAESKeyBuffer, "Length:", encryptedAESKeyBuffer.length);

      console.log("nacl.box.nonceLength:", nacl.box.nonceLength);

      // Split into nonce and encrypted data
      const nonce = encryptedAESKeyBuffer.subarray(0, nacl.box.nonceLength);
      const encryptedData = encryptedAESKeyBuffer.subarray(nacl.box.nonceLength);

      console.log("Nonce:", nonce, "Length:", nonce.length);
      console.log("Encrypted Data:", encryptedData, "Length:", encryptedData.length);

      console.log("Public Key:", publicKey);
      const publicKeyUint8Array = new Uint8Array(Buffer.from(publicKey, "hex"));
      console.log("Public Key (Uint8Array):", publicKeyUint8Array);
      console.log("Private Key:", privateKey);

      // Decrypt the AES key using the private key
      const decryptedAESKey = nacl.box.open(
        new Uint8Array(encryptedData),
        new Uint8Array(nonce),
        publicKeyUint8Array,
        new Uint8Array(Buffer.from(privateKey, "hex")) // Ensure privateKey is in Uint8Array
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

  return (
    <div className="mt-8 w-full flex flex-col items-center justify-center">
      {/* File List */}
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
              {console.log("File Object:", file)}
              {file.fileType.startsWith('image/') ? (
                <img
                  src={`${ipfsGateway}${file.cid}`}
                  alt={file.fileName} // Use fileName for consistency
                  className="w-full h-32 object-cover rounded-md"
                />
              ) : (
                <div className="flex items-center justify-center h-32 bg-gray-700 rounded-md">
                  <span className="text-gray-400">No Preview</span>
                </div>
              )}

              <h3 className="text-lg font-bold truncate mt-2">{file.fileName}</h3>
              <p className="text-sm">File size: {(Number(file.fileSize) / 1024).toFixed(2)} KB</p>
              <p className="text-sm">Last: {new Date(Number(file.lastModified)).toLocaleString()}</p>
            </motion.div>
          ))
        ) : (
          <p className="text-gray-400">No files found.</p>
        )}
      </div>

      {/* File Modal */}
      {selectedFile && (
        <FileModal
          file={selectedFile}
          onClose={handleCloseModal}
          onDownload={handleDownloadFile}
          onDelete={handleDeleteFile}
          onShare={handleShareFile}
          onRevoke={handleRevokeFile}
        />
      )}
    </div>
  );
}

export default FileList;