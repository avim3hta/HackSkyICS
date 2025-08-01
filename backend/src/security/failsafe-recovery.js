const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');

// =======================
// FAILSAFE RECOVERY SYSTEM
// =======================

class FailsafeRecoverySystem extends EventEmitter {
    constructor() {
        super();
        this.isActive = false;
        this.activationTime = null;
        this.activationReason = null;
        this.activatedBy = null;
        this.allowedIP = '10.12.12.108';
        this.stateFile = path.join(__dirname, '../../../data/failsafe-state.json');
        
        // Recovery metrics
        this.metrics = {
            totalActivations: 0,
            manualActivations: 0,
            automaticActivations: 0,
            compromiseDetections: 0,
            lastActivation: null,
            activationHistory: []
        };

        // Initialize state from file
        this.loadState();
        
        console.log('🛡️ Failsafe Recovery System Initialized');
        console.log(`🔒 Recovery IP: ${this.allowedIP}`);
    }

    // Load state from persistent storage
    async loadState() {
        try {
            // Ensure data directory exists
            const dataDir = path.dirname(this.stateFile);
            await fs.mkdir(dataDir, { recursive: true });
            
            const data = await fs.readFile(this.stateFile, 'utf8');
            const state = JSON.parse(data);
            
            this.isActive = state.isActive || false;
            this.activationTime = state.activationTime ? new Date(state.activationTime) : null;
            this.activationReason = state.activationReason || null;
            this.activatedBy = state.activatedBy || null;
            this.metrics = { ...this.metrics, ...state.metrics };
            
            if (this.isActive) {
                console.log('🚨 FAILSAFE RECOVERY MODE RESTORED FROM PERSISTENT STATE');
                console.log(`   Activated: ${this.activationTime}`);
                console.log(`   Reason: ${this.activationReason}`);
                console.log(`   Access restricted to: ${this.allowedIP}`);
            }
        } catch (error) {
            // File doesn't exist or is corrupted, start with default state
            console.log('📄 No existing failsafe state found, starting fresh');
            await this.saveState();
        }
    }

    // Save state to persistent storage
    async saveState() {
        try {
            const state = {
                isActive: this.isActive,
                activationTime: this.activationTime,
                activationReason: this.activationReason,
                activatedBy: this.activatedBy,
                metrics: this.metrics,
                lastUpdated: new Date().toISOString()
            };
            
            await fs.writeFile(this.stateFile, JSON.stringify(state, null, 2));
        } catch (error) {
            console.error('Failed to save failsafe state:', error);
        }
    }

    // Manual activation by admin
    async activateFailsafe(reason, adminUser) {
        if (this.isActive) {
            console.log('⚠️ Failsafe already active');
            return {
                success: false,
                message: 'Failsafe recovery is already active',
                activationTime: this.activationTime
            };
        }

        console.log('🚨 FAILSAFE RECOVERY ACTIVATED MANUALLY');
        console.log(`   Admin: ${adminUser?.email || 'Unknown'}`);
        console.log(`   Reason: ${reason}`);
        console.log(`   Access restricted to IP: ${this.allowedIP}`);

        this.isActive = true;
        this.activationTime = new Date();
        this.activationReason = reason;
        this.activatedBy = adminUser?.email || 'Manual';

        // Update metrics
        this.metrics.totalActivations++;
        this.metrics.manualActivations++;
        this.metrics.lastActivation = this.activationTime;
        this.metrics.activationHistory.push({
            timestamp: this.activationTime,
            reason: reason,
            activatedBy: this.activatedBy,
            type: 'manual',
            clientIP: adminUser?.clientIP || 'unknown'
        });

        // Keep only last 50 activations in history
        if (this.metrics.activationHistory.length > 50) {
            this.metrics.activationHistory = this.metrics.activationHistory.slice(-50);
        }

        await this.saveState();
        this.emit('failsafeActivated', {
            reason,
            activatedBy: this.activatedBy,
            timestamp: this.activationTime,
            type: 'manual'
        });

        return {
            success: true,
            message: 'Failsafe recovery activated successfully',
            activationTime: this.activationTime,
            allowedIP: this.allowedIP
        };
    }

    // Automatic activation by threat detection
    async activateFailsafeAuto(threatData) {
        if (this.isActive) {
            console.log('⚠️ Failsafe already active, threat logged');
            return;
        }

        const reason = `Automatic: ${threatData.type} detected`;
        
        console.log('🚨 FAILSAFE RECOVERY ACTIVATED AUTOMATICALLY');
        console.log(`   Threat: ${threatData.type}`);
        console.log(`   Severity: ${threatData.severity}`);
        console.log(`   Details: ${JSON.stringify(threatData.details)}`);
        console.log(`   Access restricted to IP: ${this.allowedIP}`);

        this.isActive = true;
        this.activationTime = new Date();
        this.activationReason = reason;
        this.activatedBy = 'AutoSystem';

        // Update metrics
        this.metrics.totalActivations++;
        this.metrics.automaticActivations++;
        this.metrics.compromiseDetections++;
        this.metrics.lastActivation = this.activationTime;
        this.metrics.activationHistory.push({
            timestamp: this.activationTime,
            reason: reason,
            activatedBy: 'AutoSystem',
            type: 'automatic',
            threat: threatData
        });

        // Keep only last 50 activations in history
        if (this.metrics.activationHistory.length > 50) {
            this.metrics.activationHistory = this.metrics.activationHistory.slice(-50);
        }

        await this.saveState();
        this.emit('failsafeActivated', {
            reason,
            activatedBy: 'AutoSystem',
            timestamp: this.activationTime,
            type: 'automatic',
            threat: threatData
        });
    }

    // Deactivate failsafe (only from allowed IP)
    async deactivateFailsafe(adminUser, clientIP) {
        if (!this.isActive) {
            return {
                success: false,
                message: 'Failsafe recovery is not active'
            };
        }

        // Verify request is from allowed IP
        if (clientIP !== this.allowedIP) {
            console.log(`🚫 Failsafe deactivation denied from IP: ${clientIP}`);
            return {
                success: false,
                message: 'Failsafe can only be deactivated from the recovery device',
                allowedIP: this.allowedIP
            };
        }

        console.log('✅ FAILSAFE RECOVERY DEACTIVATED');
        console.log(`   Admin: ${adminUser?.email || 'Unknown'}`);
        console.log(`   Duration: ${Date.now() - this.activationTime.getTime()}ms`);

        const deactivationTime = new Date();
        const duration = deactivationTime - this.activationTime;

        this.isActive = false;
        this.activationTime = null;
        this.activationReason = null;
        this.activatedBy = null;

        await this.saveState();
        this.emit('failsafeDeactivated', {
            deactivatedBy: adminUser?.email || 'Unknown',
            timestamp: deactivationTime,
            duration: duration
        });

        return {
            success: true,
            message: 'Failsafe recovery deactivated successfully',
            duration: duration
        };
    }

    // Check if client IP is allowed
    isIPAllowed(clientIP) {
        if (!this.isActive) {
            return true; // Not in failsafe mode, allow all IPs
        }
        
        return clientIP === this.allowedIP;
    }

    // Get current status
    getStatus() {
        return {
            isActive: this.isActive,
            activationTime: this.activationTime,
            activationReason: this.activationReason,
            activatedBy: this.activatedBy,
            allowedIP: this.allowedIP,
            metrics: this.metrics
        };
    }

    // Check for admin portal compromise patterns
    detectAdminCompromise(authEvents) {
        // Look for suspicious admin activity patterns
        const suspiciousPatterns = [
            'multiple_failed_admin_logins',
            'admin_login_from_new_location',
            'admin_privilege_escalation',
            'admin_session_hijacking',
            'admin_account_lockout_bypass',
            'admin_unusual_activity_time'
        ];

        for (const event of authEvents) {
            if (suspiciousPatterns.some(pattern => 
                event.type.includes(pattern) || 
                event.description.toLowerCase().includes('admin') && 
                event.severity === 'CRITICAL'
            )) {
                // Admin portal potentially compromised
                this.activateFailsafeAuto({
                    type: 'admin_portal_compromise',
                    severity: 'CRITICAL',
                    details: event,
                    timestamp: new Date()
                });
                break;
            }
        }
    }

    // Health check
    healthCheck() {
        return {
            status: 'healthy',
            failsafeActive: this.isActive,
            allowedIP: this.allowedIP,
            uptime: process.uptime(),
            metrics: this.metrics
        };
    }
}

module.exports = { FailsafeRecoverySystem };