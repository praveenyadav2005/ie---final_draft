 import React, { createContext, useState, useContext, useEffect, useCallback } from "react";
import axios from "axios";
import Web3 from "web3";
import { SiweMessage } from "siwe";
import data from "../contract.json";
import nacl from "tweetnacl";
import { ethers } from "ethers";
import CryptoJS from "crypto-js";
import { Buffer } from "buffer";

const AppContext = createContext();

export const AppProvider = ({ children, navigate }) => {
  const [account, setAccount] = useState(null);
  const [walletConnected, setWalletConnected] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [sharedFiles, setSharedFiles] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [senders, setSenders] = useState([]);
  const [publicKey, setPublicKey] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [hasFiles, setHasFiles] = useState(false); // Track if the account has files

  const web3 = new Web3(window.ethereum);
  const contract = new web3.eth.Contract(data.abi, data.address);

  // Fetch accounts and set the default account
  const getAccounts = async () => {
    try {
      const accs = await web3.eth.getAccounts();
      console.log("Retrieved accounts:", accs);
      setAccounts(accs);
      setAccount(accs[0]);
    } catch (error) {
      alert(error);
    }
  };

  // Handle account change
  const handleAccountChange = async (event) => {
    try {
      const selectedAddress = event.target.value;
      console.log("Switching account to:", selectedAddress);
      setAccount(selectedAddress);
  
      // Reset state for the new account
      setPrivateKey("");
      setPublicKey("");
      setUploadedFiles([]);
      setSharedFiles([]);
      setHasFiles(false);
  
      // Redirect to the passphrase entry page
      navigate("/passphrase-entry");
    } catch (error) {
      console.error("Failed to switch account:", error);
    }
  };

  const getEncryptedAESKey = async (cid) => {
    try {
      const encryptedAESKeyHex = await contract.methods
        .getEncryptedAESKey(cid)
        .call({ from: account });

      return encryptedAESKeyHex;
    } catch (error) {
      console.error("Failed to fetch encrypted AES key:", error);
      throw error; 
    }
  };

  const getEncryptedPasskey = async (cid, sender) => {
    try {
      const encryptedPasskeyHex = await contract.methods.getEncryptedPasskey(cid, sender).call({from: account});
      return encryptedPasskeyHex;
      } catch (error) {
        console.error("Failed to fetch encrypted passkey:", error);
        throw error;
      }
    };

  const generateKeyPair = () => {
    const keyPair = nacl.box.keyPair();
    return {
        publicKey: Buffer.from(keyPair.publicKey).toString("hex"),
        privateKey: keyPair.secretKey,
    };
};

const encryptPrivateKey = (privateKey, passphrase) => {
  return CryptoJS.AES.encrypt(Buffer.from(privateKey).toString("hex"), passphrase).toString();
};

// Decrypt private key with passphrase
const decryptPrivateKey = (encryptedPrivateKey, passphrase) => {
  try {
      const bytes = CryptoJS.AES.decrypt(encryptedPrivateKey, passphrase);
      const decryptedHex = bytes.toString(CryptoJS.enc.Utf8);
      if (!decryptedHex) {
          throw new Error("Incorrect passphrase");
      }
      return Buffer.from(decryptedHex, "hex");
  } catch (error) {
      console.error("Decryption failed:", error);
      throw new Error("Failed to decrypt private key. Check your passphrase.");
  }
};

// Store encrypted private key in localStorage
const storeEncryptedPrivateKey = (account, encryptedPrivateKey) => {
  localStorage.setItem(`encryptedPrivateKey_${account.toLowerCase()}`, encryptedPrivateKey);
};

// Retrieve encrypted private key from localStorage
const retrieveEncryptedPrivateKey = (account) => {
  return localStorage.getItem(`encryptedPrivateKey_${account.toLowerCase()}`);
};

// Authenticate user with SIWE
// const authenticateWithSIWE = async () => {
//     try {
//         if (typeof window.ethereum === "undefined") {
//             throw new Error("MetaMask is not installed");
//         }

//         const web3 = new Web3(window.ethereum);
//         await window.ethereum.request({ method: "eth_requestAccounts" });

//         const userAddress = (await web3.eth.getAccounts())[0];
//         const chainId = await web3.eth.getChainId();

//         // Generate nonce
//         const nonceArray = new Uint8Array(16);
//         window.crypto.getRandomValues(nonceArray);
//         const nonce = Array.from(nonceArray, (byte) => byte.toString(16).padStart(2, "0")).join("");

//         // Create SIWE message
//         const message = new SiweMessage({
//             domain: window.location.host,
//             address: userAddress,
//             statement: "Sign in to our decentralized storage",
//             uri: window.location.origin,
//             version: "1",
//             chainId: chainId,
//             nonce: nonce,
//             issuedAt: new Date().toISOString(),
//         });

//         const messageToSign = message.prepareMessage();
//         const signature = await web3.eth.personal.sign(messageToSign, userAddress);

//         // Verify the SIWE message
//         const recoveredAddress = await web3.eth.personal.ecRecover(messageToSign, signature);
//         if (recoveredAddress.toLowerCase() !== userAddress.toLowerCase()) {
//             throw new Error("Signature verification failed");
//         }

//         console.log("✅ SIWE verification successful!");
//         return userAddress;
//     } catch (error) {
//         console.error("❌ SIWE authentication failed:", error);
//         throw error;
//     }
// };


  // Connect wallet
  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        alert("MetaMask not found! Please install MetaMask.");
        return;
      }
      
      await window.ethereum.request({ method: "eth_requestAccounts" });
      setWalletConnected(true);
      
      await getAccounts();
      alert("Wallet connected successfully! Please enter your passphrase.");
      
      // Return a value indicating success, let components handle navigation
      return true;
    } catch (error) {
      console.error("Error connecting wallet:", error);
      alert("Failed to connect wallet.");
      return false;
    }
  };
  
  const handlePrivateKey = (address) => {
    return true; 
  };


  const disconnectWallet = () => {
    setWalletConnected(false);
    setAccount(null);
    sessionStorage.clear();
  };

  // Fetch uploaded files for the current account
  const getFileCids = async (acc) => {
    try {
      const files = await contract.methods.getFiles(acc).call({ from: acc });
      setUploadedFiles(files);
      setHasFiles(files.length > 0); // Update hasFiles state
    } catch (error) {
      console.error("Error fetching files:", error);
    }
  };

  // Fetch shared files for the current account
  const getSharedFiles = async () => {
    try {
      const files = await contract.methods.getSharedFiles().call({ from: account });
      console.log("shared files", files);
      setSharedFiles(files);
    } catch (error) {
      console.error("Error fetching shared files:", error);
    }
  };

  // Fetch shared files by a specific sender
  const getSharedFilesBySender = async (sender) => {
    try {
      const files = await contract.methods.getSharedFilesBySender(sender).call({ from: account });
      return files;
    } catch (error) {
      console.error("Error fetching shared files by sender:", error);
    }
  };

  // Fetch all senders who have shared files with the current account
  const getAllSenders = async () => {
    try {
      const senders = await contract.methods.getAllSenders().call({ from: account });
      setSenders(senders);
    } catch (error) {
      console.error("Error fetching senders:", error);
    }
  };

  // Set the user's public key in the contract
  const setUserPublicKey = async (publicKey) => {
    try {
        await contract.methods.setPublicKey(publicKey).send({ from: account });
        setPublicKey(publicKey);
        console.log("Public key registered:", publicKey);
        alert("Public key successfully registered!");
    } catch (error) {
        console.error("Error registering public key:", error);
    }
};

  // Get the user's public key from the contract
  const fetchPublicKey = async (address) => {
    try {
      const key = await contract.methods.getPublicKey(address).call({ from: account });
      return key;
    } catch (error) {
      console.error("Error fetching public key:", error);
    }
  };

  // Delete a file from the contract
  const deleteFileFromContract = async (cid) => {
    try {
      await contract.methods.deleteFile(cid).send({ from: account });
      getFileCids(account);
    } catch (error) {
      console.error("Error deleting file:", error);
    }
  };

  // Decrypt and store AES keys in sessionStorage
  // const decryptAndStoreAESkeys = async () => {
  //   try {
  //     console.log("Current MetaMask Account:", account);
  //     const cids = await contract.methods.getUserCids(account).call({ from: account });
  //     console.log("Fetched Cids", cids);
  
  //     for (const cid of cids) {
  //       if (!sessionStorage.getItem(cid)) {
  //         const encryptedAESKey = await contract.methods.getEncryptedAESKey(cid).call({ from: account });
  //         console.log("Encrypted AES Key:", encryptedAESKey); // Debugging line
  
  //         try {
  //           const decryptedAESKey = await window.ethereum.request({
  //             method: "eth_decrypt",
  //             params: [encryptedAESKey, account],
  //           });
  
  //           console.log("Decrypted AES Key:", decryptedAESKey); // Debugging line
  //           sessionStorage.setItem(cid, decryptedAESKey);
  //         } catch (decryptError) {
  //           console.error("Error decrypting AES key:", decryptError);
  //           alert("Failed to decrypt the AES key. Please try again.");
  //         }
  //       }
  //     }
  //   } catch (error) {
  //     console.error("Error decrypting and storing AES keys:", error);
  //     alert("Failed to decrypt and store AES keys.");
  //   }
  // };

  // Upload a file
  const uploadFile = async (file, onUploadProgress) => {
    if (!file) {
        alert("Please select a file first!");
        return { success: false };
    }

    if (!walletConnected || !account || !privateKey) {
        alert("Please connect your wallet first!");
        return { success: false };
    }

    try {
        // Generate a random AES key for file encryption
        const aesKey = window.crypto.getRandomValues(new Uint8Array(32));
        console.log("aesKey", aesKey);
        
        // Encrypt the file using AES-GCM
        const fileData = await file.arrayBuffer();
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        
        const aesKeyImport = await window.crypto.subtle.importKey(
            "raw", 
            aesKey,
            { name: "AES-GCM" },
            false,
            ["encrypt"]
        );
        
        const encryptedFile = await window.crypto.subtle.encrypt(
            { name: "AES-GCM", iv },
            aesKeyImport,
            fileData
        );
        console.log("encryptedFile", encryptedFile, "Length:", encryptedFile.length);

        // Create a combined buffer with IV and encrypted data for easier handling
        const combinedBuffer = new Uint8Array(iv.length + encryptedFile.byteLength);
        combinedBuffer.set(iv, 0);
        combinedBuffer.set(new Uint8Array(encryptedFile), iv.length);

        // Encrypt the AES key using the user's own public key
        const nonce = window.crypto.getRandomValues(new Uint8Array(nacl.box.nonceLength));

        console.log("nonce", nonce, "Length:", nonce.length);

        
        // Convert public key from hex string to Uint8Array
        const publicKeyBytes = new Uint8Array(Buffer.from(publicKey, "hex"));
        console.log("publicKeyBytes", publicKeyBytes, "Length:", publicKeyBytes.length);
        console.log("privateKey", privateKey, "Length:", privateKey.length);
        
        // Encrypt AES key with nacl box
        const encryptedAESKey = nacl.box(
            aesKey, // Use the AES key directly (Uint8Array)
            nonce,
            publicKeyBytes,
            privateKey // This should already be a Uint8Array
        );
       
        console.log("encryptedAESKey", encryptedAESKey, "Length:", encryptedAESKey.length);
        // Combine nonce and encrypted key
        const combinedEncryptedKey = new Uint8Array(nonce.length + encryptedAESKey.length);
        combinedEncryptedKey.set(nonce, 0);
        combinedEncryptedKey.set(encryptedAESKey, nonce.length);

        console.log("combined EncryptedKey", combinedEncryptedKey, "Length:", combinedEncryptedKey.length);
        
        // Upload the encrypted file to IPFS via Pinata
        const formData = new FormData();
        const encryptedFileBlob = new Blob([combinedBuffer], { type: "application/octet-stream" });
        formData.append("file", encryptedFileBlob, file.name);

        const metadata = JSON.stringify({
            name: file.name,
            keyvalues: { 
                type: file.type,
                owner: account,
                encrypted: "true" 
            },
        });
        formData.append("pinataMetadata", metadata);

        const response = await axios.post(
            "https://api.pinata.cloud/pinning/pinFileToIPFS",
            formData,
            {
                headers: {
                    Authorization: `Bearer ${import.meta.env.VITE_PINATA_JWT}`,
                    "Content-Type": "multipart/form-data",
                },
                onUploadProgress: (progressEvent) => {
                    const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    if (onUploadProgress) onUploadProgress(progress);
                },
            }
        );

        if (response.data && response.data.IpfsHash) {
            const fileCID = response.data.IpfsHash;

            // Store file metadata and encrypted AES key in the smart contract
            await contract.methods
                .addFile(
                    fileCID, 
                    file.name, 
                    file.type, 
                    Buffer.from(combinedEncryptedKey).toString("hex")
                )
                .send({ 
                    from: account,
                });

            getFileCids(account);
            console.log("Uploaded files after upload:", uploadedFiles);

            alert("File uploaded successfully!");
            return { success: true, cid: fileCID };
        } else {
            throw new Error("Failed to upload to IPFS");
        }
    } catch (error) {
        console.error("Error uploading file:", error);
        alert(error.message || "Failed to upload file.");
        return { success: false };
    } 
};
  

  // Share a file with another user
  const shareFile = async (cid, fileName, fileType, recipientAddress) => {
    if (!cid || !fileName || !fileType || !recipientAddress) {
      alert("Invalid input!");
      return;
    }
     try{
      const recipientPublicKey = await fetchPublicKey(recipientAddress);
      if (!recipientPublicKey) {
        alert("Recipient's public key not found. Ask them to set it first.");
        return;
      }

      const encryptedAESKeyHex = await contract.methods.getEncryptedAESKey(cid).call({ from: account });
      const encryptedAESKeyBuffer = Buffer.from(encryptedAESKeyHex, "hex");

      const nonce = encryptedAESKeyBuffer.slice(0, nacl.box.nonceLength);
      const encryptedData = encryptedAESKeyBuffer.slice(nacl.box.nonceLength);
      
      // Decrypt the AES key using our private key
      const decryptedAESKey = nacl.box.open(
          new Uint8Array(encryptedData),
          new Uint8Array(nonce),
          new Uint8Array(Buffer.from(publicKey, "hex")),
          privateKey
      );
      
      if (!decryptedAESKey) {
          throw new Error("Failed to decrypt the AES key");
      }
      
      const shareNonce = window.crypto.getRandomValues(new Uint8Array(nacl.box.nonceLength));
      
      const recipientPublicKeyBytes = new Uint8Array(Buffer.from(recipientPublicKey.replace("0x", ""), "hex"));
      
      const reEncryptedAESKey = nacl.box(
          decryptedAESKey,
          shareNonce,
          recipientPublicKeyBytes,
          privateKey
      );
      
      // Combine nonce and re-encrypted key
      const combinedReEncryptedKey = new Uint8Array(shareNonce.length + reEncryptedAESKey.length);
      combinedReEncryptedKey.set(shareNonce, 0);
      combinedReEncryptedKey.set(reEncryptedAESKey, shareNonce.length);

      await contract.methods.shareFile(
                    cid, 
                    fileName, 
                    fileType, 
                    recipientAddress, 
                    "0x" + Buffer.from(combinedReEncryptedKey).toString("hex")
                ) .send({ 
                    from: account,
                });
      alert("File shared successfully!"); 
      return { success: true };
      } catch (error) {
        alert("Error sharing file: " + error.message);
        return { success: false };
  }
};

  // Revoke access to a shared file
  const revokeAccess = async (cid, recipient) => {
    console.log("in App");
    try {
      await contract.methods.revokeAccess(cid, recipient).send({ from: account });
      alert("Access revoked successfully!");
      getSharedFiles();
    } catch (error) {
      console.error("Error revoking access:", error);
      alert("Failed to revoke access.");
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    if (window.ethereum) {
      getAccounts();
    }
  }, []);

  useEffect(() => {
    if (walletConnected && account) {
      getFileCids(account);
    }
  }, [walletConnected, account]);

  const fetchFileCids = useCallback(async () => {
    await getFileCids(account);
    setHasFiles(uploadedFiles.length > 0);
}, [account]); 

useEffect(() => {
  if (window.ethereum) {
    const handleAccountsChanged = async (newAccounts) => {
      if (newAccounts.length === 0) {
        console.log("No accounts connected.");
        setAccount(null);
        setWalletConnected(false);
      } else {
        const selectedAccount = newAccounts[0]; 
        console.log("Account changed to:", selectedAccount);
        setAccount(selectedAccount);
        navigate("/passphrase-entry");

        // Fetch file CIDs for the new account
        try {
          await fetchFileCids();
        } catch (error) {
          console.error("Error fetching file CIDs:", error);
        }
      }
    };
    window.ethereum.on("accountsChanged", handleAccountsChanged);
    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
    };
  }
}, [navigate, fetchFileCids]); 


  // useEffect(() => {
  //   const handleBeforeUnload = () => {
  //     sessionStorage.clear();
  //   };

  //   window.addEventListener("beforeunload", handleBeforeUnload);

  //   return () => {
  //     window.removeEventListener("beforeunload", handleBeforeUnload);
  //   };
  // }, []);

  return (
    <AppContext.Provider
      value={{
        walletConnected,
        account,
        privateKey,
        deleteFileFromContract,
        connectWallet,
        disconnectWallet,
        uploadedFiles,
        uploadFile,
        sharedFiles,
        shareFile,
        getSharedFiles,
        accounts,
        handleAccountChange,
        getSharedFilesBySender,
        senders,
        getAllSenders,
        revokeAccess,
        setUserPublicKey,
        fetchPublicKey,
        publicKey,
        setPublicKey,
        setPrivateKey,
        retrieveEncryptedPrivateKey,
        generateKeyPair,
        encryptPrivateKey,
        storeEncryptedPrivateKey,
        decryptPrivateKey,
        getEncryptedAESKey,
        getEncryptedPasskey
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
