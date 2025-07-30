const express = require('express');
const { authService } = require('../middleware/security');
const router = express.Router();

// =======================
// AUTHENTICATION ROUTES
// =======================

// User login with MFA
router.post('/login', async (req, res) => {
    try {
        const { email, password, mfaToken, deviceFingerprint } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ 
                error: 'Email and password required' 
            });
        }

        const result = await authService.authenticateUser(
            email, 
            password, 
            mfaToken, 
            deviceFingerprint
        );

        res.json(result);
        
    } catch (error) {
        res.status(401).json({ 
            error: error.message,
            timestamp: new Date()
        });
    }
});

// Setup MFA for user
router.post('/mfa/setup', async (req, res) => {
    try {
        const { userId } = req.body;
        
        if (!userId) {
            return res.status(400).json({ error: 'User ID required' });
        }

        const mfaSetup = authService.setupMFA(userId);
        
        res.json({
            success: true,
            mfaSetup
        });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Verify MFA token
router.post('/mfa/verify', async (req, res) => {
    try {
        const { secret, token } = req.body;
        
        if (!secret || !token) {
            return res.status(400).json({ 
                error: 'Secret and token required' 
            });
        }

        const isValid = authService.verifyMFA(secret, token);
        
        res.json({
            success: true,
            valid: isValid
        });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get current user profile
router.get('/profile', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ error: 'Access token required' });
        }

        // Verify token and get user info
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, authService.jwtSecret);
        
        res.json({
            success: true,
            user: {
                id: decoded.userId,
                email: decoded.email,
                role: decoded.role,
                permissions: decoded.permissions,
                facility: decoded.facility
            }
        });
        
    } catch (error) {
        res.status(403).json({ error: 'Invalid token' });
    }
});

// Logout (invalidate session)
router.post('/logout', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        
        if (token) {
            const jwt = require('jsonwebtoken');
            const decoded = jwt.verify(token, authService.jwtSecret);
            
            // Remove active session
            authService.activeSessions.delete(decoded.userId);
            
            console.log(`User ${decoded.email} logged out`);
        }

        res.json({
            success: true,
            message: 'Logged out successfully'
        });
        
    } catch (error) {
        res.json({
            success: true,
            message: 'Logged out successfully'
        });
    }
});

module.exports = router;