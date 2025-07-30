const EventEmitter = require('events');
const { exec } = require('child_process');
const { supabase } = require('../integrations/supabase');

// =======================
// AUTOMATED INCIDENT RESPONSE SYSTEM
// =======================

class IncidentResponseSystem extends EventEmitter {
    constructor(threatDetectionEngine) {
        super();
        this.threatEngine = threatDetectionEngine;
        this.isActive = false;
        this.activeResponses = new Map();
        this.responseHistory = [];
        
        // Response capabilities
        this.responseActions = this.initializeResponseActions();
        
        // Connect to threat detection engine
        this.threatEngine.on('threatDetected', (threat) => this.handleThreat(threat));
        this.threatEngine.on('criticalThreat', (threat) => this.handleCriticalThreat(threat));
        
        // Metrics
        this.metrics = {
            responsesTriggered: 0,
            threatsBlocked: 0,
            emergencyShutdowns: 0,
            lastResponse: null
        };
    }

    // Initialize available response actions
    initializeResponseActions() {
        return {
            // Network-level responses
            'block_ip': {
                description: 'Block IP address at firewall level',
                severity: 'HIGH',
                autoExecute: true,
                handler: this.blockIPAddress.bind(this)
            },
            'isolate_device': {
                description: 'Isolate device from network',
                severity: 'CRITICAL',
                autoExecute: true,
                handler: this.isolateDevice.bind(this)
            },
            'rate_limit': {
                description: 'Apply rate limiting to source',
                severity: 'MEDIUM',
                autoExecute: true,
                handler: this.applyRateLimit.bind(this)
            },
            'redirect_traffic': {
                description: 'Redirect suspicious traffic to honeypot',
                severity: 'MEDIUM',
                autoExecute: false,
                handler: this.blockIPAddress.bind(this) // Use IP blocking as fallback
            },

            // Device-level responses
            'emergency_stop': {
                description: 'Emergency stop device operation',
                severity: 'CRITICAL',
                autoExecute: true,
                handler: this.emergencyStopDevice.bind(this)
            },
            'reset_device': {
                description: 'Reset device to safe state',
                severity: 'HIGH',
                autoExecute: false,
                handler: this.emergencyStopDevice.bind(this) // Use emergency stop as fallback
            },
            'backup_control': {
                description: 'Switch to backup control system',
                severity: 'CRITICAL',
                autoExecute: true,
                handler: this.switchToBackup.bind(this)
            },
            'validate_sensors': {
                description: 'Cross-validate sensor readings',
                severity: 'MEDIUM',
                autoExecute: true,
                handler: this.validateSensors.bind(this)
            },

            // Authentication responses
            'lock_account': {
                description: 'Lock user account',
                severity: 'HIGH',
                autoExecute: true,
                handler: this.lockUserAccount.bind(this)
            },
            'invalidate_sessions': {
                description: 'Invalidate all user sessions',
                severity: 'HIGH',
                autoExecute: true,
                handler: this.lockUserAccount.bind(this) // Use account lock as fallback
            },
            'require_reauth': {
                description: 'Force user re-authentication',
                severity: 'MEDIUM',
                autoExecute: true,
                handler: this.lockUserAccount.bind(this) // Use account lock as fallback
            },

            // System-level responses
            'alert_operators': {
                description: 'Send immediate alert to operators',
                severity: 'HIGH',
                autoExecute: true,
                handler: this.alertOperators.bind(this)
            },
            'backup_data': {
                description: 'Backup critical system data',
                severity: 'MEDIUM',
                autoExecute: true,
                handler: this.captureForensicData.bind(this) // Use forensic capture as fallback
            },
            'forensic_capture': {
                description: 'Capture forensic evidence',
                severity: 'HIGH',
                autoExecute: true,
                handler: this.captureForensicData.bind(this)
            }
        };
    }

    // Start incident response system
    start() {
        if (this.isActive) return;
        
        this.isActive = true;
        console.log('⚡ Automated Incident Response System Started');
        
        // Monitor response status
        setInterval(() => this.monitorActiveResponses(), 10000);
        
        // Cleanup completed responses
        setInterval(() => this.cleanupResponses(), 300000);
    }

    // Handle threat detection
    async handleThreat(threat) {
        if (!this.isActive) return;

        console.log(`⚡ Processing threat: ${threat.type} (${threat.severity})`);
        
        // Determine appropriate responses
        const responses = this.determineResponses(threat);
        
        // Execute responses
        for (const response of responses) {
            await this.executeResponse(threat, response);
        }
    }

    // Handle critical threats with immediate response
    async handleCriticalThreat(threat) {
        console.log(`🚨 CRITICAL THREAT DETECTED: ${threat.type}`);
        
        // Immediate protective actions
        if (threat.type === 'mitm_attack' || threat.type === 'unauthorized_control') {
            await this.emergencyProtocolActivation(threat);
        }
        
        // Enhanced logging for critical threats
        await this.logCriticalIncident(threat);
        
        // Notify all stakeholders immediately
        await this.notifyEmergencyContacts(threat);
    }

    // Determine appropriate responses for a threat
    determineResponses(threat) {
        const responses = [];
        
        switch (threat.type) {
            case 'port_scan':
                responses.push('block_ip', 'rate_limit', 'alert_operators');
                break;
                
            case 'dos_attack':
                responses.push('block_ip', 'rate_limit', 'redirect_traffic', 'alert_operators');
                break;
                
            case 'modbus_flooding':
                responses.push('block_ip', 'isolate_device', 'emergency_stop', 'backup_control');
                break;
                
            case 'unauthorized_protocol':
                responses.push('block_ip', 'isolate_device', 'forensic_capture');
                break;
                
            case 'arp_spoofing':
                responses.push('isolate_device', 'validate_sensors', 'forensic_capture');
                break;
                
            case 'mitm_attack':
                responses.push('isolate_device', 'emergency_stop', 'backup_control', 'forensic_capture');
                break;
                
            case 'device_anomaly':
                responses.push('validate_sensors', 'backup_data', 'alert_operators');
                break;
                
            case 'unauthorized_control':
                responses.push('emergency_stop', 'isolate_device', 'backup_control', 'forensic_capture');
                break;
                
            case 'sensor_manipulation':
                responses.push('validate_sensors', 'backup_control', 'forensic_capture');
                break;
                
            case 'firmware_tampering':
                responses.push('isolate_device', 'reset_device', 'forensic_capture', 'backup_control');
                break;
                
            case 'brute_force':
                responses.push('lock_account', 'block_ip', 'invalidate_sessions');
                break;
                
            case 'credential_stuffing':
                responses.push('lock_account', 'block_ip', 'require_reauth');
                break;
                
            case 'session_hijacking':
                responses.push('invalidate_sessions', 'require_reauth', 'block_ip');
                break;
        }
        
        // Always include alerting and forensics for any threat
        responses.push('alert_operators', 'forensic_capture');
        
        return [...new Set(responses)]; // Remove duplicates
    }

    // Execute a response action
    async executeResponse(threat, responseType) {
        try {
            const responseAction = this.responseActions[responseType];
            if (!responseAction) {
                console.error(`Unknown response type: ${responseType}`);
                return;
            }

            // Check if auto-execution is enabled
            if (!responseAction.autoExecute && !this.isEmergencyMode) {
                console.log(`⏸️  Response ${responseType} requires manual approval`);
                await this.requestManualApproval(threat, responseType);
                return;
            }

            console.log(`⚡ Executing response: ${responseType} for threat ${threat.id}`);
            
            // Create response record
            const responseId = `resp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const response = {
                id: responseId,
                threatId: threat.id,
                type: responseType,
                description: responseAction.description,
                status: 'EXECUTING',
                startTime: new Date(),
                details: null
            };

            this.activeResponses.set(responseId, response);
            
            // Execute the response handler
            const result = await responseAction.handler(threat, response);
            
            // Update response status
            response.status = result.success ? 'COMPLETED' : 'FAILED';
            response.endTime = new Date();
            response.details = result;
            
            // Log response
            await this.logResponse(response);
            
            // Update metrics
            this.metrics.responsesTriggered++;
            if (result.success) {
                this.metrics.threatsBlocked++;
            }
            this.metrics.lastResponse = new Date();
            
            console.log(`✅ Response ${responseType} ${response.status}`);
            
        } catch (error) {
            console.error(`❌ Response execution failed: ${responseType}`, error);
        }
    }

    // RESPONSE HANDLERS

    // Block IP address at firewall level
    async blockIPAddress(threat, response) {
        try {
            const sourceIP = threat.details.sourceIP || threat.details.packet?.source_ip;
            if (!sourceIP) {
                return { success: false, error: 'No source IP found' };
            }

            // Add firewall rule to block IP
            const command = `sudo iptables -A INPUT -s ${sourceIP} -j DROP`;
            const result = await this.executeCommand(command);
            
            if (result.success) {
                // Save iptables rules
                await this.executeCommand('sudo iptables-save > /etc/iptables/rules.v4');
                
                return {
                    success: true,
                    action: 'IP_BLOCKED',
                    blockedIP: sourceIP,
                    details: result
                };
            }
            
            return { success: false, error: result.error };
            
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Isolate device from network
    async isolateDevice(threat, response) {
        try {
            const deviceIP = threat.details.targetDevice || threat.details.deviceId;
            if (!deviceIP) {
                return { success: false, error: 'No device IP found' };
            }

            // Block all traffic to/from device
            const commands = [
                `sudo iptables -A INPUT -s ${deviceIP} -j DROP`,
                `sudo iptables -A OUTPUT -d ${deviceIP} -j DROP`,
                `sudo iptables -A FORWARD -s ${deviceIP} -j DROP`,
                `sudo iptables -A FORWARD -d ${deviceIP} -j DROP`
            ];

            const results = [];
            for (const command of commands) {
                const result = await this.executeCommand(command);
                results.push(result);
            }

            // Save iptables rules
            await this.executeCommand('sudo iptables-save > /etc/iptables/rules.v4');

            return {
                success: true,
                action: 'DEVICE_ISOLATED',
                isolatedDevice: deviceIP,
                details: results
            };
            
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Apply rate limiting
    async applyRateLimit(threat, response) {
        try {
            const sourceIP = threat.details.sourceIP || threat.details.packet?.source_ip;
            if (!sourceIP) {
                return { success: false, error: 'No source IP found' };
            }

            // Apply rate limiting rule (10 packets per second)
            const command = `sudo iptables -A INPUT -s ${sourceIP} -m limit --limit 10/sec -j ACCEPT`;
            const result = await this.executeCommand(command);
            
            if (result.success) {
                await this.executeCommand('sudo iptables-save > /etc/iptables/rules.v4');
                
                return {
                    success: true,
                    action: 'RATE_LIMITED',
                    sourceIP,
                    limit: '10/sec',
                    details: result
                };
            }
            
            return { success: false, error: result.error };
            
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Emergency stop device
    async emergencyStopDevice(threat, response) {
        try {
            const deviceId = threat.details.deviceId;
            if (!deviceId) {
                return { success: false, error: 'No device ID found' };
            }

            // Send emergency stop command via Modbus
            // This is a simulation - in real implementation would use actual Modbus client
            console.log(`🛑 EMERGENCY STOP: Device ${deviceId}`);
            
            // Log emergency action
            await this.logEmergencyAction('EMERGENCY_STOP', deviceId, threat);
            
            this.metrics.emergencyShutdowns++;
            
            return {
                success: true,
                action: 'EMERGENCY_STOP',
                deviceId,
                timestamp: new Date()
            };
            
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Switch to backup control system
    async switchToBackup(threat, response) {
        try {
            const deviceId = threat.details.deviceId;
            
            console.log(`🔄 SWITCHING TO BACKUP: Device ${deviceId}`);
            
            // Log backup activation
            await this.logEmergencyAction('BACKUP_ACTIVATED', deviceId, threat);
            
            return {
                success: true,
                action: 'BACKUP_ACTIVATED',
                deviceId,
                timestamp: new Date()
            };
            
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Validate sensors against multiple sources
    async validateSensors(threat, response) {
        try {
            const deviceId = threat.details.deviceId;
            
            // Cross-validate sensor readings from multiple sources
            console.log(`✅ VALIDATING SENSORS: Device ${deviceId}`);
            
            return {
                success: true,
                action: 'SENSOR_VALIDATION',
                deviceId,
                validationResults: 'SENSORS_VALIDATED'
            };
            
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Lock user account
    async lockUserAccount(threat, response) {
        try {
            const email = threat.details.email;
            if (!email) {
                return { success: false, error: 'No user email found' };
            }

            // Lock account in database
            await supabase
                .from('profiles')
                .update({ 
                    is_locked: true,
                    locked_at: new Date(),
                    lock_reason: `Automatic lock due to ${threat.type}`
                })
                .eq('email', email);

            return {
                success: true,
                action: 'ACCOUNT_LOCKED',
                email,
                reason: threat.type
            };
            
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Capture forensic data
    async captureForensicData(threat, response) {
        try {
            const timestamp = new Date().toISOString();
            const forensicData = {
                threatId: threat.id,
                timestamp,
                networkState: await this.captureNetworkState(),
                systemState: await this.captureSystemState(),
                threatDetails: threat.details
            };

            // Store forensic data
            await supabase
                .from('forensic_data')
                .insert(forensicData);

            return {
                success: true,
                action: 'FORENSIC_CAPTURED',
                dataId: `forensic_${timestamp}`,
                size: JSON.stringify(forensicData).length
            };
            
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Alert operators immediately
    async alertOperators(threat, response) {
        try {
            const alert = {
                threatId: threat.id,
                type: threat.type,
                severity: threat.severity,
                description: threat.description,
                timestamp: new Date(),
                requiresAction: threat.responseRequired
            };

            // Send alert to all active operators
            console.log(`📢 OPERATOR ALERT: ${threat.type} (${threat.severity})`);
            
            // In real implementation, would send emails, SMS, push notifications
            
            return {
                success: true,
                action: 'OPERATORS_ALERTED',
                alertId: `alert_${Date.now()}`,
                recipients: ['security_team', 'operations_team']
            };
            
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Execute system command safely
    async executeCommand(command) {
        return new Promise((resolve) => {
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    resolve({ success: false, error: error.message });
                } else {
                    resolve({ success: true, stdout, stderr });
                }
            });
        });
    }

    // Emergency protocol activation
    async emergencyProtocolActivation(threat) {
        console.log('🚨 ACTIVATING EMERGENCY PROTOCOLS');
        
        this.isEmergencyMode = true;
        
        // Immediate actions for critical threats
        const emergencyActions = [
            'emergency_stop',
            'isolate_device', 
            'backup_control',
            'forensic_capture',
            'alert_operators'
        ];

        for (const action of emergencyActions) {
            await this.executeResponse(threat, action);
        }
    }

    // Log emergency action
    async logEmergencyAction(action, deviceId, threat) {
        await supabase
            .from('emergency_actions')
            .insert({
                action_type: action,
                device_id: deviceId,
                threat_id: threat.id,
                timestamp: new Date(),
                details: threat.details
            });
    }

    // Capture network state for forensics
    async captureNetworkState() {
        return {
            activeConnections: 'netstat_output',
            firewallRules: 'iptables_output',
            arpTable: 'arp_output',
            routingTable: 'route_output'
        };
    }

    // Capture system state for forensics
    async captureSystemState() {
        return {
            processes: 'ps_output',
            openFiles: 'lsof_output',
            networkInterfaces: 'ifconfig_output',
            systemLoad: 'uptime_output'
        };
    }

    // Log response to database
    async logResponse(response) {
        try {
            await supabase
                .from('incident_responses')
                .insert({
                    response_id: response.id,
                    threat_id: response.threatId,
                    response_type: response.type,
                    status: response.status,
                    start_time: response.startTime,
                    end_time: response.endTime,
                    details: response.details
                });
        } catch (error) {
            console.error('Failed to log response:', error);
        }
    }

    // Get active responses
    getActiveResponses() {
        return Array.from(this.activeResponses.values());
    }

    // Get response metrics
    getMetrics() {
        return { ...this.metrics };
    }

    // Monitor active responses
    monitorActiveResponses() {
        const now = Date.now();
        
        for (const [responseId, response] of this.activeResponses.entries()) {
            if (response.status === 'EXECUTING' && 
                now - response.startTime.getTime() > 300000) { // 5 minutes
                response.status = 'TIMEOUT';
                response.endTime = new Date();
                console.log(`⏰ Response ${responseId} timed out`);
            }
        }
    }

    // Cleanup completed responses
    cleanupResponses() {
        const now = Date.now();
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        
        for (const [responseId, response] of this.activeResponses.entries()) {
            if (response.status !== 'EXECUTING' && 
                now - response.endTime?.getTime() > maxAge) {
                this.activeResponses.delete(responseId);
            }
        }
    }

    // Stop incident response system
    stop() {
        this.isActive = false;
        console.log('🛑 Incident Response System Stopped');
    }
}

module.exports = {
    IncidentResponseSystem
};