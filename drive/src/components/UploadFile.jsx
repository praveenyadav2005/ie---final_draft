import React, { useState } from "react";
import { useAppContext } from "../context/AppContext";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function UploadFile() {
  const { uploadFile } = useAppContext();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [file, setFile] = useState(null);
  const [showProgress, setShowProgress] = useState(false);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    setFile(selectedFile);
  };

  const fileUpload = async () => {
    if (file) {
      setShowProgress(true);

      const result = await uploadFile(file, (progress) => {
        setUploadProgress(progress);
      });

      if (result.success) {
        toast.success("Upload Successful!", { position: "top-right", autoClose: 3000 });
      } else {
        toast.error("Upload Failed!", { position: "top-right", autoClose: 3000 });
      }

      setShowProgress(false);
      setUploadProgress(0);
      setFile(null);
    }
  };

  return (
    <div className="mt-8 w-full flex flex-col gap-5 p-2">
      <div className="p-2">
        <h2 className="text-xl font-semibold text-gray-100">Upload New File</h2>
        <label
          htmlFor="file-upload"
          className="mt-4 inline-block w-40 cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-medium p-1.5 rounded-lg text-center shadow-lg text-lg hover:scale-102 transition-all"
        >
          Choose File
        </label>
        <input id="file-upload" type="file" className="hidden" onChange={handleFileChange} />
      </div>

      {file && (
        <div className="w-full flex flex-col gap-1 text-md p-2">
          <p className="break-words">File Name: {file?.name}</p>
          <p>File Size: {(file?.size / 1024).toFixed(2)} KB</p>
          <button
            onClick={fileUpload}
            className="mt-2 inline-block w-40 cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-medium p-1.5 rounded-lg text-center shadow-lg text-lg hover:scale-102 transition-all"
          >
            Upload File
          </button>
          {showProgress && (
            <div className="w-full bg-gray-300 rounded-full mt-4 h-3 relative overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-blue-700 h-full rounded-full transition-all ease-in-out duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default UploadFile;

