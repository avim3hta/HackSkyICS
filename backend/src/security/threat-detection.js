const EventEmitter = require('events');
const { anomalyService } = require('../routes/ml');
const { supabase } = require('../integrations/supabase');

// =======================
// REAL-TIME THREAT DETECTION ENGINE
// =======================

class ThreatDetectionEngine extends EventEmitter {
    constructor() {
        super();
        this.isActive = false;
        this.threats = new Map();
        this.networkBaselines = new Map();
        this.deviceBaselines = new Map();
        this.securityRules = this.initializeSecurityRules();
        this.failsafeSystem = null; // Will be injected later
        
        // Detection metrics
        this.metrics = {
            threatsDetected: 0,
            falsePositives: 0,
            responsesTriggered: 0,
            lastUpdate: new Date()
        };

        // Start monitoring
        this.startThreatDetection();
    }

    // Inject failsafe system reference
    setFailsafeSystem(failsafeSystem) {
        this.failsafeSystem = failsafeSystem;
        console.log('🔗 Failsafe system linked to threat detection');
    }

    // Initialize security detection rules
    initializeSecurityRules() {
        return {
            // Network-based detections
            'port_scan': {
                description: 'Port scanning activity detected',
                severity: 'HIGH',
                conditions: {
                    uniquePortsPerMinute: 10,
                    timeWindow: 60000 // 1 minute
                }
            },
            'dos_attack': {
                description: 'Denial of Service attack detected',
                severity: 'CRITICAL',
                conditions: {
                    requestsPerSecond: 100,
                    timeWindow: 10000 // 10 seconds
                }
            },
            'modbus_flooding': {
                description: 'Modbus flooding attack detected',
                severity: 'CRITICAL',
                conditions: {
                    modbusRequestsPerSecond: 50,
                    timeWindow: 5000 // 5 seconds
                }
            },
            'unauthorized_protocol': {
                description: 'Unauthorized network protocol detected',
                severity: 'HIGH',
                conditions: {
                    bannedProtocols: ['DNS', 'DHCP', 'SSDP', 'HTTP_EXTERNAL', 'FTP', 'SMB']
                }
            },
            'arp_spoofing': {
                description: 'ARP spoofing attack detected',
                severity: 'HIGH',
                conditions: {
                    duplicateArpResponses: 3,
                    timeWindow: 30000 // 30 seconds
                }
            },
            'mitm_attack': {
                description: 'Man-in-the-Middle attack detected',
                severity: 'CRITICAL',
                conditions: {
                    certificateChanges: true,
                    unexpectedTlsHandshakes: true
                }
            },
            
            // Admin portal compromise detections
            'admin_compromise': {
                description: 'Admin portal compromise detected',
                severity: 'CRITICAL',
                conditions: {
                    failedLoginThreshold: 5,
                    adminSessionHijacking: true,
                    privilegeEscalation: true,
                    automaticFailsafe: true
                }
            },
            'admin_brute_force': {
                description: 'Brute force attack on admin account detected',
                severity: 'CRITICAL',
                conditions: {
                    failedAttemptsPerMinute: 10,
                    timeWindow: 60000,
                    automaticFailsafe: true
                }
            },
            'admin_session_anomaly': {
                description: 'Anomalous admin session activity detected',
                severity: 'HIGH',
                conditions: {
                    unusualLoginTime: true,
                    multipleSimultaneousSessions: true,
                    suspiciousIPAddress: true,
                    automaticFailsafe: true
                }
            },
            'admin_privilege_abuse': {
                description: 'Admin privilege abuse detected',
                severity: 'CRITICAL',
                conditions: {
                    massiveConfigChanges: true,
                    unauthorizedUserCreation: true,
                    systemConfigModification: true,
                    automaticFailsafe: true
                }
            },
            
            // Device-based detections
            'device_anomaly': {
                description: 'Abnormal device behavior detected',
                severity: 'MEDIUM',
                conditions: {
                    anomalyScore: 0.8
                }
            },
            'unauthorized_control': {
                description: 'Unauthorized device control attempt',
                severity: 'CRITICAL',
                conditions: {
                    unauthorizedCommands: true,
                    outsideMaintenanceWindow: true
                }
            },
            'sensor_manipulation': {
                description: 'Sensor data manipulation detected',
                severity: 'HIGH',
                conditions: {
                    physicallyImpossibleValues: true,
                    rapidValueChanges: true
                }
            },
            'firmware_tampering': {
                description: 'Device firmware tampering detected',
                severity: 'CRITICAL',
                conditions: {
                    unexpectedFirmwareChanges: true,
                    invalidDigitalSignatures: true
                }
            },

            // Authentication-based detections
            'brute_force': {
                description: 'Brute force login attack detected',
                severity: 'HIGH',
                conditions: {
                    failedAttemptsPerMinute: 10,
                    timeWindow: 60000
                }
            },
            'credential_stuffing': {
                description: 'Credential stuffing attack detected',
                severity: 'HIGH',
                conditions: {
                    multipleAccountAttempts: 20,
                    timeWindow: 300000 // 5 minutes
                }
            },
            'session_hijacking': {
                description: 'Session hijacking attempt detected',
                severity: 'CRITICAL',
                conditions: {
                    sessionTokenReuse: true,
                    geolocationAnomaly: true
                }
            }
        };
    }

    // Start threat detection monitoring
    startThreatDetection() {
        if (this.isActive) return;
        
        this.isActive = true;
        console.log('🚨 Threat Detection Engine Started');

        // Monitor network traffic
        setInterval(() => this.analyzeNetworkTraffic(), 1000);
        
        // Monitor device behavior
        setInterval(() => this.analyzeDeviceBehavior(), 5000);
        
        // Monitor authentication events
        setInterval(() => this.analyzeNetworkTraffic(), 2000); // Use network analysis as fallback
        
        // Update baselines
        setInterval(() => this.updateBaselines(), 60000);
        
        // Cleanup old threats
        setInterval(() => this.cleanupThreats(), 300000);
    }

    // Analyze network traffic for threats
    async analyzeNetworkTraffic() {
        try {
            // Simulate getting network traffic data
            const networkTraffic = await this.getNetworkTraffic();
            
            for (const packet of networkTraffic) {
                await this.checkPortScanning(packet);
                await this.checkDosAttack(packet);
                await this.checkModbusFlooding(packet);
                await this.checkUnauthorizedProtocols(packet);
                await this.checkArpSpoofing(packet);
                await this.checkMitmAttack(packet);
            }
        } catch (error) {
            console.error('Network traffic analysis error:', error);
        }
    }

    // Check for port scanning
    async checkPortScanning(packet) {
        const sourceIP = packet.source_ip;
        const destPort = packet.dest_port;
        const now = Date.now();
        
        if (!this.networkBaselines.has(sourceIP)) {
            this.networkBaselines.set(sourceIP, {
                ports: new Set(),
                firstSeen: now,
                lastSeen: now
            });
        }

        const baseline = this.networkBaselines.get(sourceIP);
        baseline.ports.add(destPort);
        baseline.lastSeen = now;

        // Check if too many unique ports accessed
        const timeWindow = this.securityRules.port_scan.conditions.timeWindow;
        const uniquePortsThreshold = this.securityRules.port_scan.conditions.uniquePortsPerMinute;

        if (now - baseline.firstSeen < timeWindow && baseline.ports.size > uniquePortsThreshold) {
            await this.createThreat('port_scan', {
                sourceIP,
                uniquePorts: baseline.ports.size,
                timeSpan: now - baseline.firstSeen,
                packet
            });
        }
    }

    // Check for DoS attacks
    async checkDosAttack(packet) {
        const targetIP = packet.dest_ip;
        const now = Date.now();
        const key = `dos_${targetIP}`;
        
        if (!this.networkBaselines.has(key)) {
            this.networkBaselines.set(key, {
                requests: [],
                firstRequest: now
            });
        }

        const baseline = this.networkBaselines.get(key);
        baseline.requests.push(now);

        // Remove old requests outside time window
        const timeWindow = this.securityRules.dos_attack.conditions.timeWindow;
        baseline.requests = baseline.requests.filter(time => now - time < timeWindow);

        // Check request rate
        const requestsPerSecond = baseline.requests.length / (timeWindow / 1000);
        const threshold = this.securityRules.dos_attack.conditions.requestsPerSecond;

        if (requestsPerSecond > threshold) {
            await this.createThreat('dos_attack', {
                targetIP,
                requestsPerSecond: Math.round(requestsPerSecond),
                threshold,
                packet
            });
        }
    }

    // Check for Modbus flooding
    async checkModbusFlooding(packet) {
        if (packet.protocol !== 'MODBUS' || packet.dest_port !== 502) return;

        const targetDevice = packet.dest_ip;
        const now = Date.now();
        const key = `modbus_${targetDevice}`;
        
        if (!this.networkBaselines.has(key)) {
            this.networkBaselines.set(key, {
                requests: [],
                firstRequest: now
            });
        }

        const baseline = this.networkBaselines.get(key);
        baseline.requests.push(now);

        // Remove old requests
        const timeWindow = this.securityRules.modbus_flooding.conditions.timeWindow;
        baseline.requests = baseline.requests.filter(time => now - time < timeWindow);

        // Check Modbus request rate
        const requestsPerSecond = baseline.requests.length / (timeWindow / 1000);
        const threshold = this.securityRules.modbus_flooding.conditions.modbusRequestsPerSecond;

        if (requestsPerSecond > threshold) {
            await this.createThreat('modbus_flooding', {
                targetDevice,
                requestsPerSecond: Math.round(requestsPerSecond),
                threshold,
                packet
            });
        }
    }

    // Check for unauthorized protocols
    async checkUnauthorizedProtocols(packet) {
        const bannedProtocols = this.securityRules.unauthorized_protocol.conditions.bannedProtocols;
        
        if (bannedProtocols.includes(packet.protocol)) {
            await this.createThreat('unauthorized_protocol', {
                protocol: packet.protocol,
                sourceIP: packet.source_ip,
                destIP: packet.dest_ip,
                packet
            });
        }
    }

    // Check for ARP spoofing
    async checkArpSpoofing(packet) {
        if (packet.protocol !== 'ARP') return;

        const sourceMAC = packet.source_mac;
        const sourceIP = packet.source_ip;
        const key = `arp_${sourceIP}`;
        
        if (!this.networkBaselines.has(key)) {
            this.networkBaselines.set(key, {
                knownMAC: sourceMAC,
                macChanges: []
            });
            return;
        }

        const baseline = this.networkBaselines.get(key);
        
        if (baseline.knownMAC !== sourceMAC) {
            baseline.macChanges.push({
                oldMAC: baseline.knownMAC,
                newMAC: sourceMAC,
                timestamp: Date.now()
            });

            // Check for multiple MAC changes (potential spoofing)
            const recentChanges = baseline.macChanges.filter(
                change => Date.now() - change.timestamp < 30000
            );

            if (recentChanges.length >= 3) {
                await this.createThreat('arp_spoofing', {
                    sourceIP,
                    macChanges: recentChanges,
                    packet
                });
            }

            baseline.knownMAC = sourceMAC;
        }
    }

    // Check for MITM attacks
    async checkMitmAttack(packet) {
        // Check for unexpected TLS certificate changes
        if (packet.protocol === 'TLS' && packet.certificate_fingerprint) {
            const serverIP = packet.dest_ip;
            const key = `tls_${serverIP}`;
            
            if (!this.networkBaselines.has(key)) {
                this.networkBaselines.set(key, {
                    knownCertificates: new Set([packet.certificate_fingerprint])
                });
                return;
            }

            const baseline = this.networkBaselines.get(key);
            
            if (!baseline.knownCertificates.has(packet.certificate_fingerprint)) {
                await this.createThreat('mitm_attack', {
                    serverIP,
                    newCertificate: packet.certificate_fingerprint,
                    knownCertificates: Array.from(baseline.knownCertificates),
                    packet
                });
                
                baseline.knownCertificates.add(packet.certificate_fingerprint);
            }
        }
    }

    // Analyze device behavior for anomalies
    async analyzeDeviceBehavior() {
        try {
            const devices = await this.getDeviceStates();
            
            for (const device of devices) {
                await this.checkDeviceAnomalies(device);
                await this.checkUnauthorizedControl(device);
                await this.checkSensorManipulation(device);
                await this.checkFirmwareTampering(device);
            }
        } catch (error) {
            console.error('Device behavior analysis error:', error);
        }
    }

    // Check for device anomalies using ML
    async checkDeviceAnomalies(device) {
        try {
            // Use ML anomaly service to detect abnormal behavior
            const prediction = await anomalyService.predictAnomaly({
                device_id: device.device_id,
                sensor_value: device.current_value,
                facility_type: device.facility_type,
                sensor_name: device.sensor_name,
                criticality: device.criticality
            });

            if (prediction.is_anomaly && prediction.anomaly_score > 0.8) {
                await this.createThreat('device_anomaly', {
                    deviceId: device.device_id,
                    anomalyScore: prediction.anomaly_score,
                    confidence: prediction.confidence,
                    sensorValue: device.current_value,
                    device
                });
            }
        } catch (error) {
            console.error('Device anomaly check error:', error);
        }
    }

    // Check for unauthorized control attempts
    async checkUnauthorizedControl(device) {
        // Check if control commands are being sent outside maintenance windows
        const now = new Date();
        const hour = now.getHours();
        
        // Define maintenance windows (example: 2-6 AM)
        const isMaintenanceWindow = hour >= 2 && hour <= 6;
        
        if (device.recent_commands && device.recent_commands.length > 0 && !isMaintenanceWindow) {
            for (const command of device.recent_commands) {
                if (command.source_authorized === false) {
                    await this.createThreat('unauthorized_control', {
                        deviceId: device.device_id,
                        command,
                        maintenanceWindow: isMaintenanceWindow,
                        device
                    });
                }
            }
        }
    }

    // Check for sensor data manipulation
    async checkSensorManipulation(device) {
        const deviceId = device.device_id;
        const currentValue = device.current_value;
        
        if (!this.deviceBaselines.has(deviceId)) {
            this.deviceBaselines.set(deviceId, {
                values: [currentValue],
                lastValue: currentValue,
                rapidChanges: 0
            });
            return;
        }

        const baseline = this.deviceBaselines.get(deviceId);
        const previousValue = baseline.lastValue;
        
        // Check for physically impossible values
        const isPhysicallyImpossible = this.checkPhysicalLimits(device.sensor_name, currentValue);
        
        // Check for rapid value changes
        const changePercent = Math.abs(currentValue - previousValue) / previousValue;
        const isRapidChange = changePercent > 0.5; // 50% change
        
        if (isRapidChange) {
            baseline.rapidChanges++;
        } else {
            baseline.rapidChanges = Math.max(0, baseline.rapidChanges - 1);
        }

        if (isPhysicallyImpossible || baseline.rapidChanges > 3) {
            await this.createThreat('sensor_manipulation', {
                deviceId,
                currentValue,
                previousValue,
                changePercent,
                isPhysicallyImpossible,
                rapidChanges: baseline.rapidChanges,
                device
            });
        }

        baseline.lastValue = currentValue;
        baseline.values.push(currentValue);
        if (baseline.values.length > 100) {
            baseline.values.shift();
        }
    }

    // Check physical limits for sensor values
    checkPhysicalLimits(sensorType, value) {
        const limits = {
            'temperature': { min: -50, max: 500 },
            'pressure': { min: 0, max: 1000 },
            'flow_rate': { min: 0, max: 10000 },
            'level': { min: 0, max: 100 },
            'ph': { min: 0, max: 14 }
        };

        const limit = limits[sensorType];
        if (!limit) return false;

        return value < limit.min || value > limit.max;
    }

    // Create and store threat
    async createThreat(threatType, details) {
        const threatId = `${threatType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const rule = this.securityRules[threatType];
        
        const threat = {
            id: threatId,
            type: threatType,
            severity: rule.severity,
            description: rule.description,
            details,
            timestamp: new Date(),
            status: 'ACTIVE',
            responseRequired: rule.severity === 'CRITICAL'
        };

        // Store threat
        this.threats.set(threatId, threat);
        
        // Update metrics
        this.metrics.threatsDetected++;
        this.metrics.lastUpdate = new Date();

        // Log to database
        await this.logThreat(threat);
        
        // Emit threat event
        this.emit('threatDetected', threat);
        
        // Trigger automatic response if critical
        if (threat.responseRequired) {
            this.emit('criticalThreat', threat);
        }

        // Check if this threat type should trigger failsafe automatically
        if (this.shouldTriggerFailsafe(threat)) {
            await this.triggerFailsafe(threat);
        }

        console.log(`🚨 THREAT DETECTED: ${threat.type} (${threat.severity}) - ${threat.description}`);
        
        return threat;
    }

    // Log threat to database
    async logThreat(threat) {
        try {
            await supabase
                .from('security_threats')
                .insert({
                    threat_id: threat.id,
                    threat_type: threat.type,
                    severity: threat.severity,
                    description: threat.description,
                    details: threat.details,
                    timestamp: threat.timestamp,
                    status: threat.status
                });
        } catch (error) {
            console.error('Failed to log threat to database:', error);
        }
    }

    // Get current threats
    getActiveThreats() {
        return Array.from(this.threats.values())
            .filter(threat => threat.status === 'ACTIVE')
            .sort((a, b) => b.timestamp - a.timestamp);
    }

    // Get threat metrics
    getMetrics() {
        return { ...this.metrics };
    }

    // Check if threat should trigger failsafe
    shouldTriggerFailsafe(threat) {
        const rule = this.securityRules[threat.type];
        
        // Check if the threat type has automatic failsafe enabled
        if (rule?.conditions?.automaticFailsafe === true) {
            return true;
        }

        // Additional admin compromise patterns
        if (threat.type.includes('admin') || 
            threat.description.toLowerCase().includes('admin portal') ||
            threat.description.toLowerCase().includes('privilege') ||
            threat.type === 'admin_compromise' ||
            threat.type === 'admin_brute_force' ||
            threat.type === 'admin_session_anomaly' ||
            threat.type === 'admin_privilege_abuse') {
            return true;
        }

        // Critical threats with multiple failed admin attempts
        if (threat.severity === 'CRITICAL' && 
            (threat.details?.failedAdminLogins > 3 || 
             threat.details?.adminAccountTargeted === true)) {
            return true;
        }

        return false;
    }

    // Trigger failsafe recovery mode
    async triggerFailsafe(threat) {
        if (!this.failsafeSystem) {
            console.warn('⚠️ Cannot trigger failsafe: System not initialized');
            return;
        }

        console.log(`🚨 TRIGGERING FAILSAFE RECOVERY for threat: ${threat.type}`);
        
        try {
            await this.failsafeSystem.activateFailsafeAuto({
                type: threat.type,
                severity: threat.severity,
                description: threat.description,
                details: threat.details,
                timestamp: threat.timestamp,
                threatId: threat.id
            });
            
            // Update threat to indicate failsafe was triggered
            threat.failsafeTriggered = true;
            threat.failsafeTimestamp = new Date();
            
            console.log(`✅ Failsafe recovery activated for threat ${threat.id}`);
        } catch (error) {
            console.error('Failed to trigger failsafe recovery:', error);
            
            // Log the failure but don't throw - we still want the threat to be processed
            threat.failsafeFailed = true;
            threat.failsafeError = error.message;
        }
    }

    // Enhanced admin compromise detection
    async detectAdminCompromise(authEvents) {
        const adminEvents = authEvents.filter(event => 
            event.user?.role === 'admin' || 
            event.user?.role === 'system_admin' ||
            event.description?.toLowerCase().includes('admin')
        );

        for (const event of adminEvents) {
            // Multiple admin login failures
            if (event.type === 'login_failed' && event.consecutiveFailures >= 3) {
                await this.createThreat('admin_brute_force', {
                    userEmail: event.user?.email,
                    failedAttempts: event.consecutiveFailures,
                    sourceIP: event.sourceIP,
                    timeWindow: event.timeWindow,
                    adminAccountTargeted: true
                });
            }

            // Admin session from suspicious location
            if (event.type === 'admin_login_success' && event.suspiciousLocation) {
                await this.createThreat('admin_session_anomaly', {
                    userEmail: event.user?.email,
                    sourceIP: event.sourceIP,
                    location: event.location,
                    previousLocations: event.previousLocations,
                    suspiciousLocation: true
                });
            }

            // Admin privilege escalation attempts
            if (event.type === 'privilege_escalation' && event.targetRole === 'admin') {
                await this.createThreat('admin_privilege_abuse', {
                    userEmail: event.user?.email,
                    targetRole: event.targetRole,
                    sourceIP: event.sourceIP,
                    unauthorizedEscalation: true
                });
            }

            // Mass configuration changes by admin
            if (event.type === 'config_change' && 
                event.user?.role === 'admin' && 
                event.changesCount > 5) {
                await this.createThreat('admin_privilege_abuse', {
                    userEmail: event.user?.email,
                    changesCount: event.changesCount,
                    configTypes: event.configTypes,
                    massiveConfigChanges: true
                });
            }
        }
    }

    // Simulate getting network traffic data
    async getNetworkTraffic() {
        // In a real implementation, this would connect to network monitoring tools
        return [
            {
                source_ip: '192.168.100.50',
                dest_ip: '192.168.100.11',
                dest_port: 502,
                protocol: 'MODBUS',
                timestamp: Date.now()
            }
        ];
    }

    // Simulate getting device states
    async getDeviceStates() {
        // In a real implementation, this would connect to device monitoring
        return [
            {
                device_id: 'PLC_001',
                facility_type: 'water_treatment',
                sensor_name: 'temperature',
                current_value: 75.5,
                criticality: 'high',
                recent_commands: []
            }
        ];
    }

    // Update baselines periodically
    updateBaselines() {
        // Clear old network baselines
        const now = Date.now();
        for (const [key, baseline] of this.networkBaselines.entries()) {
            if (now - baseline.lastSeen > 3600000) { // 1 hour
                this.networkBaselines.delete(key);
            }
        }
    }

    // Cleanup old threats
    cleanupThreats() {
        const now = Date.now();
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        
        for (const [threatId, threat] of this.threats.entries()) {
            if (now - threat.timestamp.getTime() > maxAge) {
                this.threats.delete(threatId);
            }
        }
    }

    // Stop threat detection
    stop() {
        this.isActive = false;
        console.log('🛑 Threat Detection Engine Stopped');
    }
}

module.exports = {
    ThreatDetectionEngine
};