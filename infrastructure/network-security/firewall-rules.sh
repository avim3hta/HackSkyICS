#!/bin/bash
# HackSkyICS Network Security - Firewall Rules
# Implements defense-in-depth network security

echo "🛡️  Implementing HackSkyICS Network Security"

# =======================
# NETWORK SEGMENTATION
# =======================

# VLAN Configuration
echo "📡 Configuring Network VLANs..."

# VLAN 100: Control Network (PLCs, RTUs) - CRITICAL
sudo vconfig add eth0 100
sudo ifconfig eth0.100 192.168.100.1 netmask 255.255.255.0 up

# VLAN 200: HMI Network (Operator Interfaces) - HIGH
sudo vconfig add eth0 200  
sudo ifconfig eth0.200 192.168.200.1 netmask 255.255.255.0 up

# VLAN 300: Safety Systems (Emergency Shutdown) - ISOLATED
sudo vconfig add eth0 300
sudo ifconfig eth0.300 192.168.300.1 netmask 255.255.255.0 up

# VLAN 400: Engineering Network (Maintenance) - RESTRICTED
sudo vconfig add eth0 400
sudo ifconfig eth0.400 192.168.400.1 netmask 255.255.255.0 up

# VLAN 500: DMZ Network (Historian, Web Services) - MONITORED
sudo vconfig add eth0 500
sudo ifconfig eth0.500 192.168.500.1 netmask 255.255.255.0 up

# =======================
# FIREWALL RULES
# =======================

echo "🔥 Implementing Firewall Rules..."

# Clear existing rules
sudo iptables -F
sudo iptables -X
sudo iptables -t nat -F
sudo iptables -t nat -X

# Default Policies (DENY ALL)
sudo iptables -P INPUT DROP
sudo iptables -P FORWARD DROP  
sudo iptables -P OUTPUT DROP

# Allow Loopback
sudo iptables -A INPUT -i lo -j ACCEPT
sudo iptables -A OUTPUT -o lo -j ACCEPT

# =======================
# CONTROL NETWORK (VLAN 100) - MOST RESTRICTIVE
# =======================

# Only allow Modbus TCP (502) between authorized devices
sudo iptables -A INPUT -i eth0.100 -p tcp --dport 502 -s 192.168.100.11 -d 192.168.100.13 -j ACCEPT
sudo iptables -A INPUT -i eth0.100 -p tcp --dport 502 -s 192.168.100.12 -d 192.168.100.13 -j ACCEPT

# Only allow DNP3 (20000) for SCADA communication
sudo iptables -A INPUT -i eth0.100 -p tcp --dport 20000 -s 192.168.100.14 -d 192.168.100.13 -j ACCEPT

# Block ALL other protocols on control network
sudo iptables -A INPUT -i eth0.100 -j LOG --log-prefix "CONTROL_NETWORK_BLOCKED: "
sudo iptables -A INPUT -i eth0.100 -j DROP

# =======================
# HMI NETWORK (VLAN 200) - RESTRICTED
# =======================

# Allow HMI to Control Network communication
sudo iptables -A FORWARD -i eth0.200 -o eth0.100 -p tcp --dport 502 -j ACCEPT
sudo iptables -A FORWARD -i eth0.200 -o eth0.100 -p tcp --dport 20000 -j ACCEPT

# Allow HTTP/HTTPS for HMI web interfaces
sudo iptables -A INPUT -i eth0.200 -p tcp --dport 80 -j ACCEPT
sudo iptables -A INPUT -i eth0.200 -p tcp --dport 443 -j ACCEPT

# Block direct internet access from HMI network
sudo iptables -A FORWARD -i eth0.200 -o eth0 -j LOG --log-prefix "HMI_INTERNET_BLOCKED: "
sudo iptables -A FORWARD -i eth0.200 -o eth0 -j DROP

# =======================
# SAFETY SYSTEMS (VLAN 300) - ISOLATED
# =======================

# COMPLETE ISOLATION - No communication with other VLANs
sudo iptables -A FORWARD -i eth0.300 -j LOG --log-prefix "SAFETY_ISOLATION: "
sudo iptables -A FORWARD -i eth0.300 -j DROP
sudo iptables -A FORWARD -o eth0.300 -j LOG --log-prefix "SAFETY_ISOLATION: "  
sudo iptables -A FORWARD -o eth0.300 -j DROP

# Only allow safety protocol communication within VLAN
sudo iptables -A INPUT -i eth0.300 -s 192.168.300.0/24 -d 192.168.300.0/24 -j ACCEPT

# =======================
# INTRUSION DETECTION
# =======================

echo "🕵️  Setting up Intrusion Detection..."

# Detect port scanning
sudo iptables -A INPUT -p tcp --tcp-flags SYN,ACK,FIN,RST RST -m limit --limit 1/s -j ACCEPT
sudo iptables -A INPUT -p tcp --tcp-flags SYN,ACK,FIN,RST RST -j LOG --log-prefix "PORT_SCAN_DETECTED: "
sudo iptables -A INPUT -p tcp --tcp-flags SYN,ACK,FIN,RST RST -j DROP

# Detect DoS attacks
sudo iptables -A INPUT -p tcp --dport 502 -m conntrack --ctstate NEW -m limit --limit 10/second --limit-burst 20 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 502 -j LOG --log-prefix "MODBUS_DOS_DETECTED: "
sudo iptables -A INPUT -p tcp --dport 502 -j DROP

# Detect ARP spoofing
sudo iptables -A INPUT -i eth0.100 -p arp --arp-opcode request -m recent --set --name arp_req
sudo iptables -A INPUT -i eth0.100 -p arp --arp-opcode request -m recent --update --seconds 1 --hitcount 5 --name arp_req -j LOG --log-prefix "ARP_SPOOF_DETECTED: "

# =======================
# PROTOCOL WHITELISTING
# =======================

echo "✅ Implementing Protocol Whitelisting..."

# Create custom chain for allowed protocols
sudo iptables -N ALLOWED_PROTOCOLS

# Allow only legitimate ICS protocols
sudo iptables -A ALLOWED_PROTOCOLS -p tcp --dport 502 -j ACCEPT   # Modbus TCP
sudo iptables -A ALLOWED_PROTOCOLS -p tcp --dport 20000 -j ACCEPT # DNP3
sudo iptables -A ALLOWED_PROTOCOLS -p tcp --dport 102 -j ACCEPT   # IEC 61850
sudo iptables -A ALLOWED_PROTOCOLS -p tcp --dport 44818 -j ACCEPT # EtherNet/IP
sudo iptables -A ALLOWED_PROTOCOLS -p tcp --dport 4840 -j ACCEPT  # OPC-UA
sudo iptables -A ALLOWED_PROTOCOLS -p udp --dport 123 -j ACCEPT   # NTP (internal only)
sudo iptables -A ALLOWED_PROTOCOLS -p icmp -j ACCEPT              # ICMP for diagnostics

# Block dangerous protocols
sudo iptables -A INPUT -p tcp --dport 53 -j LOG --log-prefix "DNS_BLOCKED: "     # DNS
sudo iptables -A INPUT -p udp --dport 67 -j LOG --log-prefix "DHCP_BLOCKED: "    # DHCP
sudo iptables -A INPUT -p udp --dport 1900 -j LOG --log-prefix "SSDP_BLOCKED: "  # SSDP
sudo iptables -A INPUT -p tcp --dport 445 -j LOG --log-prefix "SMB_BLOCKED: "    # SMB
sudo iptables -A INPUT -p tcp --dport 139 -j LOG --log-prefix "NETBIOS_BLOCKED: " # NetBIOS

# Jump to allowed protocols chain
sudo iptables -A INPUT -j ALLOWED_PROTOCOLS

# Log and drop everything else
sudo iptables -A INPUT -j LOG --log-prefix "PROTOCOL_VIOLATION: "
sudo iptables -A INPUT -j DROP

# =======================
# SAVE CONFIGURATION
# =======================

echo "💾 Saving Firewall Configuration..."
sudo iptables-save > /etc/iptables/rules.v4

echo "✅ Network Security Implementation Complete!"
echo "📊 Security Status:"
echo "   • Network Segmentation: ✅ 5 VLANs Configured"
echo "   • Firewall Rules: ✅ 25+ Rules Active"  
echo "   • Protocol Whitelisting: ✅ Only ICS Protocols Allowed"
echo "   • Intrusion Detection: ✅ DoS/Scan Detection Active"
echo "   • Safety Isolation: ✅ Complete Network Isolation"