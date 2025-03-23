import React, { useState, useEffect } from "react";
import Web3 from "web3";
import axios from "axios";
import FormData from "form-data";
import { contractABI, contractAddress } from "./contractConfig";

const pinataApiKey = 'd62c68cfefcdd0356573';
const pinataSecretApiKey = '584f860836be1a68cab4427a1cc64fe0c6a4c8e7ec9991fa3de86dec92d86bdb';

const App = () => {
  const [file, setFiles] = useState(null);
  const [cids, setCids] = useState([]); 
  const [retrievedData, setRetrievedData] = useState(null);
  const [loading, setLoading] = useState(false);

  const web3 = new Web3(provider);
  const contract = new web3.eth.Contract(contractABI, contractAddress);

  
  const uploadFiles = async () => {
    if (!files || files.length === 0) {
      alert("Please select files first!");
      return;
    }
  
    setLoading(true);
  
    try {
      for (let i = 0; i < files.length; i++) {
        const data = new FormData();
        data.append("file", files[i]);
  
        const response = await axios.post(
          "https://api.pinata.cloud/pinning/pinFileToIPFS",
          data,
          {
            headers: {
              pinata_api_key: pinataApiKey,
              pinata_secret_api_key: pinataSecretApiKey,
            },
          }
        );
  
        const fileCID = response.data.IpfsHash;
        console.log("File uploaded to IPFS. CID:", fileCID);
  
        const accounts = await web3.eth.getAccounts();
        await contract.methods.addFile(fileCID).send({ from: accounts[0] });
  
        alert(`File uploaded! CID: ${fileCID}`);
      }
  
      setLoading(false);
      setFiles([]);  
    } catch (error) {
      console.error("Error uploading files:", error);
      setLoading(false);
    }
  };
  

  const retrieveAllFiles = async () => {
    setLoading(true);
    try {
      const retrievedCIDs = await contract.methods.getFileCID().call();
      setCids(retrievedCIDs);
      console.log("Retrieved CIDs:", retrievedCIDs);
    } catch (error) {
      console.error("Error retrieving CIDs:", error);
    }
    setLoading(false);
  };

  // Retrieve Specific File from IPFS
  const retrieveFile = async (cid) => {
    setLoading(true);
    try {
      const response = await axios.get(`https://gateway.pinata.cloud/ipfs/${cid}`);
      const contentType = response.headers["content-type"];

      if (contentType.includes("pdf")) {
        setRetrievedData({ cid, content: response.data, type: "pdf" });
      } else if (contentType.includes("msword") || contentType.includes("vnd.openxmlformats-officedocument.wordprocessingml.document")) {
        setRetrievedData({ cid, content: response.data, type: "docx" });
      } else if (contentType.includes("plain")) {
        setRetrievedData({ cid, content: response.data, type: "text" });
      } else {
        setRetrievedData({ cid, content: response.data, type: "unknown" });
      }

      console.log("Retrieved File Content:", response.data);
    } catch (error) {
      console.error("Error retrieving file:", error);
    }
    setLoading(false);
  };

  return (
    <div>
      <h1>Decentralized File Storage</h1>

      {/* File Upload */}
      <input type="file"  multiple onChange={(e)=> setFile(e.target.files)} />
      <button onClick={uploadFile} disabled={loading}>
        {loading ? "Uploading..." : "Upload File"}
      </button>

      {/* Retrieve Files */}
      <button onClick={retrieveAllFiles} disabled={loading}>
        {loading ? "Retrieving..." : "Retrieve Files"}
      </button>

      {/* Display File List */}
      <div>
        <h2>Stored Files:</h2>
        {cids.length > 0 ? (
          <ul>
            {cids.map((cid, index) => (
              <li key={index} onClick={() => retrieveFile(cid)} style={{ cursor: "pointer", color: "blue" }}>
                📄 File {index + 1} - {cid.substring(0, 10)}...
              </li>
            ))}
          </ul>
        ) : (
          <p>No files stored yet.</p>
        )}
      </div>

      {/* Display Retrieved File */}
      {retrievedData && (
        <div>
          <h2>Retrieved File:</h2>
          <p><strong>CID:</strong> {retrievedData.cid}</p>

          {/* Render PDF */}
          {retrievedData.type === "pdf" && (
            <iframe
              src={`https://gateway.pinata.cloud/ipfs/${retrievedData.cid}`}
              width="600"
              height="400"
              title="PDF Viewer"
            />
          )}

          {/* Render DOCX (if possible, you could use a library like 'mammoth' to convert DOCX to HTML) */}
          {retrievedData.type === "docx" && (
            <a
              href={`https://gateway.pinata.cloud/ipfs/${retrievedData.cid}`}
              download
            >
              Download DOCX File
            </a>
          )}

          {/* Render Text Files */}
          {retrievedData.type === "text" && (
            <pre>{retrievedData.content}</pre>
          )}

          {/* Handle Unknown or Unsupported File Types */}
          {retrievedData.type === "unknown" && (
            <p>Unsupported file type: Unable to display the content.</p>
          )}
        </div>
      )}
    </div>
  );
};
export default App;
