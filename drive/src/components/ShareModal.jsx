import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';

function ShareModal({ file, onClose, onDownload }) {
  const { shareFile } = useAppContext();
  const [address, setAddress] = useState('');

  // Generate a preview based on the file's type if a file is provided
  // let preview = null;
  // if (file) {
  //   const fileUrl = `https://ipfs.io/ipfs/${file.cid}`;
  //   const isImage = file.fileType.startsWith("image/");
  //   const isVideo = file.fileType.startsWith("video/");
  //   const isAudio = file.fileType.startsWith("audio/");
  //   const isPDF = file.fileType === "application/pdf";
  //   const isHTML = file.fileType === "text/html";
  //   const isText = file.fileType.startsWith("text/");
  //   const isWord =
  //     file.fileType === "application/msword" ||
  //     file.fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  //   const isExcel =
  //     file.fileType === "application/vnd.ms-excel" ||
  //     file.fileType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

  //   if (isImage) {
  //     preview = <img src={fileUrl} alt={file.fileName} className="w-full rounded-lg" />;
  //   } else if (isVideo) {
  //     preview = (
  //       <video controls className="w-full rounded-lg">
  //         <source src={fileUrl} type={file.fileType} />
  //         Your browser does not support the video tag.
  //       </video>
  //     );
  //   } else if (isAudio) {
  //     preview = (
  //       <audio controls className="w-full">
  //         <source src={fileUrl} type={file.fileType} />
  //         Your browser does not support the audio tag.
  //       </audio>
  //     );
  //   } else if (isPDF) {
  //     preview = (
  //       <iframe
  //         src={fileUrl}
  //         width="100%"
  //         height="500px"
  //         title="PDF preview"
  //         className="rounded-lg"
  //       ></iframe>
  //     );
  //   } else if (isText) {
  //     preview = (
  //       <iframe
  //         src={fileUrl}
  //         width="100%"
  //         height="300px"
  //         title="Text preview"
  //         className="rounded-lg"
  //       ></iframe>
  //     );
  //   } else if (isWord) {
  //     preview = (
  //       <iframe
  //         src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`}
  //         width="100%"
  //         height="500px"
  //         title="Word preview"
  //         className="rounded-lg"
  //       ></iframe>
  //     );
  //   } else if (isExcel) {
  //     preview = (
  //       <iframe
  //         src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`}
  //         width="100%"
  //         height="500px"
  //         title="Excel preview"
  //         className="rounded-lg"
  //       ></iframe>
  //     );
  //   } else if (isHTML) {
  //     preview = (
  //       <div className="w-full p-6 h-10 flex items-center justify-center">
  //         <p className="text-white">
  //           For security reasons we cannot display or download HTML files
  //         </p>
  //       </div>
  //     );
  //   } else {
  //     preview = (
  //       <div className="w-full p-6 h-40 flex items-center justify-center">
  //         <p className="text-white">
  //           Unsupported file type. Please download the file from IPFS to view it.
  //         </p>
  //       </div>
  //     );
  //   }
  // }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
    <div className="bg-gray-900 p-6 rounded-lg shadow-lg max-w-md w-full">
      {/* File Preview Placeholder */}
      {file && (
        <div className="mb-4">
          <h3 className="text-xl font-bold text-white mb-2">{file.fileName}</h3>
          <div className="w-full p-6 flex items-center justify-center">
            <p className="text-white">File is encrypted. Please download to view.</p>
          </div>
        </div>
      )}


<div className='mt-8 flex gap-6 items-center justify-center'>
        <button
          onClick={onDownload}
          className="w-full px-3 py-1.5 bg-blue-500 hover:bg-blue-600 transition-all rounded-lg shadow-lg text-lg font-semibold  hover:scale-102"
          >
          Download
        </button>
        <button
          onClick={onClose}
          className="w-full px-3 py-1.5 bg-blue-500 hover:bg-blue-600 transition-all rounded-lg shadow-lg text-lg font-semibold  hover:scale-102"
          >
          Cancel
        </button>

        </div> 
      </div>
    </div>
  );
}

export default ShareModal;
