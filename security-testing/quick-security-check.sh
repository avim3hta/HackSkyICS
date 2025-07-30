#!/bin/bash
# Quick Security Check Script for HackSkyICS
# Fast validation of key security components

echo "🛡️  HackSkyICS Quick Security Check"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "  ✅ ${GREEN}$2${NC}"
    else
        echo -e "  ❌ ${RED}$2${NC}"
    fi
}

print_info() {
    echo -e "  ℹ️  ${BLUE}$1${NC}"
}

print_warning() {
    echo -e "  ⚠️  ${YELLOW}$1${NC}"
}

# Check 1: Firewall Status
echo -e "\n🔥 ${BLUE}Checking Firewall Status...${NC}"
if command -v ufw >/dev/null 2>&1; then
    ufw_status=$(sudo ufw status | grep "Status: active" | wc -l)
    print_status $((1-ufw_status)) "UFW Firewall: $(sudo ufw status | head -n1)"
else
    print_warning "UFW not installed, checking iptables..."
    iptables_rules=$(sudo iptables -L | wc -l)
    if [ $iptables_rules -gt 10 ]; then
        print_status 0 "Iptables rules active: $iptables_rules rules"
    else
        print_status 1 "No firewall rules detected"
    fi
fi

# Check 2: Service Status
echo -e "\n🚀 ${BLUE}Checking Service Status...${NC}"

# Check if HackSkyICS backend is running
if pgrep -f "node.*server.js" > /dev/null; then
    print_status 0 "HackSkyICS Backend: Running"
    
    # Check if it's listening on secure port
    if netstat -tlnp 2>/dev/null | grep ":3443" > /dev/null; then
        print_status 0 "HTTPS Port 3443: Listening"
    else
        print_status 1 "HTTPS Port 3443: Not listening"
    fi
    
    # Check HTTP port
    if netstat -tlnp 2>/dev/null | grep ":3001" > /dev/null; then
        print_status 0 "HTTP Port 3001: Listening"
    else
        print_status 1 "HTTP Port 3001: Not listening"
    fi
else
    print_status 1 "HackSkyICS Backend: Not running"
fi

# Check security services
services=("fail2ban" "auditd")
for service in "${services[@]}"; do
    if systemctl is-active --quiet $service 2>/dev/null; then
        print_status 0 "$service: Active"
    else
        print_status 1 "$service: Inactive or not installed"
    fi
done

# Check 3: Network Security
echo -e "\n🌐 ${BLUE}Checking Network Security...${NC}"

# Check for open ports
print_info "Scanning for open ports..."
open_ports=$(nmap -sT localhost 2>/dev/null | grep open | wc -l)
print_info "Open ports detected: $open_ports"

# Check specific dangerous ports
dangerous_ports=(21 23 25 53 110 143 445 993 995)
for port in "${dangerous_ports[@]}"; do
    if netstat -tln 2>/dev/null | grep ":$port " > /dev/null; then
        print_warning "Potentially dangerous port $port is open"
    fi
done

# Check 4: SSL/TLS Configuration
echo -e "\n🔒 ${BLUE}Checking SSL/TLS Configuration...${NC}"

# Check if certificates exist
cert_dir="../backend/certificates"
if [ -d "$cert_dir" ]; then
    if [ -f "$cert_dir/server-cert.pem" ] && [ -f "$cert_dir/server-private.pem" ]; then
        print_status 0 "SSL Certificates: Present"
        
        # Check certificate validity
        if openssl x509 -in "$cert_dir/server-cert.pem" -noout -checkend 2592000 2>/dev/null; then
            print_status 0 "SSL Certificate: Valid (>30 days)"
        else
            print_status 1 "SSL Certificate: Expires soon or invalid"
        fi
    else
        print_status 1 "SSL Certificates: Missing"
    fi
else
    print_status 1 "Certificate directory: Not found"
fi

# Test HTTPS connection
if command -v curl >/dev/null 2>&1; then
    print_info "Testing HTTPS connection..."
    if curl -k -s --connect-timeout 5 https://localhost:3443/ > /dev/null 2>&1; then
        print_status 0 "HTTPS Connection: Working"
    else
        print_status 1 "HTTPS Connection: Failed"
    fi
fi

# Check 5: Authentication Security
echo -e "\n🔐 ${BLUE}Checking Authentication Security...${NC}"

# Test if protected endpoints require authentication
if command -v curl >/dev/null 2>&1; then
    print_info "Testing authentication requirements..."
    
    # Test protected endpoint without auth
    response_code=$(curl -k -s -o /dev/null -w "%{http_code}" https://localhost:3443/api/security/status 2>/dev/null)
    if [ "$response_code" = "401" ]; then
        print_status 0 "Authentication Required: Enforced"
    elif [ "$response_code" = "000" ]; then
        print_warning "Cannot connect to test authentication"
    else
        print_status 1 "Authentication Required: Not enforced (got $response_code)"
    fi
fi

# Check 6: Log Security
echo -e "\n📋 ${BLUE}Checking Log Security...${NC}"

# Check if security logs exist
log_locations=(
    "/var/log/hackskyics"
    "/var/log/auth.log"
    "/var/log/syslog"
    "/var/log/audit"
)

for log_dir in "${log_locations[@]}"; do
    if [ -e "$log_dir" ]; then
        print_status 0 "Log location exists: $log_dir"
    else
        print_status 1 "Log location missing: $log_dir"
    fi
done

# Check 7: System Hardening
echo -e "\n🛠️  ${BLUE}Checking System Hardening...${NC}"

# Check for security updates
if command -v apt >/dev/null 2>&1; then
    updates=$(apt list --upgradable 2>/dev/null | grep -c "upgradable")
    if [ "$updates" -eq 0 ]; then
        print_status 0 "System Updates: Up to date"
    else
        print_warning "System Updates: $updates updates available"
    fi
fi

# Check SSH configuration
if [ -f "/etc/ssh/sshd_config" ]; then
    # Check if root login is disabled
    if grep -q "PermitRootLogin no" /etc/ssh/sshd_config; then
        print_status 0 "SSH Root Login: Disabled"
    else
        print_warning "SSH Root Login: Enabled (security risk)"
    fi
    
    # Check if password authentication is disabled
    if grep -q "PasswordAuthentication no" /etc/ssh/sshd_config; then
        print_status 0 "SSH Password Auth: Disabled"
    else
        print_warning "SSH Password Auth: Enabled"
    fi
fi

# Check 8: File Permissions
echo -e "\n📁 ${BLUE}Checking File Permissions...${NC}"

# Check backend directory permissions
backend_dir="../backend"
if [ -d "$backend_dir" ]; then
    # Check if sensitive files have proper permissions
    sensitive_files=(
        "$backend_dir/certificates/server-private.pem"
        "$backend_dir/keys/master.key"
    )
    
    for file in "${sensitive_files[@]}"; do
        if [ -f "$file" ]; then
            perms=$(stat -c "%a" "$file" 2>/dev/null)
            if [ "$perms" = "600" ] || [ "$perms" = "400" ]; then
                print_status 0 "File permissions secure: $(basename $file) ($perms)"
            else
                print_status 1 "File permissions insecure: $(basename $file) ($perms)"
            fi
        fi
    done
fi

# Final Security Score
echo -e "\n🏆 ${BLUE}Security Score Summary${NC}"
echo "=================================="

# Count checks (this is a simplified scoring)
total_checks=20
# In a real implementation, you'd count actual pass/fail results

echo -e "📊 Run detailed security scan: ${GREEN}python3 security-validation-suite.py${NC}"
echo -e "🔍 Monitor threats: ${GREEN}tail -f /var/log/hackskyics/security-monitor.log${NC}"
echo -e "🚨 View IDS alerts: ${GREEN}tail -f /var/log/suricata/eve.json${NC}"
echo -e "📋 Check audit logs: ${GREEN}sudo ausearch -k hackskyics_files${NC}"

echo -e "\n✅ Quick security check complete!"
echo -e "💡 For comprehensive testing, run: ${GREEN}python3 security-validation-suite.py${NC}"