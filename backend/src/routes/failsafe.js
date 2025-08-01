const express = require('express');
const router = express.Router();
const { 
    authenticateToken, 
    requirePermission, 
    checkFailsafeStatus 
} = require('../middleware/security');

// =======================
// FAILSAFE RECOVERY API ROUTES
// =======================

let failsafeSystem = null;

// Initialize failsafe system reference
const initializeFailsafeRoutes = (failsafeInstance) => {
    failsafeSystem = failsafeInstance;
    console.log('🛡️ Failsafe API routes initialized');
};

// Apply middleware to all routes
router.use(checkFailsafeStatus);

// =======================
// PUBLIC ENDPOINTS
// =======================

// Get failsafe status (public, for system status checks)
router.get('/status', (req, res) => {
    if (!failsafeSystem) {
        return res.status(503).json({
            error: 'Failsafe system not initialized',
            available: false
        });
    }

    const status = failsafeSystem.getStatus();
    
    // Only expose minimal information publicly
    res.json({
        isActive: status.isActive,
        activationTime: status.activationTime,
        allowedIP: status.isActive ? status.allowedIP : null,
        metrics: {
            totalActivations: status.metrics.totalActivations
        },
        available: true
    });
});

// Health check endpoint
router.get('/health', (req, res) => {
    if (!failsafeSystem) {
        return res.status(503).json({
            status: 'unavailable',
            message: 'Failsafe system not initialized'
        });
    }

    const health = failsafeSystem.healthCheck();
    res.json(health);
});

// =======================
// AUTHENTICATED ENDPOINTS
// =======================

// Get detailed failsafe status (requires authentication)
router.get('/status/detailed', authenticateToken, requirePermission('view_security_dashboard'), (req, res) => {
    if (!failsafeSystem) {
        return res.status(503).json({
            error: 'Failsafe system not initialized'
        });
    }

    const status = failsafeSystem.getStatus();
    res.json(status);
});

// Manual failsafe activation (requires admin privileges)
router.post('/activate', authenticateToken, requirePermission('emergency_shutdown'), (req, res) => {
    if (!failsafeSystem) {
        return res.status(503).json({
            error: 'Failsafe system not initialized'
        });
    }

    const { reason } = req.body;
    
    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
        return res.status(400).json({
            error: 'Activation reason is required',
            message: 'Please provide a clear reason for activating failsafe recovery mode'
        });
    }

    // Prepare user info for logging
    const adminUser = {
        email: req.user.email || req.user.userId,
        userId: req.user.userId,
        role: req.user.role,
        clientIP: req.clientIP || req.ip
    };

    failsafeSystem.activateFailsafe(reason.trim(), adminUser)
        .then(result => {
            if (result.success) {
                console.log(`🚨 FAILSAFE ACTIVATED by ${adminUser.email}: ${reason}`);
                
                // Log the activation event
                res.status(200).json({
                    ...result,
                    activatedBy: adminUser.email,
                    timestamp: new Date().toISOString()
                });
            } else {
                res.status(409).json(result);
            }
        })
        .catch(error => {
            console.error('Failsafe activation error:', error);
            res.status(500).json({
                error: 'Failed to activate failsafe',
                message: error.message
            });
        });
});

// Manual failsafe deactivation (requires admin privileges and correct IP)
router.post('/deactivate', authenticateToken, requirePermission('emergency_shutdown'), (req, res) => {
    if (!failsafeSystem) {
        return res.status(503).json({
            error: 'Failsafe system not initialized'
        });
    }

    // Prepare user info for logging
    const adminUser = {
        email: req.user.email || req.user.userId,
        userId: req.user.userId,
        role: req.user.role
    };

    const clientIP = req.clientIP || req.ip;

    failsafeSystem.deactivateFailsafe(adminUser, clientIP)
        .then(result => {
            if (result.success) {
                console.log(`✅ FAILSAFE DEACTIVATED by ${adminUser.email} from IP ${clientIP}`);
                
                res.status(200).json({
                    ...result,
                    deactivatedBy: adminUser.email,
                    timestamp: new Date().toISOString()
                });
            } else {
                res.status(403).json(result);
            }
        })
        .catch(error => {
            console.error('Failsafe deactivation error:', error);
            res.status(500).json({
                error: 'Failed to deactivate failsafe',
                message: error.message
            });
        });
});

// Get activation history (requires admin privileges)
router.get('/history', authenticateToken, requirePermission('view_security_dashboard'), (req, res) => {
    if (!failsafeSystem) {
        return res.status(503).json({
            error: 'Failsafe system not initialized'
        });
    }

    const status = failsafeSystem.getStatus();
    const { activationHistory, ...metrics } = status.metrics;
    
    res.json({
        history: activationHistory || [],
        metrics: metrics,
        currentStatus: {
            isActive: status.isActive,
            activationTime: status.activationTime,
            activationReason: status.activationReason,
            activatedBy: status.activatedBy
        }
    });
});

// Test endpoint for failsafe system (admin only, for testing)
router.post('/test', authenticateToken, requirePermission('*'), (req, res) => {
    if (!failsafeSystem) {
        return res.status(503).json({
            error: 'Failsafe system not initialized'
        });
    }

    const { action } = req.body;
    const clientIP = req.clientIP || req.ip;
    
    switch (action) {
        case 'check_ip':
            res.json({
                clientIP: clientIP,
                isAllowed: failsafeSystem.isIPAllowed(clientIP),
                allowedIP: failsafeSystem.allowedIP,
                failsafeActive: failsafeSystem.isActive
            });
            break;
            
        case 'simulate_compromise':
            // Simulate admin portal compromise for testing
            failsafeSystem.detectAdminCompromise([{
                type: 'admin_portal_compromise_test',
                description: 'Test simulation of admin portal compromise',
                severity: 'CRITICAL',
                timestamp: new Date(),
                testMode: true
            }]);
            res.json({
                message: 'Admin compromise simulation triggered',
                timestamp: new Date().toISOString()
            });
            break;
            
        default:
            res.status(400).json({
                error: 'Invalid test action',
                availableActions: ['check_ip', 'simulate_compromise']
            });
    }
});

// =======================
// WEBSOCKET INTEGRATION
// =======================

// Setup WebSocket events for real-time failsafe notifications
const setupFailsafeWebSocket = (io) => {
    if (!failsafeSystem) {
        console.warn('Cannot setup WebSocket: Failsafe system not initialized');
        return;
    }

    // Listen for failsafe events and broadcast to clients
    failsafeSystem.on('failsafeActivated', (data) => {
        console.log('Broadcasting failsafe activation to all clients');
        io.emit('failsafe:activated', {
            ...data,
            timestamp: new Date().toISOString(),
            allowedIP: failsafeSystem.allowedIP
        });
    });

    failsafeSystem.on('failsafeDeactivated', (data) => {
        console.log('Broadcasting failsafe deactivation to all clients');
        io.emit('failsafe:deactivated', {
            ...data,
            timestamp: new Date().toISOString()
        });
    });

    failsafeSystem.on('unauthorizedAccess', (data) => {
        console.log('Broadcasting unauthorized access attempt to all clients');
        io.emit('failsafe:unauthorized_access', {
            ...data,
            timestamp: new Date().toISOString()
        });
    });

    console.log('🔌 Failsafe WebSocket events configured');
};

module.exports = {
    router,
    initializeFailsafeRoutes,
    setupFailsafeWebSocket
};