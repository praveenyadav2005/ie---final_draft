// src/components/FileModal.jsx
import React, { useState } from "react";
import { ImCross } from "react-icons/im";

function FileModal({ file, onClose, onDownload, onDelete, onShare, onRevoke }) {
  const [isSharing, setIsSharing] = useState(false);
  const [recipientAddress, setRecipientAddress] = useState("");

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
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition w-full sm:w-auto"
          >
            Download
          </button>

          <button
            onClick={() => setIsSharing(!isSharing)}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition w-full sm:w-auto"
          >
            {isSharing ? "Cancel" : "Share/Revoke"}
          </button>

          <button
            onClick={async () => {
              await onDelete(file.cid);
              onClose();
            }}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition w-full sm:w-auto"
          >
            Delete
          </button>
        </div>

        {/* Sharing Form */}
        {isSharing && (
          <div className="mt-4 bg-gray-800 p-4 rounded-lg">
            <input
              type="text"
              placeholder="Enter recipient address"
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
              className="w-full px-3 py-2 mb-2 border border-gray-700 rounded-lg bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => {
                  onShare(file.cid, file.fileName, file.fileType,file.fileSize, recipientAddress);
                  setIsSharing(false);
                  setRecipientAddress("");
                }}
                className="w-full px-3 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-white font-semibold transition"
              >
                Confirm Share
              </button>
              <button
                onClick={async () => {
                  await onRevoke(file.cid, recipientAddress);
                  setIsSharing(false);
                  setRecipientAddress("");
                }}
                className="w-full px-3 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-white font-semibold transition"
                disabled={!recipientAddress.trim()}
              >
                Revoke Access
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default FileModal;
