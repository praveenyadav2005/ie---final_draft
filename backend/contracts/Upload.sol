// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SecureUpload {
    struct FileMetadata {
        string cid;
        string fileName;
        string fileType;
        uint256 fileSize;
        uint256 timestamp;
        bool exists;
    }

    struct ShareInfo {
        uint256 shareId;
        bool active;
        address sharedBy;
        string encryptedAESKey; // Encrypted AES key for the recipient
    }

    mapping(address => FileMetadata[]) userFiles;
    mapping(string => address) fileOwners;
    mapping(address => mapping(address => FileMetadata[])) sharedFiles3D;
    mapping(address => mapping(address => ShareInfo[])) shareDetails;
    mapping(address => address[]) sendersList;
    mapping(address => mapping(address => bool)) isSender;
    mapping(string => mapping(address => bool)) fileAccess;
    mapping(string => string) fileAESKeys;  
    mapping(address => string) public userPublicKeys;
    mapping(address => string[]) userCids;

    uint256 private shareIdCounter;

    event FileUploaded(address indexed owner, string cid, string fileName, string encryptedAESKey);
    event FileShared(address indexed owner, address indexed recipient, string cid, uint256 shareId, string encryptedAESKey);
    event AccessRevoked(address indexed owner, address indexed recipient, string cid);
    event FileDeleted(address indexed owner, string cid);
     event PublicKeyUpdated(address indexed user, string publicKey);

    modifier onlyOwner(string memory cid) {
        require(isOwner(msg.sender, cid), "You are not the owner of this file");
        _;
    }

    function isOwner(address owner, string memory cid) public view returns (bool) {
        for (uint i = 0; i < userFiles[owner].length; i++) {
            if (keccak256(bytes(userFiles[owner][i].cid)) == keccak256(bytes(cid)) && userFiles[owner][i].exists) {
                return true;
            }
        }
        return false;
    }
    
    // Add or update user's public key
    function setPublicKey(string memory publicKey) external {
        userPublicKeys[msg.sender] = publicKey;
        emit PublicKeyUpdated(msg.sender, publicKey);
    }
    
    // Get user's public key
    function getPublicKey(address user) external view returns (string memory) {
        return userPublicKeys[user];
    }

    function getEncryptedAESKey(string memory cid) external view returns (string memory) {
        require(isOwner(msg.sender, cid), "You are not the owner of this file");
        return fileAESKeys[cid];
    }
    
   function addFile(string memory _cid, string memory _fileName, string memory _fileType,uint256 _fileSize, string memory encryptedAESKey) public {
        FileMetadata memory newFile = FileMetadata({
            cid: _cid,
            fileName: _fileName,
            fileType: _fileType,
            fileSize: _fileSize,
            timestamp: block.timestamp,
            exists: true
        });

        userFiles[msg.sender].push(newFile);
        userCids[msg.sender].push(newFile.cid);
        fileOwners[_cid] = msg.sender;
        fileAESKeys[_cid] = encryptedAESKey; // Store encrypted AES key

        emit FileUploaded(msg.sender, _cid, _fileName, encryptedAESKey);
    }
     
    //  function addFiles(string[] memory _cids, string[] memory _fileNames, string[] memory _fileTypes, string[] memory encryptedAESKeys) external {
    //     require(_cids.length == _fileNames.length && _cids.length == _fileTypes.length && _cids.length == encryptedAESKeys.length, "Input arrays must have the same length");

    //     for (uint i = 0; i < _cids.length; i++) {
    //         addFile(_cids[i], _fileNames[i], _fileTypes[i], encryptedAESKeys[i]);
    //     }
    // }
    
    function deleteFile(string memory cid) external onlyOwner(cid) {
        for (uint i = 0; i < userFiles[msg.sender].length; i++) {
            if (keccak256(bytes(userFiles[msg.sender][i].cid)) == keccak256(bytes(cid))) {
                userFiles[msg.sender][i].exists = false;
                break;
            }
        }
            
        emit FileDeleted(msg.sender, cid);
    }
    
    function shareFile(string memory cid, string memory _fileName, string memory _fileType,uint256 _fileSize, address recipient, string memory encryptedAESKey) public onlyOwner(cid) {
        fileAccess[cid][recipient] = true;

        uint256 shareId = shareIdCounter++;

        FileMetadata memory newFile = FileMetadata({
            cid: cid,
            fileName: _fileName,
            fileType: _fileType,
            fileSize: _fileSize,
            timestamp: block.timestamp,
            exists: true
        });

        ShareInfo memory info = ShareInfo({
            shareId: shareId,
            active: true,
            sharedBy: msg.sender,
            encryptedAESKey: encryptedAESKey // Store encrypted AES key for the recipient
        });

        if (!isSender[recipient][msg.sender]) {
            sendersList[recipient].push(msg.sender);
            isSender[recipient][msg.sender] = true;
        }

        sharedFiles3D[recipient][msg.sender].push(newFile);
        shareDetails[recipient][msg.sender].push(info);

        emit FileShared(msg.sender, recipient, cid, shareId, encryptedAESKey);
    }

    // function shareFiles(string[] memory cids, string[] memory _fileNames, string[] memory _fileTypes, address[] memory recipients, string[] memory encryptedAESKeys) external {
    //     require(cids.length == _fileNames.length && cids.length == _fileTypes.length && cids.length == recipients.length && cids.length == encryptedAESKeys.length, "Input arrays must have the same length");

    //     for (uint i = 0; i < cids.length; i++) {
    //         shareFile(cids[i], _fileNames[i], _fileTypes[i], recipients[i], encryptedAESKeys[i]);
    //     }
    // }
    
    function getFiles(address _user) external view returns (FileMetadata[] memory) {
        require(_user == msg.sender, "Unauthorized: you can only access your own files");
        
        uint256 count = 0;
        for (uint i = 0; i < userFiles[_user].length; i++) {
            if (userFiles[_user][i].exists) {
                count++;
            }
        }
        
        FileMetadata[] memory result = new FileMetadata[](count);
        uint256 index = 0;
        
        for (uint i = 0; i < userFiles[_user].length; i++) {
            if (userFiles[_user][i].exists) {
                result[index] = userFiles[_user][i];
                index++;
            }
        }
        
        return result;
    }
    
    struct SharedFileView {
        string cid;
        string fileName;
        string fileType;
        uint256 timestamp;
        uint256 shareId;
        address sharedBy;
    }
    
    function getSharedFiles() external view returns (SharedFileView[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < sendersList[msg.sender].length; i++) { 
            address sender = sendersList[msg.sender][i];
            for (uint256 j = 0; j < sharedFiles3D[msg.sender][sender].length; j++) {
                bool fileExists = isOwner(sender, sharedFiles3D[msg.sender][sender][j].cid);
                if (shareDetails[msg.sender][sender][j].active && 
                    fileAccess[sharedFiles3D[msg.sender][sender][j].cid][msg.sender] &&
                    fileExists) {
                    count++;
                }
            }
        }
        
        SharedFileView[] memory result = new SharedFileView[](count);
        uint256 index = 0;
        
        for (uint256 i = 0; i < sendersList[msg.sender].length; i++) {
            address sender = sendersList[msg.sender][i];
            for (uint256 j = 0; j < sharedFiles3D[msg.sender][sender].length; j++) {
                ShareInfo memory info = shareDetails[msg.sender][sender][j];
                FileMetadata memory file = sharedFiles3D[msg.sender][sender][j];
              
                bool fileExists = isOwner(sender, file.cid);
                if (info.active && fileAccess[file.cid][msg.sender] && fileExists) {
                    result[index] = SharedFileView({
                        cid: file.cid,
                        fileName: file.fileName,
                        fileType: file.fileType,
                        timestamp: file.timestamp,
                        shareId: info.shareId,
                        sharedBy: info.sharedBy
                    });
                    index++;
                }
            }
        }
        
        return result;
    }
    
    function getSharedFilesBySender(address sender) external view returns (SharedFileView[] memory) {
        require(isSender[msg.sender][sender], "No files shared by this sender");
      
        uint256 count = 0;
        for (uint256 i = 0; i < sharedFiles3D[msg.sender][sender].length; i++) {
            bool fileExists = isOwner(sender, sharedFiles3D[msg.sender][sender][i].cid);
            if (shareDetails[msg.sender][sender][i].active && 
                fileAccess[sharedFiles3D[msg.sender][sender][i].cid][msg.sender] &&
                fileExists) {
                count++;
            }
        }
        
        SharedFileView[] memory result = new SharedFileView[](count);
        uint256 index = 0;
        
        for (uint256 i = 0; i < sharedFiles3D[msg.sender][sender].length; i++) {
            ShareInfo memory info = shareDetails[msg.sender][sender][i];
            FileMetadata memory file = sharedFiles3D[msg.sender][sender][i];
            
            bool fileExists = isOwner(sender, file.cid);
            if (info.active && fileAccess[file.cid][msg.sender] && fileExists) {
                result[index] = SharedFileView({
                    cid: file.cid,
                    fileName: file.fileName,
                    fileType: file.fileType,
                    timestamp: file.timestamp,
                    shareId: info.shareId,
                    sharedBy: info.sharedBy
                });
                index++;
            }
        }
        
        return result;
    }
    
    function revokeAccess(string memory cid, address recipient) public onlyOwner(cid) {
        require(fileAccess[cid][recipient], "User does not have access");
     
        fileAccess[cid][recipient] = false;
        
        for (uint256 i = 0; i < sharedFiles3D[recipient][msg.sender].length; i++) {
            if (keccak256(bytes(sharedFiles3D[recipient][msg.sender][i].cid)) == keccak256(bytes(cid))) {
                shareDetails[recipient][msg.sender][i].active = false;
            }
        }
        
        emit AccessRevoked(msg.sender, recipient, cid);
    }

    //  function revokeAccessBatch(string[] memory cids, address[] memory recipients) external {
    //     require(cids.length == recipients.length, "Input arrays must have the same length");

    //     for (uint i = 0; i < cids.length; i++) {
    //         revokeAccess(cids[i], recipients[i]);
    //     }
    // }

    
    function getAllSenders() external view returns (address[] memory) {
        return sendersList[msg.sender];
    }

   
    function getEncryptedPasskey(string memory cid, address sender) external view returns (string memory) {
    require(isSender[msg.sender][sender], "No files shared by this sender");
    
    for (uint256 i = 0; i < shareDetails[msg.sender][sender].length; i++) {
        if (keccak256(bytes(sharedFiles3D[msg.sender][sender][i].cid)) == keccak256(bytes(cid))) {
            require(shareDetails[msg.sender][sender][i].active, "Access has been revoked");
            require(fileAccess[cid][msg.sender], "You don't have access to this file");
            require(isOwner(sender, cid), "File no longer exists");
            
            return shareDetails[msg.sender][sender][i].encryptedAESKey;
        }
    }
    revert("File not found");
}
    function getUserCids(address user) external view returns (string[] memory) {
        return userCids[user];
    }

}