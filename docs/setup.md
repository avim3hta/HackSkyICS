# ICS Cybersecurity Platform Setup Guide

## Prerequisites

### Hardware Requirements
- **Primary Machine**: 16GB+ RAM, 8+ CPU cores, 100GB+ free storage
- **Backup Machine**: 8GB+ RAM, 4+ CPU cores (for redundancy)
- **Network**: Isolated virtual network capability

### Software Requirements
- **Virtualization**: VirtualBox 7.0+ or VMware Workstation
- **OS**: Windows 10/11 or Linux with virtualization support
- **Network Tools**: Wireshark, nmap (optional)

## Implementation Timeline

### Phase 1: Infrastructure Setup (Hours 1-6)

#### Step 1: VM Environment Creation
```bash
# Create virtual network: 192.168.100.0/24
# Configure 4 VMs with specific IPs and resources
```

**VM Specifications:**
- **ICS VM** (192.168.100.10): 4GB RAM, 2 CPU, 40GB disk
- **Attack VM** (192.168.100.20): 4GB RAM, 2 CPU, 40GB disk  
- **Defense VM** (192.168.100.30): 6GB RAM, 4 CPU, 50GB disk
- **Display VM** (192.168.100.40): 2GB RAM, 1 CPU, 30GB disk

#### Step 2: Base OS Installation
- **ICS VM**: Ubuntu 20.04 Server (minimal install)
- **Attack VM**: Kali Linux 2023.4
- **Defense VM**: Ubuntu 20.04 Server
- **Display VM**: Ubuntu 20.04 Desktop or Windows 10

### Phase 2: ICS Environment (Hours 7-12)

#### Step 3: OpenPLC Installation
```bash
# On ICS VM (192.168.100.10)
git clone https://github.com/thiagoralves/OpenPLC_v3.git
cd OpenPLC_v3
./install.sh linux
sudo systemctl enable openplc
sudo systemctl start openplc
```

#### Step 4: Industrial Process Configuration
- Configure water treatment plant simulation
- Set up Modbus register mapping
- Install ModbusPal for additional device simulation
- Configure ScadaBR HMI interface

### Phase 3: Defense System (Hours 13-18)

#### Step 5: Detection Engine Deployment
- Deploy Python-based ML detection system
- Configure real-time Modbus monitoring
- Set up network packet capture
- Implement behavioral baseline learning

#### Step 6: Response System Implementation
- Autonomous threat response logic
- Network isolation capabilities
- Process protection mechanisms
- Self-healing and recovery systems

### Phase 4: Attack Tools (Hours 19-24)

#### Step 7: Attack VM Configuration
- Install Metasploit framework
- Configure custom ICS attack tools
- Set up Modbus exploitation scripts
- Prepare attack scenarios

#### Step 8: Demo Interface (Hours 25-32)
- Deploy live operations dashboard
- Configure executive summary panel
- Set up real-time metrics display
- Prepare attack scenario demonstrations

## Network Configuration

### Virtual Network Setup
```
Network: 192.168.100.0/24
Subnet Mask: 255.255.255.0
Gateway: 192.168.100.1

Device IPs:
├── ICS VM: 192.168.100.10
├── Attack VM: 192.168.100.20
├── Defense VM: 192.168.100.30
└── Display VM: 192.168.100.40
```

### Port Configuration
```
ICS VM:
├── 502: Modbus TCP
├── 8080: OpenPLC Web Interface
├── 9600: ScadaBR HMI
└── 22: SSH

Defense VM:
├── 5000: Dashboard Web Interface
├── 5601: Kibana
├── 9200: Elasticsearch
└── 22: SSH

Attack VM:
├── 22: SSH
└── 4444: Metasploit Console
```

## Verification Checklist

### Infrastructure
- [ ] All VMs boot successfully
- [ ] Network connectivity between VMs
- [ ] SSH access to all systems
- [ ] Sufficient disk space available

### ICS Environment
- [ ] OpenPLC running and accessible
- [ ] ModbusPal configured with devices
- [ ] ScadaBR HMI operational
- [ ] Water treatment simulation active

### Defense System
- [ ] Detection engine monitoring traffic
- [ ] ML models trained on baseline data
- [ ] Response system operational
- [ ] Dashboard displaying metrics

### Attack Tools
- [ ] Metasploit framework functional
- [ ] Custom attack scripts ready
- [ ] Attack scenarios prepared
- [ ] Demo scripts rehearsed

## Troubleshooting

### Common Issues
1. **VM Performance**: Reduce RAM allocation if system becomes unstable
2. **Network Issues**: Verify virtual network adapter settings
3. **Service Failures**: Check logs in `/var/log/` for specific errors
4. **Port Conflicts**: Ensure no other services use required ports

### Emergency Procedures
- **Backup Demo**: Pre-recorded video demonstration
- **Alternative Setup**: Simplified single-VM configuration
- **Fallback Tools**: Web-based alternatives for critical components 