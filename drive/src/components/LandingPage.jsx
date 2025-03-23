import React from "react";
import { useAppContext } from "../context/AppContext";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { FaExternalLinkAlt } from "react-icons/fa";


function LandingPage() {
  const { walletConnected, connectWallet, account } = useAppContext();
  const navigate = useNavigate();
  
  // If already connected, redirect to passphrase page
  React.useEffect(() => {
    if (walletConnected && account) {
      navigate('/passphrase-entry');
    }
  }, [walletConnected, account, navigate]);

  // Handler for wallet connection
  const handleConnectWallet = async () => {
    const success = await connectWallet();
    if (success) {
      navigate('/passphrase-entry');
    }
  };

  // If already connected, don't render the landing page
  if (walletConnected) return null;

  return (
    <div
      className="min-h-screen w-full m-0 p-0 box-border bg-cover bg-center relative"
      style={{ backgroundImage: "url('/bg.jpg')" }}
    >
      {/* Overlay for better readability */}
      <div className="absolute w-full inset-0 bg-black opacity-20"></div>

      <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 py-20">
        <motion.h1
          className="text-4xl md:text-6xl font-bold text-white mb-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          The Future of Secure & Decentralized Cloud Storage
        </motion.h1>

        <motion.p
          className="text-lg text-gray-300 max-w-2xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          Store, share, and access your files securely using blockchain
          technology— no middlemen, no risk of data breaches.
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="mt-6 flex gap-3 flex-wrap items-center justify-center">
          <button
            onClick={handleConnectWallet}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg shadow-md transition"
          >
            Connect Wallet
          </button>
          <button className="px-6 py-3 bg-gray-700 hover:bg-gray-800 text-white font-bold rounded-lg shadow-md transition">
            <Link to="/learnMore" className="flex items-center">
              Learn More
              <FaExternalLinkAlt className="ml-1" />
            </Link>
         </button>
        </motion.div>
      </div>

      {/* Features Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9, duration: 0.6 }}
        className="relative z-10 mt-10 px-8 text-center">
        <h2 className="text-3xl font-bold text-white mb-6">Why Choose Us?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 120 }}
            className="p-6 py-8 bg-gray-800 rounded-lg shadow-lg"
          >
            <h3 className="text-xl text-blue-400 font-bold">
              🔐 Secure Encryption
            </h3>
            <p className="text-gray-300 mt-2">
              Your data is encrypted and only you have access to it.
            </p>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 120 }}
            className="p-6 py-8 bg-gray-800 rounded-lg shadow-lg"
          >
            <h3 className="text-xl text-blue-400 font-bold">
              🚀 Lightning Fast
            </h3>
            <p className="text-gray-300 mt-2">
              Experience high-speed access with decentralized nodes.
            </p>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 120 }}
            className="p-6 py-8 bg-gray-800 rounded-lg shadow-lg"
          >
            <h3 className="text-xl text-blue-400 font-bold">🛡️ Tamper-Proof</h3>
            <p className="text-gray-300 mt-2">
              Blockchain ensures that no data can be altered or hacked.
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

export default LandingPage;