import React, { useState } from "react";
import { ImCross } from "react-icons/im";

function FileModal({ file, onClose, onDownload, onDelete, onShare }) {
  const [isSharing, setIsSharing] = useState(false);
  const [recipientAddress, setRecipientAddress] = useState("");

  const isImage = file.fileType.startsWith("image/");
  const isVideo = file.fileType.startsWith("video/");
  const isAudio = file.fileType.startsWith("audio/");
  const isPDF = file.fileType === "application/pdf";
  const isHTML = file.fileType === "text/html";
  const isText = file.fileType.startsWith("text/");
  const isWord = file.fileType === "application/msword" || 
                 file.fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  const isExcel = file.fileType === "application/vnd.ms-excel" || 
                  file.fileType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

  const fileUrl = `https://ipfs.io/ipfs/${file.cid}`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-gray-900 p-6 mb-4 rounded-lg shadow-lg max-w-md w-full">
        <div className="max-w-full flex items-center justify-between p-2">
          <h3 className="text-2xl text-wrap font-bold break-words">{file.name}</h3>
          <button onClick={onClose} className="p-2 text-red-500 hover:text-red-700">
            <ImCross size={24} />  
          </button>
        </div>

        {/* File Preview */}
        {isImage && (
          <div className="w-full p-6 flex items-center justify-center">
            <p>File is encrypted. Please download to view.</p>
          </div>
        )}
        {isVideo && (
          <div className="w-full p-6 flex items-center justify-center">
            <p>File is encrypted. Please download to view.</p>
          </div>
        )}
        {isAudio && (
          <div className="w-full p-6 flex items-center justify-center">
            <p>File is encrypted. Please download to view.</p>
          </div>
        )}
        {isPDF && (
          <div className="w-full p-6 flex items-center justify-center">
            <p>File is encrypted. Please download to view.</p>
          </div>
        )}
        {isText && (
          <div className="w-full p-6 flex items-center justify-center">
            <p>File is encrypted. Please download to view.</p>
          </div>
        )}
        {isWord && (
          <div className="w-full p-6 flex items-center justify-center">
            <p>File is encrypted. Please download to view.</p>
          </div>
        )}
        {isExcel && (
          <div className="w-full p-6 flex items-center justify-center">
            <p>File is encrypted. Please download to view.</p>
          </div>
        )}
        {isHTML && (
          <div className="w-full p-6 flex items-center justify-center">
            <p>For security reasons, we cannot display or download HTML files.</p>
          </div>
        )}
        {!isImage && !isVideo && !isAudio && !isPDF && !isText && !isWord && !isExcel && !isHTML && (
          <div className="w-full p-6 flex items-center justify-center">
            <p>Unsupported file type. Please download the file from IPFS to view it.</p>
          </div>
        )}

        {/* Buttons */}
        <div className="mt-8 flex gap-6 items-center justify-center">
          <button
            onClick={onDownload} 
            className="w-full px-3 py-1.5 bg-blue-500 hover:bg-blue-600 transition-all rounded-lg shadow-lg text-lg font-semibold hover:scale-102"
          >
            Download
          </button>
          <button
            onClick={() => setIsSharing(!isSharing)}
            className="w-full px-3 py-1.5 bg-blue-500 hover:bg-blue-600 transition-all rounded-lg shadow-lg text-lg font-semibold hover:scale-102"
          >
            {isSharing ? "Cancel" : "Share"}
          </button>
          {isSharing && (
            <div className="mt-2">
              <input
                type="text"
                placeholder="Enter recipient address"
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                className="w-full px-3 py-1.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => {
                  onShare(file.cid, file.fileName, file.fileType, recipientAddress);
                  setIsSharing(false);
                  setRecipientAddress("");
                }}
                className="w-full px-3 py-1.5 bg-blue-500 hover:bg-blue-600 transition-all rounded-lg shadow-lg text-lg font-semibold hover:scale-102 mt-2"
              >
                Confirm Share
              </button>
            </div>
          )}
          <button
            onClick={async () => {
              await onDelete(file.cid);
              onClose();
            }}
            className="w-full px-3 py-1.5 bg-blue-500 hover:bg-blue-600 transition-all rounded-lg shadow-lg text-lg font-semibold hover:scale-102"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default FileModal;