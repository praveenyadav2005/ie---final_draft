import React, { useState, useEffect } from 'react';
import FileModal from './FileModal';
import { motion } from "framer-motion";
import { useAppContext } from '../context/AppContext';
import CryptoJS from "crypto-js";
import nacl from "tweetnacl";
import { ethers } from "ethers";
import { Buffer } from "buffer";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function FileList({ files }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const { deleteFileFromContract, shareFile, publicKey, privateKey, account, revokeAccess, getEncryptedAESKey, getSharedFiles } = useAppContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState({
    delete: false,
    download: false,
    share: false,
    revoke: false
  });

  // List of IPFS gateways to try
  const ipfsGateways = [
    'https://gateway.pinata.cloud/ipfs/',
    'https://ipfs.io/ipfs/',
    'https://cloudflare-ipfs.com/ipfs/',
    'https://gateway.ipfs.io/ipfs/',
    'https://ipfs.filebase.io/ipfs/'
  ];

  // Function to try different gateways
  const fetchFromIPFS = async (cid) => {
    for (const gateway of ipfsGateways) {
      try {
        const response = await fetch(`${gateway}${cid}`, {
          method: 'GET',
          mode: 'cors',
          headers: {
            'Accept': 'application/octet-stream'
          }
        });
        
        if (response.ok) {
          return response;
        }
      } catch (error) {
        console.warn(`Failed to fetch from ${gateway}:`, error);
        continue;
      }
    }
    throw new Error("Failed to fetch file from all available IPFS gateways");
  };

  useEffect(() => {
    console.log("Updated Files:", files);
    if (files.length > 0) {
      setSearchQuery(""); 
    }
  }, [files]);

  const filteredFiles = (files || []).filter((file) =>
    (file?.fileName || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFileClick = (file) => {
    setSelectedFile(file);
  };

  const handleCloseModal = () => {
    setSelectedFile(null);
  };

  const handleDeleteFile = async (cid) => {
    try {
      setLoading(prev => ({ ...prev, delete: true }));
      const result = await deleteFileFromContract(cid);
      
      if (result.success) {
        toast.success(result.message);
        setSelectedFile(null);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("An unexpected error occurred. Please try again.");
      console.error("Error in delete handler:", error);
    } finally {
      setLoading(prev => ({ ...prev, delete: false }));
    }
  };

  const handleShareFile = async (cid, fileName, fileType, fileSize, address) => {
    try {
      setLoading(prev => ({ ...prev, share: true }));
      const result = await shareFile(cid, fileName, fileType, fileSize, address);
      
      if (result.success) {
        toast.success(result.message);
        // Refresh the shared files list
        await getSharedFiles();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error(error.message || "Failed to share file. Please try again.");
      console.error("Error sharing file:", error);
    } finally {
      setLoading(prev => ({ ...prev, share: false }));
    }
  };

  const handleRevokeFile = async (cid, address) => {
    try {
      setLoading(prev => ({ ...prev, revoke: true }));
      const result = await revokeAccess(cid, address);
      
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error(error.message || "Failed to revoke access. Please try again.");
      console.error("Error revoking access:", error);
    } finally {
      setLoading(prev => ({ ...prev, revoke: false }));
    }
  };

  const handleDownloadFile = async () => {
    if (!selectedFile) return;

    try {
      setLoading(prev => ({ ...prev, download: true }));
      
      // Fetch the encrypted AES key from the contract
      const encryptedAESKeyHex = await getEncryptedAESKey(selectedFile.cid);
      
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
        new Uint8Array(Buffer.from(privateKey, "hex"))
      );
      console.log("Decrypted AES Key:", decryptedAESKey);

      if (!decryptedAESKey) {
        throw new Error("Failed to decrypt the AES key. Ensure the keys are correct.");
      }

      // Fetch the encrypted file from IPFS using multiple gateways
      const response = await fetchFromIPFS(selectedFile.cid);
      if (!response.ok) {
        throw new Error("Failed to download file from IPFS.");
      }

      const responseFileData = await response.arrayBuffer();
      const responseData = new Uint8Array(responseFileData);

      // Extract the IV and encrypted file data
      const iv = responseData.slice(0, 12);
      const encryptedFileData = responseData.slice(12);
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
      toast.success("File downloaded successfully!");
    } catch (error) {
      console.error("Error downloading file:", error);
      toast.error(error.message || "Failed to download file. Please try again.");
    } finally {
      setLoading(prev => ({ ...prev, download: false }));
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
              
                <div className="flex items-center justify-center h-32 bg-gray-700 rounded-md">
                  <span className="text-gray-400">No Preview <br/> (due to encrypted) </span>
                </div>
              

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
          loading={loading}
        />
      )}
    </div>
  );
}

export default FileList;