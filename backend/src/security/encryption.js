const crypto = require('crypto');
const forge = require('node-forge');
const fs = require('fs');
const path = require('path');

// =======================
// ENCRYPTION SERVICE
// =======================

class EncryptionService {
    constructor() {
        this.algorithm = 'aes-256-gcm';
        this.keyLength = 32; // 256 bits
        this.ivLength = 16;  // 128 bits
        this.tagLength = 16; // 128 bits
        this.masterKey = this.loadOrGenerateMasterKey();
        
        // Initialize certificate store
        this.initializeCertificates();
    }

    // Load or generate master encryption key
    loadOrGenerateMasterKey() {
        const keyFile = path.join(__dirname, '..', '..', 'keys', 'master.key');
        
        try {
            if (fs.existsSync(keyFile)) {
                return fs.readFileSync(keyFile);
            }
        } catch (error) {
            console.log('Master key not found, generating new one...');
        }

        // Generate new master key
        const masterKey = crypto.randomBytes(this.keyLength);
        
        // Create keys directory if it doesn't exist
        const keysDir = path.dirname(keyFile);
        if (!fs.existsSync(keysDir)) {
            fs.mkdirSync(keysDir, { recursive: true, mode: 0o700 });
        }

        // Save master key securely (600 permissions)
        fs.writeFileSync(keyFile, masterKey, { mode: 0o600 });
        console.log('✅ Master encryption key generated and saved');
        
        return masterKey;
    }

    // Derive key from master key using PBKDF2
    deriveKey(salt, info = 'HackSkyICS-AES-Key') {
        return crypto.pbkdf2Sync(this.masterKey, salt, 100000, this.keyLength, 'sha512');
    }

    // Encrypt data with AES-256-GCM
    encryptData(plaintext, context = 'general') {
        try {
            const salt = crypto.randomBytes(16);
            const iv = crypto.randomBytes(this.ivLength);
            const key = this.deriveKey(salt, context);
            
            const cipher = crypto.createCipher(this.algorithm, key);
            cipher.setAAD(Buffer.from(context, 'utf8'));
            
            let encrypted = cipher.update(plaintext, 'utf8');
            encrypted = Buffer.concat([encrypted, cipher.final()]);
            
            const authTag = cipher.getAuthTag();
            
            // Combine salt + iv + authTag + encrypted data
            const result = Buffer.concat([salt, iv, authTag, encrypted]);
            
            return {
                encrypted: result.toString('base64'),
                context: context,
                timestamp: Date.now()
            };
        } catch (error) {
            throw new Error(`Encryption failed: ${error.message}`);
        }
    }

    // Decrypt data with AES-256-GCM
    decryptData(encryptedData, context = 'general') {
        try {
            const buffer = Buffer.from(encryptedData.encrypted, 'base64');
            
            const salt = buffer.slice(0, 16);
            const iv = buffer.slice(16, 16 + this.ivLength);
            const authTag = buffer.slice(16 + this.ivLength, 16 + this.ivLength + this.tagLength);
            const encrypted = buffer.slice(16 + this.ivLength + this.tagLength);
            
            const key = this.deriveKey(salt, context);
            
            const decipher = crypto.createDecipher(this.algorithm, key);
            decipher.setAuthTag(authTag);
            decipher.setAAD(Buffer.from(context, 'utf8'));
            
            let decrypted = decipher.update(encrypted);
            decrypted = Buffer.concat([decrypted, decipher.final()]);
            
            return decrypted.toString('utf8');
        } catch (error) {
            throw new Error(`Decryption failed: ${error.message}`);
        }
    }

    // Initialize PKI certificates for secure communications
    initializeCertificates() {
        const certDir = path.join(__dirname, '..', '..', 'certificates');
        if (!fs.existsSync(certDir)) {
            fs.mkdirSync(certDir, { recursive: true, mode: 0o700 });
        }

        this.generateCAIfNeeded(certDir);
        this.generateServerCertIfNeeded(certDir);
        this.generateClientCertsIfNeeded(certDir);
    }

    // Generate Certificate Authority
    generateCAIfNeeded(certDir) {
        const caKeyFile = path.join(certDir, 'ca-private.pem');
        const caCertFile = path.join(certDir, 'ca-cert.pem');

        if (fs.existsSync(caKeyFile) && fs.existsSync(caCertFile)) {
            return; // CA already exists
        }

        console.log('🔑 Generating Certificate Authority...');

        // Generate CA private key
        const caKeys = forge.pki.rsa.generateKeyPair(4096);
        
        // Create CA certificate
        const caCert = forge.pki.createCertificate();
        caCert.publicKey = caKeys.publicKey;
        caCert.serialNumber = '01';
        caCert.validity.notBefore = new Date();
        caCert.validity.notAfter = new Date();
        caCert.validity.notAfter.setFullYear(caCert.validity.notBefore.getFullYear() + 10);

        const caAttrs = [{
            name: 'countryName',
            value: 'US'
        }, {
            name: 'organizationName',
            value: 'HackSkyICS Security'
        }, {
            name: 'organizationalUnitName',
            value: 'Industrial Control Systems'
        }, {
            name: 'commonName',
            value: 'HackSkyICS Root CA'
        }];

        caCert.setSubject(caAttrs);
        caCert.setIssuer(caAttrs);
        caCert.setExtensions([{
            name: 'basicConstraints',
            cA: true
        }, {
            name: 'keyUsage',
            keyCertSign: true,
            cRLSign: true
        }]);

        // Self-sign CA certificate
        caCert.sign(caKeys.privateKey, forge.md.sha256.create());

        // Save CA files
        fs.writeFileSync(caKeyFile, forge.pki.privateKeyToPem(caKeys.privateKey), { mode: 0o600 });
        fs.writeFileSync(caCertFile, forge.pki.certificateToPem(caCert), { mode: 0o644 });

        console.log('✅ Certificate Authority generated');
        this.caKeys = caKeys;
        this.caCert = caCert;
    }

    // Generate server certificate for TLS
    generateServerCertIfNeeded(certDir) {
        const serverKeyFile = path.join(certDir, 'server-private.pem');
        const serverCertFile = path.join(certDir, 'server-cert.pem');

        if (fs.existsSync(serverKeyFile) && fs.existsSync(serverCertFile)) {
            return; // Server cert already exists
        }

        console.log('🔑 Generating Server Certificate...');

        // Load CA if not already loaded
        if (!this.caKeys) {
            const caKeyPem = fs.readFileSync(path.join(certDir, 'ca-private.pem'), 'utf8');
            const caCertPem = fs.readFileSync(path.join(certDir, 'ca-cert.pem'), 'utf8');
            this.caKeys = { privateKey: forge.pki.privateKeyFromPem(caKeyPem) };
            this.caCert = forge.pki.certificateFromPem(caCertPem);
        }

        // Generate server private key
        const serverKeys = forge.pki.rsa.generateKeyPair(2048);

        // Create server certificate
        const serverCert = forge.pki.createCertificate();
        serverCert.publicKey = serverKeys.publicKey;
        serverCert.serialNumber = forge.util.bytesToHex(forge.random.getBytesSync(16));
        serverCert.validity.notBefore = new Date();
        serverCert.validity.notAfter = new Date();
        serverCert.validity.notAfter.setFullYear(serverCert.validity.notBefore.getFullYear() + 2);

        const serverAttrs = [{
            name: 'countryName',
            value: 'US'
        }, {
            name: 'organizationName',
            value: 'HackSkyICS Security'
        }, {
            name: 'organizationalUnitName',
            value: 'Industrial Control Systems'
        }, {
            name: 'commonName',
            value: 'hackskyics.local'
        }];

        serverCert.setSubject(serverAttrs);
        serverCert.setIssuer(this.caCert.subject.attributes);
        serverCert.setExtensions([{
            name: 'basicConstraints',
            cA: false
        }, {
            name: 'keyUsage',
            keyEncipherment: true,
            digitalSignature: true
        }, {
            name: 'extKeyUsage',
            serverAuth: true
        }, {
            name: 'subjectAltName',
            altNames: [{
                type: 2, // DNS
                value: 'hackskyics.local'
            }, {
                type: 2,
                value: 'localhost'
            }, {
                type: 7, // IP
                ip: '127.0.0.1'
            }, {
                type: 7,
                ip: '192.168.100.30'
            }]
        }]);

        // Sign with CA
        serverCert.sign(this.caKeys.privateKey, forge.md.sha256.create());

        // Save server files
        fs.writeFileSync(serverKeyFile, forge.pki.privateKeyToPem(serverKeys.privateKey), { mode: 0o600 });
        fs.writeFileSync(serverCertFile, forge.pki.certificateToPem(serverCert), { mode: 0o644 });

        console.log('✅ Server Certificate generated');
    }

    // Generate client certificates for mutual TLS
    generateClientCertsIfNeeded(certDir) {
        const clients = ['hmi-client', 'plc-client', 'engineer-client'];
        
        clients.forEach(clientName => {
            const clientKeyFile = path.join(certDir, `${clientName}-private.pem`);
            const clientCertFile = path.join(certDir, `${clientName}-cert.pem`);

            if (fs.existsSync(clientKeyFile) && fs.existsSync(clientCertFile)) {
                return; // Client cert already exists
            }

            console.log(`🔑 Generating ${clientName} Certificate...`);

            // Load CA if not already loaded
            if (!this.caKeys) {
                const caKeyPem = fs.readFileSync(path.join(certDir, 'ca-private.pem'), 'utf8');
                const caCertPem = fs.readFileSync(path.join(certDir, 'ca-cert.pem'), 'utf8');
                this.caKeys = { privateKey: forge.pki.privateKeyFromPem(caKeyPem) };
                this.caCert = forge.pki.certificateFromPem(caCertPem);
            }

            // Generate client private key
            const clientKeys = forge.pki.rsa.generateKeyPair(2048);

            // Create client certificate
            const clientCert = forge.pki.createCertificate();
            clientCert.publicKey = clientKeys.publicKey;
            clientCert.serialNumber = forge.util.bytesToHex(forge.random.getBytesSync(16));
            clientCert.validity.notBefore = new Date();
            clientCert.validity.notAfter = new Date();
            clientCert.validity.notAfter.setFullYear(clientCert.validity.notBefore.getFullYear() + 2);

            const clientAttrs = [{
                name: 'countryName',
                value: 'US'
            }, {
                name: 'organizationName',
                value: 'HackSkyICS Security'
            }, {
                name: 'organizationalUnitName',
                value: 'Industrial Control Systems'
            }, {
                name: 'commonName',
                value: clientName
            }];

            clientCert.setSubject(clientAttrs);
            clientCert.setIssuer(this.caCert.subject.attributes);
            clientCert.setExtensions([{
                name: 'basicConstraints',
                cA: false
            }, {
                name: 'keyUsage',
                keyEncipherment: true,
                digitalSignature: true
            }, {
                name: 'extKeyUsage',
                clientAuth: true
            }]);

            // Sign with CA
            clientCert.sign(this.caKeys.privateKey, forge.md.sha256.create());

            // Save client files
            fs.writeFileSync(clientKeyFile, forge.pki.privateKeyToPem(clientKeys.privateKey), { mode: 0o600 });
            fs.writeFileSync(clientCertFile, forge.pki.certificateToPem(clientCert), { mode: 0o644 });
        });

        console.log('✅ Client Certificates generated');
    }

    // Get TLS configuration for Express server
    getTLSConfig() {
        const certDir = path.join(__dirname, '..', '..', 'certificates');
        
        return {
            key: fs.readFileSync(path.join(certDir, 'server-private.pem')),
            cert: fs.readFileSync(path.join(certDir, 'server-cert.pem')),
            ca: fs.readFileSync(path.join(certDir, 'ca-cert.pem')),
            requestCert: true, // Enable mutual TLS
            rejectUnauthorized: true
        };
    }

    // Encrypt sensitive configuration data
    encryptConfig(config) {
        const sensitiveFields = ['password', 'secret', 'key', 'token', 'credential'];
        const encrypted = { ...config };

        for (const [key, value] of Object.entries(config)) {
            if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
                encrypted[key] = this.encryptData(value, 'config');
            }
        }

        return encrypted;
    }

    // Decrypt configuration data
    decryptConfig(encryptedConfig) {
        const decrypted = { ...encryptedConfig };

        for (const [key, value] of Object.entries(encryptedConfig)) {
            if (typeof value === 'object' && value.encrypted) {
                decrypted[key] = this.decryptData(value, 'config');
            }
        }

        return decrypted;
    }
}

// =======================
// SECURE MODBUS IMPLEMENTATION
// =======================

class SecureModbusService {
    constructor(encryptionService) {
        this.encryption = encryptionService;
        this.activeSessions = new Map();
        this.deviceCertificates = new Map();
    }

    // Establish secure Modbus session
    async establishSecureSession(deviceId, clientCert) {
        try {
            // Verify client certificate
            const isValid = await this.verifyDeviceCertificate(deviceId, clientCert);
            if (!isValid) {
                throw new Error('Invalid device certificate');
            }

            // Generate session key
            const sessionKey = crypto.randomBytes(32);
            const sessionId = crypto.randomUUID();

            // Encrypt session key with device's public key
            const encryptedSessionKey = this.encryptWithDeviceKey(deviceId, sessionKey);

            // Store session
            this.activeSessions.set(sessionId, {
                deviceId,
                sessionKey,
                established: new Date(),
                lastUsed: new Date()
            });

            return {
                sessionId,
                encryptedSessionKey,
                timestamp: Date.now()
            };

        } catch (error) {
            throw new Error(`Secure session establishment failed: ${error.message}`);
        }
    }

    // Encrypt Modbus commands
    encryptModbusCommand(sessionId, command) {
        const session = this.activeSessions.get(sessionId);
        if (!session) {
            throw new Error('Invalid session ID');
        }

        // Update last used timestamp
        session.lastUsed = new Date();

        // Create command structure
        const commandData = {
            functionCode: command.functionCode,
            startAddress: command.startAddress,
            quantity: command.quantity || 1,
            values: command.values || [],
            timestamp: Date.now()
        };

        // Encrypt command with session key
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipher('aes-256-cbc', session.sessionKey);
        cipher.setIV(iv);

        let encrypted = cipher.update(JSON.stringify(commandData), 'utf8');
        encrypted = Buffer.concat([encrypted, cipher.final()]);

        return {
            sessionId,
            iv: iv.toString('base64'),
            command: encrypted.toString('base64'),
            hmac: this.generateHMAC(session.sessionKey, encrypted)
        };
    }

    // Decrypt Modbus response
    decryptModbusResponse(sessionId, encryptedResponse) {
        const session = this.activeSessions.get(sessionId);
        if (!session) {
            throw new Error('Invalid session ID');
        }

        try {
            const iv = Buffer.from(encryptedResponse.iv, 'base64');
            const encrypted = Buffer.from(encryptedResponse.response, 'base64');

            // Verify HMAC
            const expectedHmac = this.generateHMAC(session.sessionKey, encrypted);
            if (expectedHmac !== encryptedResponse.hmac) {
                throw new Error('Response integrity check failed');
            }

            // Decrypt response
            const decipher = crypto.createDecipher('aes-256-cbc', session.sessionKey);
            decipher.setIV(iv);

            let decrypted = decipher.update(encrypted);
            decrypted = Buffer.concat([decrypted, decipher.final()]);

            return JSON.parse(decrypted.toString('utf8'));

        } catch (error) {
            throw new Error(`Response decryption failed: ${error.message}`);
        }
    }

    // Generate HMAC for integrity
    generateHMAC(key, data) {
        return crypto.createHmac('sha256', key).update(data).digest('hex');
    }

    // Verify device certificate
    async verifyDeviceCertificate(deviceId, clientCert) {
        // In a real implementation, this would verify against a certificate store
        return this.deviceCertificates.has(deviceId);
    }

    // Encrypt with device's public key
    encryptWithDeviceKey(deviceId, data) {
        // In a real implementation, this would use the device's public key
        return crypto.publicEncrypt(this.getDevicePublicKey(deviceId), data);
    }

    // Get device public key (placeholder)
    getDevicePublicKey(deviceId) {
        // In a real implementation, this would retrieve from certificate store
        return 'placeholder-public-key';
    }
}

module.exports = {
    EncryptionService,
    SecureModbusService
};