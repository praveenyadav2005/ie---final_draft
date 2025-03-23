import React from "react";
import { FaGithub, FaExternalLinkAlt,FaArrowLeft } from "react-icons/fa";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const technologies = [
  { name: "React", description: "A powerful JavaScript library for building interactive UIs." },
  { name: "Tailwind CSS", description: "A utility-first CSS framework for designing modern applications." },
  { name: "IPFS", description: "A decentralized network protocol for storing and sharing files securely." },
  { name: "Pinata", description: "A platform that simplifies managing IPFS files with pinning services." },
  { name: "Solidity", description: "A smart contract language for writing secure blockchain-based applications." },
  { name: "Infura", description: "A scalable API gateway for interacting with the Ethereum blockchain." },
];

const team = [
  { name: "Praveen Yadav", role: "Developer", github: "https://github.com/praveenyadav2005" },
  { name: "Mithun", role: "Developer", github: "https://github.com/Mithun-144" },
  { name: "Lakshya", role: "Developer", github: "https://github.com/legedusky" },
];

const githubRepo = "https://github.com/praveenyadav2005/IE"; // Change this to your repo link

export default function LearnMore() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-6">
      {/* Header */}
      <Link
       to="/"      
      className=" md:self-start flex items-center gap-2 ml-6 mb-2 py-2 px-6 text-white bg-gray-800 rounded-lg hover:bg-gray-700"
    >
      <FaArrowLeft size={20} />
      <span>Home</span>
    </Link>

      <motion.h1
        className="text-4xl font-extrabold mb-6 tracking-wide text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        📖 Learn More
      </motion.h1>
      
      <motion.p
        className="text-lg text-gray-400 max-w-2xl text-center mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.8 }}
      >
        Our decentralized storage app combines blockchain security with IPFS storage to create a 
        <strong>  trustless, immutable, and censorship-resistant storage  </strong> solution.    
      </motion.p>

      {/* Technology Stack Section */}
      <motion.div
      className="flex flex-col items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.6, duration: 0.8 }}
      >
      <h2 className="text-3xl font-semibold text-green-400 mb-4">🚀 Tech Stack</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 w-full max-w-5xl">
        {technologies.map((tech, index) => (
          <motion.div
            key={index}
            className="p-6 bg-gray-800 bg-opacity-80 backdrop-blur-md rounded-lg shadow-lg"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 120 }}
          >
            <h2 className="text-2xl font-semibold mb-2 text-blue-400">{tech.name}</h2>
            <p className="text-gray-300">{tech.description}</p>
          </motion.div>
        ))}
      </div>
      </motion.div>

      {/* Architecture Section with Interactive Diagram */}
      <div className="mt-12 max-w-4xl text-center">
        <h2 className="text-3xl font-bold mb-4 text-yellow-400">🛠️ Application Architecture</h2>
        <p className="mt-4 text-lg leading-relaxed text-center max-w-3xl">
        <strong>Frontend:</strong> Built using <strong>React & Tailwind CSS</strong> for a seamless UI.
        <br />
        <strong>Storage:</strong> Files are uploaded to <strong>IPFS</strong> and pinned using <strong>Pinata</strong> for persistence.
        <br />
        <strong>Blockchain Integration:</strong> Smart contracts written in <strong>Solidity</strong> store the <strong>CID</strong> of each file.
        <br />
        <strong>Infura API:</strong> Connects the application to Ethereum without running a full node.
      </p>
      <img
  src="/arch_blue.gif"
  alt="Placeholder Architecture Diagram"
  className="mt-6 w-full "
/>
      </div>

      {/* Team Section */}
      <div className="mt-12 max-w-4xl text-center">
        <h2 className="text-3xl font-bold mb-4 text-purple-400">👥 Meet The Team</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {team.map((member, index) => (
            <motion.div
              key={index}
              className="p-6 bg-gray-800 bg-opacity-80 backdrop-blur-md rounded-lg shadow-lg flex flex-col items-center"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 120 }}
            >
              <h3 className="text-2xl font-semibold text-blue-300">{member.name}</h3>
              <p className="text-gray-400 mb-2">{member.role}</p>
              <a href={member.github} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-500 flex items-center">
                <FaGithub className="mr-2" /> GitHub <FaExternalLinkAlt className="ml-1" />
              </a>
            </motion.div>
          ))}
        </div>
      </div>

      {/* GitHub Repo Section */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-red-400 mb-2">🔗 Team GitHub Repository</h2>
        <a
          href={githubRepo}
          target="_blank"
          rel="noopener noreferrer"
          className="text-white bg-blue-600 px-4 py-3 rounded-lg text-lg font-semibold shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center"
        >
          <FaGithub className="mr-2" /> Visit Team Repo
        </a>
      </div>
    </div>
  );
}
