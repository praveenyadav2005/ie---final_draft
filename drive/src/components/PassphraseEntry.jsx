import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import nacl from 'tweetnacl';
import { Buffer } from 'buffer';

const PassphraseEntry = () => {
  const [passphrase, setPassphrase] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);
  const [error, setError] = useState('');
  const { 
    account, 
    setUserPublicKey,
    setPrivateKey, 
    setPublicKey, 
    retrieveEncryptedPrivateKey, 
    generateKeyPair, 
    encryptPrivateKey, 
    storeEncryptedPrivateKey,
    decryptPrivateKey,
    fetchPublicKey
  } = useAppContext();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Check if user is new by checking if they have an encrypted private key
    if (account) {
      const encryptedPrivateKey = retrieveEncryptedPrivateKey(account);
      setIsNewUser(!encryptedPrivateKey);
    }
  }, [account, retrieveEncryptedPrivateKey]);

  const handleSubmit = async (e) => { // Mark the function as async
    e.preventDefault();
    setError('');
    
    try {
      const encryptedPrivateKey = retrieveEncryptedPrivateKey(account);
      
      if (!encryptedPrivateKey) {
        // New user flow - create a new key pair
        const keyPair = generateKeyPair();
        const enPrivateKey = encryptPrivateKey(keyPair.privateKey, passphrase);
        storeEncryptedPrivateKey(account, enPrivateKey);

        setPrivateKey(keyPair.privateKey);
        setPublicKey(keyPair.publicKey);
        
        await setUserPublicKey(keyPair.publicKey); // Await the async function
        navigate('/dashboard');
      } else {
        // Existing user flow - decrypt existing key
        try {
          const decryptedPrivateKey = decryptPrivateKey(encryptedPrivateKey, passphrase);
          const Pair = nacl.box.keyPair.fromSecretKey(new Uint8Array(decryptedPrivateKey));
          const derivedPublicKey = Buffer.from(Pair.publicKey).toString("hex");
          
          setPublicKey(derivedPublicKey);
          const prevPublicKey = await fetchPublicKey(account); 
          if (!prevPublicKey) {
            await setUserPublicKey(derivedPublicKey); 
          }
          setPrivateKey(decryptedPrivateKey);
          navigate('/dashboard');
        } catch (decryptError) {
          console.error("Decryption error:", decryptError);
          setError('Incorrect passphrase. Please try again.');
        }
      }
    } catch (error) {
      console.error("Error processing passphrase:", error);
      setError('Failed to process passphrase. Please try again.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white rounded-lg shadow-md p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
          {isNewUser ? 'Create Your Passphrase' : 'Enter Your Passphrase'}
        </h2>
    
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}
    
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              placeholder={isNewUser ? "Create your passphrase" : "Enter your existing passphrase"}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-black text-white placeholder-gray-400"
              minLength={8}
            />
            {isNewUser && (
              <p className="mt-2 text-sm text-gray-600">
                Create a strong passphrase that you'll remember. This will be used to encrypt your private key.
              </p>
            )}
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {isNewUser ? 'Create Passphrase' : 'Enter Passphrase'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PassphraseEntry;