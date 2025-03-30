import React, { useState } from "react";
import { useAppContext } from "../context/AppContext";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaSpinner } from "react-icons/fa";

function UploadFile() {
  const { uploadFile } = useAppContext();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [file, setFile] = useState(null);
  const [showProgress, setShowProgress] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    setFile(selectedFile);
  };

  const fileUpload = async () => {
    if (file) {
      setShowProgress(true);
      setIsUploading(true);

      try {
        const result = await uploadFile(file, (progress) => {
          setUploadProgress(progress);
        });

        if (result.success) {
          toast.success("File uploaded successfully!");
          document.getElementById("file-upload").value = "";
        } else {
          toast.error(result.message || "Upload failed. Please try again.");
        }
      } catch (error) {
        toast.error(error.message || "An error occurred during upload.");
        console.error("Upload error:", error);
      } finally {
        setShowProgress(false);
        setUploadProgress(0);
        setFile(null);
        setIsUploading(false);
      }
    } else {
      toast.warning("Please select a file first!");
    }
  };

  return (
    <div className="mt-8 w-full flex flex-col gap-5 p-2">
      <div className="p-2">
        <h2 className="text-xl font-semibold text-gray-100">Upload New File</h2>
        <label
          htmlFor="file-upload"
          className={`mt-4 inline-block w-40 cursor-pointer ${
            isUploading ? "bg-gray-600" : "bg-blue-600 hover:bg-blue-700"
          } text-white font-medium p-1.5 rounded-lg text-center shadow-lg text-lg transition-all`}
          disabled={isUploading}
        >
          {isUploading ? "Uploading..." : "Choose File"}
        </label>
        <input 
          id="file-upload" 
          type="file" 
          className="hidden" 
          onChange={handleFileChange} 
          disabled={isUploading}
        />
      </div>

      {file && (
        <div className="w-full flex flex-col gap-1 text-md p-2">
          <p className="break-words">File Name: {file?.name}</p>
          <p>File Size: {(file?.size / 1024).toFixed(2)} KB</p>
          <button
            onClick={fileUpload}
            disabled={isUploading}
            className={`mt-2 inline-flex items-center justify-center w-40 cursor-pointer ${
              isUploading ? "bg-gray-600" : "bg-blue-600 hover:bg-blue-700"
            } text-white font-medium p-1.5 rounded-lg text-center shadow-lg text-lg transition-all`}
          >
            {isUploading ? (
              <>
                <FaSpinner className="animate-spin mr-2" />
                Uploading...
              </>
            ) : (
              "Upload File"
            )}
          </button>
          {showProgress && (
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-1">
                <span>Upload Progress</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3 relative overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-blue-700 h-full rounded-full transition-all ease-in-out duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default UploadFile;

