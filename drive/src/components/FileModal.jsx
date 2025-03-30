// src/components/FileModal.jsx
import React, { useState } from "react";
import { ImCross } from "react-icons/im";
import { FaSpinner } from "react-icons/fa";
import { ethers } from "ethers";

function FileModal({ file, onClose, onDownload, onDelete, onShare, onRevoke, loading }) {
  const [isSharing, setIsSharing] = useState(false);
  const [recipientAddress, setRecipientAddress] = useState("");
  const [addressError, setAddressError] = useState("");

  const isImage = file.fileType.startsWith("image/");
  const isVideo = file.fileType.startsWith("video/");
  const isAudio = file.fileType.startsWith("audio/");
  const isPDF = file.fileType === "application/pdf";
  const isHTML = file.fileType === "text/html";
  const isText = file.fileType.startsWith("text/");
  const isWord =
    file.fileType === "application/msword" ||
    file.fileType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  const isExcel =
    file.fileType === "application/vnd.ms-excel" ||
    file.fileType ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

  const validateEthereumAddress = (address) => {
    try {
      if (!address) return false;
      // Remove whitespace and ensure proper format
      const formattedAddress = address.trim();
      if (!formattedAddress.startsWith('0x')) return false;
      if (formattedAddress.length !== 42) return false;
      // Try to convert to checksum address - this will throw if invalid
      const checksumAddress = ethers.getAddress(formattedAddress);
      return true;
    } catch (error) {
      return false;
    }
  };

  const handleAddressChange = (e) => {
    const value = e.target.value.trim();
    setRecipientAddress(value);
    
    if (value) {
      try {
        // Check if it's a valid Ethereum address
        const isValid = validateEthereumAddress(value);
        if (!isValid) {
          setAddressError("Invalid Ethereum address format");
        } else {
          // Convert to checksum address for consistency
          const checksumAddress = ethers.getAddress(value);
          setRecipientAddress(checksumAddress);
          setAddressError("");
        }
      } catch (error) {
        console.error("Address validation error:", error);
        setAddressError("Invalid Ethereum address format");
      }
    } else {
      setAddressError("");
    }
  };

  const handleShare = async () => {
    if (!recipientAddress.trim()) {
      setAddressError("Please enter a recipient address");
      return;
    }

    try {
      if (!validateEthereumAddress(recipientAddress)) {
        setAddressError("Invalid Ethereum address format");
        return;
      }

      const checksumAddress = ethers.getAddress(recipientAddress);
      await onShare(file.cid, file.fileName, file.fileType, file.fileSize, checksumAddress);
      setIsSharing(false);
      setRecipientAddress("");
      setAddressError("");
    } catch (error) {
      console.error("Share error:", error);
      setAddressError("Invalid address or sharing failed");
    }
  };

  const handleRevoke = async () => {
    if (!recipientAddress.trim()) {
      setAddressError("Please enter a recipient address");
      return;
    }

    try {
      if (!validateEthereumAddress(recipientAddress)) {
        setAddressError("Invalid Ethereum address format");
        return;
      }

      const checksumAddress = ethers.getAddress(recipientAddress);
      await onRevoke(file.cid, checksumAddress);
      setIsSharing(false);
      setRecipientAddress("");
      setAddressError("");
    } catch (error) {
      console.error("Revoke error:", error);
      setAddressError("Invalid address or revoke failed");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-gray-900 p-6 mb-4 rounded-lg shadow-lg max-w-md w-full relative">
        {/* Header */}
        <div className="flex items-center justify-between p-2 border-b border-gray-700">
          <h3 className="text-xl font-bold text-white break-words">
            {file.name}
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-200 transition"
            disabled={loading.delete || loading.download || loading.share || loading.revoke}
          >
            <ImCross size={20} />
          </button>
        </div>

        {/* Preview Section */}
        <div className="py-4">
          {(isImage || isVideo || isAudio || isPDF || isText || isWord || isExcel) && (
            <p className="text-gray-300">
              File is encrypted. Please download to view.
            </p>
          )}
          {isHTML && (
            <p className="text-gray-300">
              For security reasons, we cannot display or download HTML files.
            </p>
          )}
          {!isImage &&
            !isVideo &&
            !isAudio &&
            !isPDF &&
            !isText &&
            !isWord &&
            !isExcel &&
            !isHTML && (
              <p className="text-gray-300">
                Unsupported file type. Please download to view.
              </p>
            )}
        </div>

        {/* Main Action Buttons */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-between">
          <button
            onClick={onDownload}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition w-full sm:w-auto flex items-center justify-center"
            disabled={loading.download || loading.delete || loading.share || loading.revoke}
          >
            {loading.download ? (
              <><FaSpinner className="animate-spin mr-2" /> Downloading...</>
            ) : (
              "Download"
            )}
          </button>

          <button
            onClick={() => setIsSharing(!isSharing)}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition w-full sm:w-auto"
            disabled={loading.download || loading.delete || loading.share || loading.revoke}
          >
            {isSharing ? "Cancel" : "Share/Revoke"}
          </button>

          <button
            onClick={async () => {
              await onDelete(file.cid);
            }}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition w-full sm:w-auto flex items-center justify-center"
            disabled={loading.download || loading.delete || loading.share || loading.revoke}
          >
            {loading.delete ? (
              <><FaSpinner className="animate-spin mr-2" /> Deleting...</>
            ) : (
              "Delete"
            )}
          </button>
        </div>

        {/* Sharing Form */}
        {isSharing && (
          <div className="mt-4 bg-gray-800 p-4 rounded-lg">
            <div className="relative">
              <input
                type="text"
                placeholder="Enter recipient address (0x...)"
                value={recipientAddress}
                onChange={handleAddressChange}
                className={`w-full px-3 py-2 mb-2 border rounded-lg bg-gray-900 text-white focus:outline-none focus:ring-2 ${
                  addressError ? "border-red-500 focus:ring-red-500" : "border-gray-700 focus:ring-blue-500"
                }`}
                disabled={loading.download || loading.delete || loading.share || loading.revoke}
              />
              {addressError && (
                <p className="text-red-500 text-sm mb-2">{addressError}</p>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleShare}
                className="w-full px-3 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-white font-semibold transition flex items-center justify-center"
                disabled={!recipientAddress.trim() || loading.download || loading.delete || loading.share || loading.revoke || !!addressError}
              >
                {loading.share ? (
                  <><FaSpinner className="animate-spin mr-2" /> Sharing...</>
                ) : (
                  "Confirm Share"
                )}
              </button>
              <button
                onClick={handleRevoke}
                className="w-full px-3 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-white font-semibold transition flex items-center justify-center"
                disabled={!recipientAddress.trim() || loading.download || loading.delete || loading.share || loading.revoke || !!addressError}
              >
                {loading.revoke ? (
                  <><FaSpinner className="animate-spin mr-2" /> Revoking...</>
                ) : (
                  "Revoke Access"
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default FileModal;
