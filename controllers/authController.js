const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const { Buffer } = require("buffer");
const { COSESign1, COSEKey, BigNum, Label, Int } = require("@emurgo/cardano-message-signing-nodejs");
const { Ed25519Signature, PublicKey, Address } = require("@emurgo/cardano-serialization-lib-nodejs");

// Function to request a challenge (nonce)
requestChallenge = async (req, res) => {
    console.log(req.body)
    try {
        const { walletAddress } = req.body;

        // Find user by wallet address
        let user = await User.findOne({ walletAddress });

        if (!user) {
            // If user is not found, return a prompt to complete the signup
            return res.status(200).json({ msg: 'User not found, please complete signup.', completeSignup: true });
        }

        // Update the nonce for security
        user.nonce = Math.floor(Math.random() * 1000000);
        await user.save();

        res.status(200).json({
            walletAddress: user.walletAddress,
            nonce: user.nonce,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Function to verify the signed challenge
verifyChallenge = async (req, res) => {
    try {
        const { walletAddress, signature, key } = req.body;

        // Fetch user by wallet address
        const user = await User.findOne({ walletAddress });

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Decode the COSESign1 object
        const decoded = COSESign1.from_bytes(Buffer.from(signature, "hex"));
        const headermap = decoded.headers().protected().deserialized_headers();
        const addressHex = Buffer.from(headermap.header(Label.new_text("address")).to_bytes())
            .toString("hex")
            .substring(4);
        const address = Address.from_bytes(Buffer.from(addressHex, "hex"));

        // Ensure the address matches the provided wallet address
        const addressBech32 = address.to_bech32();

        if (addressBech32 !== walletAddress) {
            return res.status(400).json({ msg: 'Address does not match the wallet address' });
        }

        // Create the public key object
        const coseKey = COSEKey.from_bytes(Buffer.from(key, "hex"));
        const pubKeyBytes = coseKey.header(Label.new_int(Int.new_negative(BigNum.from_str("2")))).as_bytes();
        const publicKey = PublicKey.from_bytes(pubKeyBytes);

        // Extract and compare the payload (nonce) with the expected nonce
        const payload = decoded.payload();
        const signatureObj = Ed25519Signature.from_bytes(decoded.signature());
        const receivedData = decoded.signed_data().to_bytes();

        // Decode the payload to string
        const utf8Payload = Buffer.from(payload).toString("utf8");

        // Check if the payload (nonce) matches the stored nonce
        const nonceMatches = user.nonce.toString() === utf8Payload;
        // Verify the signature
        const isVerified = publicKey.verify(receivedData, signatureObj);

        if (isVerified && nonceMatches) {
            // Issue JWT token
            const tokenPayload = { userId: user._id };
            const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '1h' });

            res.status(200).json({ token });
        } else {
            res.status(401).json({ msg: 'Verification failed' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Function to complete signup
completeSignup = async (req, res) => {
    console.log(req.body);
    try {
        const { walletAddress, name, age, institute, email, address, city, postalCode, role } = req.body;

        let user = await User.findOne({ walletAddress });

        if (user) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        // Create new user
        user = new User({
            walletAddress,
            name,
            age,
            institute,
            email,
            address,
            city,
            postalCode,
            role,
        });

        await user.save();

        res.status(201).json({ msg: 'User registered successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Function to fetch user details
const getUserDetails = async (req, res) => {
    try {
        const userId = req.user; // Get user ID from auth middleware
        const user = await User.findById(userId).select('-nonce'); // Fetch user details excluding sensitive fields

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        res.status(200).json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
};

const uploadIdentityCard = async (req, res) => {
    try {
        const userId = req.user;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        if (!req.file) {
            return res.status(400).json({ msg: 'No file uploaded' });
        }

        // Save the file path of the identity card
        user.identityCard = req.file.path;
        await user.save();

        res.status(200).json({ msg: 'Identity card uploaded successfully', filePath: req.file.path });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
};

module.exports = { requestChallenge, verifyChallenge, completeSignup, getUserDetails, uploadIdentityCard };
