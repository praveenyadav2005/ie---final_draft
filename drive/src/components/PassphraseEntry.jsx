import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
  
  // Function to truncate wallet address
  const truncateAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  useEffect(() => {
    if (account) {
      const encryptedPrivateKey = retrieveEncryptedPrivateKey(account);
      setIsNewUser(!encryptedPrivateKey);
    }
  }, [account, retrieveEncryptedPrivateKey]);

  const handleSubmit = async (e) => {
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
        
        await setUserPublicKey(keyPair.publicKey);
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
    <div 
      className="min-h-screen w-full m-0 p-0 box-border bg-cover bg-center relative flex items-center justify-center"
      style={{ backgroundImage: "url('/bg.jpg')" }}
    >
      {/* Overlay for better readability */}
      <div className="absolute w-full h-full inset-0 bg-black opacity-30"></div>

      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md bg-gray-800 rounded-lg shadow-2xl p-8"
      >
        {/* New Account Display Section */}
        <div className="mb-6 text-center">
          <div className="inline-flex items-center justify-center bg-gray-700 rounded-full px-4 py-2">
            <span className="text-sm text-gray-300 mr-2">Connected Account:</span>
            <span className="font-bold text-white bg-blue-600 rounded-full px-3 py-1">
              {truncateAddress(account)}
            </span>
          </div>
        </div>

        <h2 className="text-3xl font-bold mb-6 text-center text-white">
          {isNewUser ? 'Create Your Passphrase' : 'Enter Your Passphrase'}
        </h2>
    
        {error && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-4 p-3 bg-red-600 text-white rounded-md text-sm"
          >
            {error}
          </motion.div>
        )}
    
        <form onSubmit={handleSubmit} className="space-y-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <input
              type="password"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              placeholder={isNewUser ? "Create your passphrase" : "Enter your existing passphrase"}
              required
              className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-900 text-white placeholder-gray-500"
              minLength={8}
            />
            {isNewUser && (
              <p className="mt-2 text-sm text-gray-400">
                Create a strong passphrase that you'll remember. This will be used to encrypt your private key.
              </p>
            )}
          </motion.div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {isNewUser ? 'Create Passphrase' : 'Enter Passphrase'}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
};

export default PassphraseEntry;