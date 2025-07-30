const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const speakeasy = require('speakeasy');
const { supabase } = require('../integrations/supabase');

// =======================
// MULTI-FACTOR AUTHENTICATION
// =======================

class AuthenticationService {
    constructor() {
        this.jwtSecret = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');
        this.sessionTimeout = 30 * 60 * 1000; // 30 minutes
        this.maxLoginAttempts = 3;
        this.lockoutDuration = 15 * 60 * 1000; // 15 minutes
        this.activeSessions = new Map();
        this.loginAttempts = new Map();
    }

    // Generate secure session token
    generateSessionToken(user) {
        const payload = {
            userId: user.id,
            email: user.email,
            role: user.role,
            permissions: user.permissions,
            facility: user.facility,
            sessionId: crypto.randomUUID(),
            iat: Date.now(),
            exp: Date.now() + this.sessionTimeout
        };

        return jwt.sign(payload, this.jwtSecret, { algorithm: 'HS256' });
    }

    // Multi-factor authentication setup
    setupMFA(userId) {
        const secret = speakeasy.generateSecret({
            name: `HackSkyICS:${userId}`,
            issuer: 'HackSkyICS Industrial Security',
            length: 32
        });

        return {
            secret: secret.base32,
            qrCode: secret.otpauth_url,
            backupCodes: this.generateBackupCodes()
        };
    }

    // Verify MFA token
    verifyMFA(secret, token) {
        return speakeasy.totp.verify({
            secret: secret,
            encoding: 'base32',
            token: token,
            window: 2 // Allow 2 time steps (±60 seconds)
        });
    }

    // Generate backup codes
    generateBackupCodes() {
        const codes = [];
        for (let i = 0; i < 10; i++) {
            codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
        }
        return codes;
    }

    // Advanced login security
    async authenticateUser(email, password, mfaToken, deviceFingerprint) {
        try {
            // Check for account lockout
            const lockoutKey = `lockout_${email}`;
            const attemptKey = `attempts_${email}`;
            
            if (this.loginAttempts.has(lockoutKey)) {
                const lockoutTime = this.loginAttempts.get(lockoutKey);
                if (Date.now() < lockoutTime) {
                    throw new Error('Account temporarily locked due to multiple failed attempts');
                }
            }

            // Verify user credentials
            const { data: user, error } = await supabase
                .from('users')
                .select('*')
                .eq('email', email)
                .single();

            if (error || !user) {
                this.recordFailedAttempt(email);
                throw new Error('Invalid credentials');
            }

            // Verify password
            const passwordValid = await bcrypt.compare(password, user.password_hash);
            if (!passwordValid) {
                this.recordFailedAttempt(email);
                throw new Error('Invalid credentials');
            }

            // Verify MFA if enabled
            if (user.mfa_enabled) {
                if (!mfaToken) {
                    throw new Error('MFA token required');
                }
                
                const mfaValid = this.verifyMFA(user.mfa_secret, mfaToken);
                if (!mfaValid) {
                    this.recordFailedAttempt(email);
                    throw new Error('Invalid MFA token');
                }
            }

            // Device fingerprinting for anomaly detection
            const knownDevice = await this.checkDeviceFingerprint(user.id, deviceFingerprint);
            if (!knownDevice) {
                await this.alertUnknownDevice(user, deviceFingerprint);
            }

            // Clear failed attempts
            this.loginAttempts.delete(attemptKey);
            this.loginAttempts.delete(lockoutKey);

            // Generate session
            const sessionToken = this.generateSessionToken(user);
            this.activeSessions.set(user.id, {
                token: sessionToken,
                deviceFingerprint,
                loginTime: new Date(),
                lastActivity: new Date()
            });

            // Log successful authentication
            await this.logSecurityEvent('USER_LOGIN_SUCCESS', {
                userId: user.id,
                email: user.email,
                deviceFingerprint,
                timestamp: new Date()
            });

            return {
                success: true,
                token: sessionToken,
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    permissions: user.permissions,
                    facility: user.facility
                }
            };

        } catch (error) {
            await this.logSecurityEvent('USER_LOGIN_FAILED', {
                email,
                error: error.message,
                timestamp: new Date()
            });
            throw error;
        }
    }

    // Record failed login attempts
    recordFailedAttempt(email) {
        const attemptKey = `attempts_${email}`;
        const lockoutKey = `lockout_${email}`;
        
        const attempts = (this.loginAttempts.get(attemptKey) || 0) + 1;
        this.loginAttempts.set(attemptKey, attempts);

        if (attempts >= this.maxLoginAttempts) {
            this.loginAttempts.set(lockoutKey, Date.now() + this.lockoutDuration);
            this.logSecurityEvent('ACCOUNT_LOCKED', { email, attempts });
        }
    }

    // Device fingerprinting
    async checkDeviceFingerprint(userId, fingerprint) {
        const { data: devices } = await supabase
            .from('user_devices')
            .select('*')
            .eq('user_id', userId)
            .eq('fingerprint', fingerprint);

        return devices && devices.length > 0;
    }

    // Alert on unknown device login
    async alertUnknownDevice(user, fingerprint) {
        await this.logSecurityEvent('UNKNOWN_DEVICE_LOGIN', {
            userId: user.id,
            email: user.email,
            fingerprint,
            timestamp: new Date()
        });

        // Send security alert email (implement email service)
        console.log(`🚨 Security Alert: Unknown device login for user ${user.email}`);
    }

    // Log security events
    async logSecurityEvent(eventType, details) {
        await supabase
            .from('security_events')
            .insert({
                event_type: eventType,
                details: details,
                timestamp: new Date(),
                source: 'authentication_service'
            });
    }
}

// =======================
// ROLE-BASED ACCESS CONTROL
// =======================

class AuthorizationService {
    constructor() {
        this.rolePermissions = {
            'system_admin': ['*'], // Full access
            'security_operator': [
                'view_security_dashboard',
                'manage_alerts',
                'view_logs',
                'block_users',
                'emergency_shutdown'
            ],
            'plant_operator': [
                'view_hmi',
                'control_devices',
                'view_metrics',
                'acknowledge_alarms'
            ],
            'engineer': [
                'view_hmi',
                'configure_devices',
                'view_diagnostics',
                'update_parameters'
            ],
            'viewer': [
                'view_dashboard',
                'view_metrics'
            ]
        };

        this.facilityRestrictions = {
            'water_treatment': ['PLANT_001', 'PLANT_002'],
            'nuclear_power': ['NUCLEAR_001'],
            'electrical_grid': ['GRID_001', 'GRID_002', 'GRID_003']
        };
    }

    // Check if user has required permission
    hasPermission(userRole, userPermissions, requiredPermission) {
        // System admin has all permissions
        if (userRole === 'system_admin') {
            return true;
        }

        // Check role-based permissions
        const rolePerms = this.rolePermissions[userRole] || [];
        if (rolePerms.includes('*') || rolePerms.includes(requiredPermission)) {
            return true;
        }

        // Check user-specific permissions
        if (userPermissions && userPermissions.includes(requiredPermission)) {
            return true;
        }

        return false;
    }

    // Check facility access
    canAccessFacility(userFacility, requestedFacility) {
        if (userFacility === 'all') {
            return true;
        }
        
        return userFacility === requestedFacility;
    }

    // Authorize device control
    canControlDevice(user, deviceId, action) {
        // Critical safety check
        if (action === 'emergency_stop' || action === 'safety_shutdown') {
            return this.hasPermission(user.role, user.permissions, 'emergency_shutdown');
        }

        // Check device control permission
        if (!this.hasPermission(user.role, user.permissions, 'control_devices')) {
            return false;
        }

        // Check facility access
        // Extract facility from device ID (e.g., WTP_001 -> water_treatment)
        const facilityPrefix = deviceId.split('_')[0];
        const facilityMap = {
            'WTP': 'water_treatment',
            'NPP': 'nuclear_power', 
            'GRID': 'electrical_grid'
        };
        
        const deviceFacility = facilityMap[facilityPrefix];
        return this.canAccessFacility(user.facility, deviceFacility);
    }
}

// =======================
// MIDDLEWARE IMPLEMENTATIONS
// =======================

const authService = new AuthenticationService();
const authzService = new AuthorizationService();

// Rate limiting by user role
const createRateLimiter = (role) => {
    const limits = {
        'system_admin': { windowMs: 15 * 60 * 1000, max: 1000 },
        'security_operator': { windowMs: 15 * 60 * 1000, max: 500 },
        'plant_operator': { windowMs: 15 * 60 * 1000, max: 200 },
        'engineer': { windowMs: 15 * 60 * 1000, max: 100 },
        'viewer': { windowMs: 15 * 60 * 1000, max: 50 }
    };

    const config = limits[role] || limits['viewer'];
    
    return rateLimit({
        windowMs: config.windowMs,
        max: config.max,
        message: {
            error: 'Too many requests',
            role: role,
            limit: config.max
        },
        standardHeaders: true,
        legacyHeaders: false
    });
};

// Authentication middleware
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'Access token required' });
        }

        const decoded = jwt.verify(token, authService.jwtSecret);
        
        // Check session expiry
        if (decoded.exp < Date.now()) {
            return res.status(401).json({ error: 'Token expired' });
        }

        // Verify active session
        const session = authService.activeSessions.get(decoded.userId);
        if (!session) {
            return res.status(401).json({ error: 'Session not found' });
        }

        // Update last activity
        session.lastActivity = new Date();

        req.user = decoded;
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        return res.status(403).json({ error: 'Invalid token' });
    }
};

// Authorization middleware
const requirePermission = (permission) => {
    return (req, res, next) => {
        if (!authzService.hasPermission(req.user.role, req.user.permissions, permission)) {
            return res.status(403).json({ 
                error: 'Insufficient permissions',
                required: permission,
                userRole: req.user.role
            });
        }
        next();
    };
};

// Facility access middleware
const requireFacilityAccess = (req, res, next) => {
    const requestedFacility = req.params.facility || req.body.facility;
    
    if (!authzService.canAccessFacility(req.user.facility, requestedFacility)) {
        return res.status(403).json({
            error: 'Facility access denied',
            userFacility: req.user.facility,
            requestedFacility: requestedFacility
        });
    }
    next();
};

module.exports = {
    AuthenticationService,
    AuthorizationService,
    authService,
    authenticateToken,
    requirePermission,
    requireFacilityAccess,
    createRateLimiter
};