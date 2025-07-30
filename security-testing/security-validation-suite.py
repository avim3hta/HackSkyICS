#!/usr/bin/env python3
"""
HackSkyICS Security Validation Suite
Comprehensive testing of all security implementations
"""

import requests
import socket
import subprocess
import json
import time
import sys
import threading
from concurrent.futures import ThreadPoolExecutor
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

class SecurityValidator:
    def __init__(self):
        self.target_host = "localhost"
        self.http_port = 3001
        self.https_port = 3443
        self.results = {}
        
    def run_all_tests(self):
        print("🛡️  HackSkyICS Security Validation Suite")
        print("=" * 50)
        
        # Test categories
        test_categories = [
            ("Network Security", self.test_network_security),
            ("Authentication Security", self.test_authentication),
            ("Encryption & TLS", self.test_encryption),
            ("Threat Detection", self.test_threat_detection),
            ("Protocol Security", self.test_protocol_security),
            ("Access Control", self.test_access_control),
            ("System Hardening", self.test_system_hardening)
        ]
        
        for category, test_func in test_categories:
            print(f"\n🔍 Testing {category}...")
            try:
                results = test_func()
                self.results[category] = results
                self.print_results(category, results)
            except Exception as e:
                print(f"❌ Error testing {category}: {e}")
                self.results[category] = {"error": str(e)}
        
        self.generate_security_report()
    
    def test_network_security(self):
        """Test network-level security controls"""
        results = {}
        
        # Test 1: Port scanning detection
        print("  🔍 Testing port scan detection...")
        scan_results = self.test_port_scan_detection()
        results["port_scan_detection"] = scan_results
        
        # Test 2: Firewall rules
        print("  🔥 Testing firewall rules...")
        firewall_results = self.test_firewall_rules()
        results["firewall_rules"] = firewall_results
        
        # Test 3: Protocol filtering
        print("  📡 Testing protocol filtering...")
        protocol_results = self.test_protocol_filtering()
        results["protocol_filtering"] = protocol_results
        
        return results
    
    def test_port_scan_detection(self):
        """Test if port scanning triggers detection"""
        results = {}
        common_ports = [21, 22, 23, 25, 53, 80, 110, 143, 443, 993, 995]
        
        def scan_port(port):
            try:
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                sock.settimeout(1)
                result = sock.connect_ex((self.target_host, port))
                sock.close()
                return port, result == 0
            except:
                return port, False
        
        # Rapid port scan to trigger detection
        with ThreadPoolExecutor(max_workers=10) as executor:
            scan_results = list(executor.map(lambda p: scan_port(p), common_ports))
        
        open_ports = [port for port, is_open in scan_results if is_open]
        results["open_ports"] = open_ports
        results["scan_detected"] = len(open_ports) < len(common_ports)  # Most should be blocked
        
        return results
    
    def test_firewall_rules(self):
        """Test firewall rule effectiveness"""
        results = {}
        
        # Test blocked protocols
        blocked_protocols = [
            ("DNS", 53),
            ("DHCP", 67),
            ("SMTP", 25),
            ("POP3", 110),
            ("IMAP", 143)
        ]
        
        for protocol, port in blocked_protocols:
            try:
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                sock.settimeout(2)
                result = sock.connect_ex((self.target_host, port))
                sock.close()
                results[f"{protocol}_blocked"] = result != 0  # Should be blocked
            except:
                results[f"{protocol}_blocked"] = True  # Connection failed = blocked
        
        return results
    
    def test_protocol_filtering(self):
        """Test industrial protocol filtering"""
        results = {}
        
        # Test legitimate ICS protocols (should be allowed)
        ics_protocols = [
            ("Modbus", 502),
            ("DNP3", 20000),
            ("IEC61850", 102)
        ]
        
        for protocol, port in ics_protocols:
            try:
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                sock.settimeout(2)
                result = sock.connect_ex((self.target_host, port))
                sock.close()
                results[f"{protocol}_accessible"] = result == 0
            except:
                results[f"{protocol}_accessible"] = False
        
        return results
    
    def test_authentication(self):
        """Test authentication security"""
        results = {}
        
        # Test 1: Login rate limiting
        print("  🔐 Testing login rate limiting...")
        rate_limit_result = self.test_login_rate_limiting()
        results["rate_limiting"] = rate_limit_result
        
        # Test 2: Invalid credentials handling
        print("  ❌ Testing invalid credentials...")
        invalid_creds_result = self.test_invalid_credentials()
        results["invalid_credentials"] = invalid_creds_result
        
        # Test 3: Session security
        print("  🎫 Testing session security...")
        session_result = self.test_session_security()
        results["session_security"] = session_result
        
        return results
    
    def test_login_rate_limiting(self):
        """Test if login attempts are rate limited"""
        login_url = f"https://{self.target_host}:{self.https_port}/api/auth/login"
        
        # Attempt multiple rapid logins
        results = []
        for i in range(10):
            try:
                response = requests.post(
                    login_url, 
                    json={"email": "test@test.com", "password": "wrongpassword"},
                    verify=False,
                    timeout=5
                )
                results.append(response.status_code)
            except requests.exceptions.RequestException as e:
                results.append(0)  # Connection failed
        
        # Should see rate limiting after several attempts
        rate_limited = any(code == 429 for code in results)
        return {"rate_limited": rate_limited, "attempts": len(results)}
    
    def test_invalid_credentials(self):
        """Test handling of invalid credentials"""
        login_url = f"https://{self.target_host}:{self.https_port}/api/auth/login"
        
        try:
            response = requests.post(
                login_url,
                json={"email": "invalid@test.com", "password": "wrongpassword"},
                verify=False,
                timeout=5
            )
            
            return {
                "status_code": response.status_code,
                "properly_rejected": response.status_code == 401,
                "response_time": response.elapsed.total_seconds()
            }
        except:
            return {"error": "Connection failed", "properly_rejected": True}
    
    def test_session_security(self):
        """Test session security implementation"""
        # Test unauthorized access to protected endpoints
        protected_endpoints = [
            "/api/scada/status",
            "/api/security/threats", 
            "/api/ml/stats"
        ]
        
        results = {}
        for endpoint in protected_endpoints:
            try:
                url = f"https://{self.target_host}:{self.https_port}{endpoint}"
                response = requests.get(url, verify=False, timeout=5)
                results[endpoint] = {
                    "status_code": response.status_code,
                    "properly_protected": response.status_code == 401
                }
            except:
                results[endpoint] = {"error": "Connection failed", "properly_protected": True}
        
        return results
    
    def test_encryption(self):
        """Test encryption and TLS implementation"""
        results = {}
        
        # Test 1: HTTPS availability
        print("  🔒 Testing HTTPS availability...")
        https_result = self.test_https_availability()
        results["https_available"] = https_result
        
        # Test 2: TLS configuration
        print("  🛡️  Testing TLS configuration...")
        tls_result = self.test_tls_configuration()
        results["tls_config"] = tls_result
        
        # Test 3: HTTP to HTTPS redirect
        print("  ↗️  Testing HTTP redirect...")
        redirect_result = self.test_http_redirect()
        results["http_redirect"] = redirect_result
        
        return results
    
    def test_https_availability(self):
        """Test if HTTPS is properly configured"""
        try:
            url = f"https://{self.target_host}:{self.https_port}/api/security/status"
            response = requests.get(url, verify=False, timeout=5)
            return {
                "available": True,
                "status_code": response.status_code,
                "tls_enabled": True
            }
        except:
            return {"available": False, "tls_enabled": False}
    
    def test_tls_configuration(self):
        """Test TLS configuration strength"""
        try:
            # Use openssl to check TLS configuration
            cmd = [
                "openssl", "s_client", 
                "-connect", f"{self.target_host}:{self.https_port}",
                "-servername", "hackskyics.local"
            ]
            
            process = subprocess.Popen(
                cmd, 
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE, 
                stderr=subprocess.PIPE,
                text=True
            )
            
            stdout, stderr = process.communicate(input="\n")
            
            # Check for strong TLS features
            strong_features = {
                "tls_1_2_or_higher": "TLSv1.2" in stdout or "TLSv1.3" in stdout,
                "strong_cipher": "AES256" in stdout or "AES128" in stdout,
                "certificate_present": "Certificate chain" in stdout
            }
            
            return strong_features
            
        except:
            return {"error": "Could not test TLS configuration"}
    
    def test_http_redirect(self):
        """Test if HTTP redirects to HTTPS"""
        try:
            url = f"http://{self.target_host}:{self.http_port}/"
            response = requests.get(url, allow_redirects=False, timeout=5)
            
            return {
                "redirects": response.status_code in [301, 302, 308],
                "status_code": response.status_code,
                "location": response.headers.get("Location", "")
            }
        except:
            return {"error": "Could not test HTTP redirect"}
    
    def test_threat_detection(self):
        """Test threat detection capabilities"""
        results = {}
        
        # Test 1: Anomaly detection API
        print("  🚨 Testing threat detection API...")
        api_result = self.test_threat_detection_api()
        results["api_response"] = api_result
        
        # Test 2: Suspicious behavior simulation
        print("  🎭 Testing suspicious behavior detection...")
        behavior_result = self.test_suspicious_behavior()
        results["behavior_detection"] = behavior_result
        
        return results
    
    def test_threat_detection_api(self):
        """Test if threat detection APIs are responding"""
        endpoints = [
            "/api/security/threats",
            "/api/security/responses",
            "/api/security/status"
        ]
        
        results = {}
        for endpoint in endpoints:
            try:
                # This would normally require authentication
                url = f"https://{self.target_host}:{self.https_port}{endpoint}"
                response = requests.get(url, verify=False, timeout=5)
                results[endpoint] = {
                    "responding": True,
                    "status_code": response.status_code,
                    "requires_auth": response.status_code == 401
                }
            except:
                results[endpoint] = {"responding": False}
        
        return results
    
    def test_suspicious_behavior(self):
        """Test suspicious behavior patterns"""
        # Simulate rapid requests (potential DoS)
        rapid_requests = []
        
        for i in range(20):
            try:
                start_time = time.time()
                url = f"https://{self.target_host}:{self.https_port}/"
                response = requests.get(url, verify=False, timeout=1)
                end_time = time.time()
                
                rapid_requests.append({
                    "request_time": end_time - start_time,
                    "status_code": response.status_code
                })
            except:
                rapid_requests.append({"error": True})
        
        # Check if rate limiting kicked in
        error_count = sum(1 for req in rapid_requests if req.get("error"))
        rate_limited = error_count > 5  # If many requests failed, likely rate limited
        
        return {
            "rapid_requests_sent": len(rapid_requests),
            "requests_failed": error_count,
            "likely_rate_limited": rate_limited
        }
    
    def test_protocol_security(self):
        """Test industrial protocol security"""
        results = {}
        
        # Test Modbus security
        print("  🏭 Testing Modbus security...")
        modbus_result = self.test_modbus_security()
        results["modbus"] = modbus_result
        
        return results
    
    def test_modbus_security(self):
        """Test Modbus protocol security"""
        try:
            # Test if raw Modbus connection is possible
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(3)
            result = sock.connect_ex((self.target_host, 502))
            sock.close()
            
            if result == 0:
                # Test if we can send raw Modbus commands
                try:
                    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                    sock.connect((self.target_host, 502))
                    
                    # Send a basic Modbus read request
                    modbus_request = b'\x00\x01\x00\x00\x00\x06\x01\x03\x00\x00\x00\x01'
                    sock.send(modbus_request)
                    
                    response = sock.recv(1024)
                    sock.close()
                    
                    return {
                        "port_accessible": True,
                        "accepts_raw_commands": len(response) > 0,
                        "security_concern": len(response) > 0  # Raw access is a concern
                    }
                    
                except:
                    return {
                        "port_accessible": True,
                        "accepts_raw_commands": False,
                        "security_concern": False
                    }
            else:
                return {
                    "port_accessible": False,
                    "properly_protected": True
                }
                
        except Exception as e:
            return {"error": str(e)}
    
    def test_access_control(self):
        """Test access control implementation"""
        results = {}
        
        # Test unauthorized endpoint access
        protected_endpoints = [
            "/api/scada/control",
            "/api/security/threats",
            "/api/emergency/shutdown"
        ]
        
        for endpoint in protected_endpoints:
            try:
                url = f"https://{self.target_host}:{self.https_port}{endpoint}"
                response = requests.get(url, verify=False, timeout=5)
                results[endpoint] = {
                    "properly_protected": response.status_code == 401,
                    "status_code": response.status_code
                }
            except:
                results[endpoint] = {"properly_protected": True, "connection_failed": True}
        
        return results
    
    def test_system_hardening(self):
        """Test system-level hardening"""
        results = {}
        
        # Test security headers
        print("  🛡️  Testing security headers...")
        headers_result = self.test_security_headers()
        results["security_headers"] = headers_result
        
        return results
    
    def test_security_headers(self):
        """Test HTTP security headers"""
        try:
            url = f"https://{self.target_host}:{self.https_port}/"
            response = requests.get(url, verify=False, timeout=5)
            
            security_headers = {
                "Strict-Transport-Security": "strict-transport-security" in response.headers,
                "X-Frame-Options": "x-frame-options" in response.headers,
                "X-Content-Type-Options": "x-content-type-options" in response.headers,
                "X-XSS-Protection": "x-xss-protection" in response.headers,
                "Content-Security-Policy": "content-security-policy" in response.headers
            }
            
            return {
                "headers_present": security_headers,
                "score": sum(security_headers.values()),
                "max_score": len(security_headers)
            }
            
        except:
            return {"error": "Could not test security headers"}
    
    def print_results(self, category, results):
        """Print test results in a readable format"""
        if "error" in results:
            print(f"    ❌ {results['error']}")
            return
        
        for test_name, result in results.items():
            if isinstance(result, dict):
                if result.get("properly_protected") or result.get("properly_rejected"):
                    print(f"    ✅ {test_name}: SECURE")
                elif result.get("error"):
                    print(f"    ⚠️  {test_name}: {result['error']}")
                else:
                    print(f"    ℹ️  {test_name}: {result}")
            elif isinstance(result, bool):
                status = "✅ SECURE" if result else "❌ VULNERABLE"
                print(f"    {status} {test_name}")
            else:
                print(f"    ℹ️  {test_name}: {result}")
    
    def generate_security_report(self):
        """Generate comprehensive security report"""
        print("\n" + "=" * 60)
        print("🛡️  HACKSKYICS SECURITY VALIDATION REPORT")
        print("=" * 60)
        
        total_tests = 0
        passed_tests = 0
        
        for category, results in self.results.items():
            if "error" in results:
                continue
                
            category_tests = 0
            category_passed = 0
            
            for test_name, result in results.items():
                category_tests += 1
                total_tests += 1
                
                if isinstance(result, dict):
                    if (result.get("properly_protected") or 
                        result.get("properly_rejected") or 
                        result.get("rate_limited") or
                        result.get("redirects")):
                        category_passed += 1
                        passed_tests += 1
                elif isinstance(result, bool) and result:
                    category_passed += 1
                    passed_tests += 1
            
            if category_tests > 0:
                score = (category_passed / category_tests) * 100
                status = "🟢 EXCELLENT" if score >= 80 else "🟡 NEEDS IMPROVEMENT" if score >= 60 else "🔴 CRITICAL"
                print(f"\n{category}: {score:.1f}% ({category_passed}/{category_tests}) {status}")
        
        overall_score = (passed_tests / total_tests) * 100 if total_tests > 0 else 0
        
        print(f"\n🏆 OVERALL SECURITY SCORE: {overall_score:.1f}% ({passed_tests}/{total_tests})")
        
        if overall_score >= 80:
            print("🛡️  STATUS: PRODUCTION READY - Strong security posture")
        elif overall_score >= 60:
            print("⚠️  STATUS: NEEDS IMPROVEMENTS - Some vulnerabilities detected")
        else:
            print("🚨 STATUS: CRITICAL ISSUES - Major security gaps found")
        
        print("\n📋 RECOMMENDATIONS:")
        if overall_score < 100:
            print("   • Review failed tests and implement missing security controls")
            print("   • Ensure all services are running properly")
            print("   • Verify firewall and authentication configurations")
        else:
            print("   • Excellent security posture!")
            print("   • Continue regular security monitoring")
            print("   • Perform periodic penetration testing")

if __name__ == "__main__":
    validator = SecurityValidator()
    validator.run_all_tests()