#!/bin/bash
# VM Setup Script for ICS Cybersecurity Platform
# This script automates the creation and configuration of all required VMs

set -e  # Exit on any error

# Configuration
NETWORK_NAME="ics_network"
NETWORK_RANGE="192.168.100.0/24"
GATEWAY="192.168.100.1"

# VM Specifications
ICS_VM_NAME="ics_vm"
ICS_VM_IP="192.168.100.10"
ICS_VM_RAM="4096"
ICS_VM_CPU="2"
ICS_VM_DISK="40"

ATTACK_VM_NAME="attack_vm"
ATTACK_VM_IP="192.168.100.20"
ATTACK_VM_RAM="4096"
ATTACK_VM_CPU="2"
ATTACK_VM_DISK="40"

DEFENSE_VM_NAME="defense_vm"
DEFENSE_VM_IP="192.168.100.30"
DEFENSE_VM_RAM="6144"
DEFENSE_VM_CPU="4"
DEFENSE_VM_DISK="50"

DISPLAY_VM_NAME="display_vm"
DISPLAY_VM_IP="192.168.100.40"
DISPLAY_VM_RAM="2048"
DISPLAY_VM_CPU="1"
DISPLAY_VM_DISK="30"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root"
    fi
}

# Check virtualization support
check_virtualization() {
    log "Checking virtualization support..."
    
    if command -v vboxmanage &> /dev/null; then
        VIRT_TYPE="virtualbox"
        log "VirtualBox detected"
    elif command -v vmrun &> /dev/null; then
        VIRT_TYPE="vmware"
        log "VMware detected"
    else
        error "No virtualization software detected. Please install VirtualBox or VMware."
    fi
}

# Create virtual network
create_network() {
    log "Creating virtual network..."
    
    if [[ $VIRT_TYPE == "virtualbox" ]]; then
        # Check if network already exists
        if ! vboxmanage list hostonlyifs | grep -q $NETWORK_NAME; then
            vboxmanage hostonlyif create
            vboxmanage hostonlyif ipconfig $NETWORK_NAME --ip $GATEWAY --netmask 255.255.255.0
            log "Virtual network created: $NETWORK_NAME"
        else
            log "Virtual network already exists: $NETWORK_NAME"
        fi
    elif [[ $VIRT_TYPE == "vmware" ]]; then
        # VMware network configuration
        warning "VMware network configuration requires manual setup"
        info "Please create a VMnet with IP range: $NETWORK_RANGE"
    fi
}

# Create VM function
create_vm() {
    local vm_name=$1
    local vm_ram=$2
    local vm_cpu=$3
    local vm_disk=$4
    local vm_os=$5
    
    log "Creating VM: $vm_name"
    
    if [[ $VIRT_TYPE == "virtualbox" ]]; then
        # Create VM
        vboxmanage createvm --name "$vm_name" --ostype "$vm_os" --register
        
        # Set memory and CPU
        vboxmanage modifyvm "$vm_name" --memory $vm_ram --cpus $vm_cpu
        
        # Create virtual disk
        vboxmanage createhd --filename "$vm_name.vdi" --size $((vm_disk * 1024))
        vboxmanage storagectl "$vm_name" --name "SATA Controller" --add sata --controller IntelAhci
        vboxmanage storageattach "$vm_name" --storagectl "SATA Controller" --port 0 --device 0 --type hdd --medium "$vm_name.vdi"
        
        # Configure network
        vboxmanage modifyvm "$vm_name" --nic1 hostonly --hostonlyadapter1 $NETWORK_NAME
        
        # Enable clipboard and drag-and-drop
        vboxmanage modifyvm "$vm_name" --clipboard bidirectional --draganddrop bidirectional
        
        log "VM created successfully: $vm_name"
        
    elif [[ $VIRT_TYPE == "vmware" ]]; then
        warning "VMware VM creation requires manual setup"
        info "Please create VM: $vm_name with $vm_ram MB RAM, $vm_cpu CPU cores, $vm_disk GB disk"
    fi
}

# Download OS images
download_images() {
    log "Downloading OS images..."
    
    # Create images directory
    mkdir -p images
    
    # Download Ubuntu Server 20.04
    if [[ ! -f "images/ubuntu-20.04.3-live-server-amd64.iso" ]]; then
        log "Downloading Ubuntu Server 20.04..."
        wget -O images/ubuntu-20.04.3-live-server-amd64.iso \
             "https://releases.ubuntu.com/20.04/ubuntu-20.04.3-live-server-amd64.iso"
    fi
    
    # Download Kali Linux
    if [[ ! -f "images/kali-linux-2023.4-installer-amd64.iso" ]]; then
        log "Downloading Kali Linux 2023.4..."
        wget -O images/kali-linux-2023.4-installer-amd64.iso \
             "https://cdimage.kali.org/kali-2023.4/kali-linux-2023.4-installer-amd64.iso"
    fi
    
    # Download Ubuntu Desktop 20.04
    if [[ ! -f "images/ubuntu-20.04.3-desktop-amd64.iso" ]]; then
        log "Downloading Ubuntu Desktop 20.04..."
        wget -O images/ubuntu-20.04.3-desktop-amd64.iso \
             "https://releases.ubuntu.com/20.04/ubuntu-20.04.3-desktop-amd64.iso"
    fi
    
    log "OS images downloaded successfully"
}

# Attach OS images to VMs
attach_images() {
    log "Attaching OS images to VMs..."
    
    if [[ $VIRT_TYPE == "virtualbox" ]]; then
        # Attach Ubuntu Server to ICS VM
        vboxmanage storagectl "$ICS_VM_NAME" --name "IDE Controller" --add ide
        vboxmanage storageattach "$ICS_VM_NAME" --storagectl "IDE Controller" --port 0 --device 0 --type dvddrive --medium "images/ubuntu-20.04.3-live-server-amd64.iso"
        
        # Attach Kali Linux to Attack VM
        vboxmanage storagectl "$ATTACK_VM_NAME" --name "IDE Controller" --add ide
        vboxmanage storageattach "$ATTACK_VM_NAME" --storagectl "IDE Controller" --port 0 --device 0 --type dvddrive --medium "images/kali-linux-2023.4-installer-amd64.iso"
        
        # Attach Ubuntu Server to Defense VM
        vboxmanage storagectl "$DEFENSE_VM_NAME" --name "IDE Controller" --add ide
        vboxmanage storageattach "$DEFENSE_VM_NAME" --storagectl "IDE Controller" --port 0 --device 0 --type dvddrive --medium "images/ubuntu-20.04.3-live-server-amd64.iso"
        
        # Attach Ubuntu Desktop to Display VM
        vboxmanage storagectl "$DISPLAY_VM_NAME" --name "IDE Controller" --add ide
        vboxmanage storageattach "$DISPLAY_VM_NAME" --storagectl "IDE Controller" --port 0 --device 0 --type dvddrive --medium "images/ubuntu-20.04.3-desktop-amd64.iso"
        
        log "OS images attached successfully"
    fi
}

# Generate network configuration
generate_network_config() {
    log "Generating network configuration..."
    
    cat > network_config.txt << EOF
# ICS Cybersecurity Platform Network Configuration

Network: $NETWORK_RANGE
Gateway: $GATEWAY

VM IP Addresses:
- ICS VM: $ICS_VM_IP (OpenPLC, ModbusPal, ScadaBR)
- Attack VM: $ATTACK_VM_IP (Kali Linux, Metasploit)
- Defense VM: $DEFENSE_VM_IP (Detection Engine, Response System)
- Display VM: $DISPLAY_VM_IP (Dashboards, HMI Interface)

Port Configuration:
- ICS VM: 502 (Modbus), 8080 (OpenPLC), 9600 (ScadaBR), 22 (SSH)
- Defense VM: 5000 (Dashboard), 5601 (Kibana), 9200 (Elasticsearch), 22 (SSH)
- Attack VM: 22 (SSH), 4444 (Metasploit)
- Display VM: 8501 (Streamlit), 8502 (Executive Dashboard), 22 (SSH)

Network Isolation:
- All VMs are isolated on virtual network
- No direct internet access for security
- Internal communication only between VMs
EOF
    
    log "Network configuration saved to network_config.txt"
}

# Generate setup instructions
generate_setup_instructions() {
    log "Generating setup instructions..."
    
    cat > setup_instructions.md << EOF
# ICS Cybersecurity Platform Setup Instructions

## Prerequisites
- VirtualBox 7.0+ or VMware Workstation
- 16GB+ RAM available
- 100GB+ free disk space
- Ubuntu 20.04 or Windows 10/11 host

## VM Setup Complete

The following VMs have been created:

### 1. ICS VM ($ICS_VM_IP)
- **Purpose**: Industrial Control System simulation
- **OS**: Ubuntu 20.04 Server
- **Resources**: ${ICS_VM_RAM}MB RAM, ${ICS_VM_CPU} CPU cores, ${ICS_VM_DISK}GB disk
- **Services**: OpenPLC, ModbusPal, ScadaBR

### 2. Attack VM ($ATTACK_VM_IP)
- **Purpose**: Cyber attack simulation
- **OS**: Kali Linux 2023.4
- **Resources**: ${ATTACK_VM_RAM}MB RAM, ${ATTACK_VM_CPU} CPU cores, ${ATTACK_VM_DISK}GB disk
- **Tools**: Metasploit, custom attack scripts

### 3. Defense VM ($DEFENSE_VM_IP)
- **Purpose**: AI-powered threat detection and response
- **OS**: Ubuntu 20.04 Server
- **Resources**: ${DEFENSE_VM_RAM}MB RAM, ${DEFENSE_VM_CPU} CPU cores, ${DEFENSE_VM_DISK}GB disk
- **Services**: Detection engine, response system, ELK stack

### 4. Display VM ($DISPLAY_VM_IP)
- **Purpose**: Live dashboards and HMI interface
- **OS**: Ubuntu 20.04 Desktop
- **Resources**: ${DISPLAY_VM_RAM}MB RAM, ${DISPLAY_VM_CPU} CPU core, ${DISPLAY_VM_DISK}GB disk
- **Services**: Operations dashboard, executive dashboard

## Next Steps

### 1. Install Operating Systems
Start each VM and install the operating system:
- Use minimal installation for server VMs
- Enable SSH during installation
- Set static IP addresses as configured

### 2. Configure Network
After OS installation, configure static IP addresses:
- ICS VM: $ICS_VM_IP
- Attack VM: $ATTACK_VM_IP
- Defense VM: $DEFENSE_VM_IP
- Display VM: $DISPLAY_VM_IP

### 3. Install Required Software
Follow the installation guides in each module:
- \`attack/setup.sh\` - Attack VM setup
- \`defense/setup.sh\` - Defense VM setup
- \`monitoring/setup.sh\` - Display VM setup

### 4. Test Connectivity
Verify network connectivity between VMs:
\`\`\`bash
# From any VM, test connectivity to others
ping $ICS_VM_IP
ping $ATTACK_VM_IP
ping $DEFENSE_VM_IP
ping $DISPLAY_VM_IP
\`\`\`

### 5. Start Services
Start the core services:
\`\`\`bash
# On ICS VM
sudo systemctl start openplc

# On Defense VM
python3 detection_engine.py --start

# On Display VM
streamlit run operations_dashboard.py
\`\`\`

## Security Notes
- All VMs are isolated on virtual network
- No internet access for security
- Use strong passwords for all accounts
- Keep systems updated regularly

## Troubleshooting
- Check VM network adapter settings
- Verify firewall configurations
- Review system logs for errors
- Ensure sufficient host resources
EOF
    
    log "Setup instructions saved to setup_instructions.md"
}

# Main execution
main() {
    log "Starting ICS Cybersecurity Platform VM Setup"
    
    # Check prerequisites
    check_root
    check_virtualization
    
    # Create infrastructure
    create_network
    download_images
    
    # Create VMs
    create_vm "$ICS_VM_NAME" "$ICS_VM_RAM" "$ICS_VM_CPU" "$ICS_VM_DISK" "Ubuntu_64"
    create_vm "$ATTACK_VM_NAME" "$ATTACK_VM_RAM" "$ATTACK_VM_CPU" "$ATTACK_VM_DISK" "KaliLinux_64"
    create_vm "$DEFENSE_VM_NAME" "$DEFENSE_VM_RAM" "$DEFENSE_VM_CPU" "$DEFENSE_VM_DISK" "Ubuntu_64"
    create_vm "$DISPLAY_VM_NAME" "$DISPLAY_VM_RAM" "$DISPLAY_VM_CPU" "$DISPLAY_VM_DISK" "Ubuntu_64"
    
    # Attach OS images
    attach_images
    
    # Generate configuration files
    generate_network_config
    generate_setup_instructions
    
    log "VM setup completed successfully!"
    log "Next steps:"
    log "1. Start each VM and install the operating system"
    log "2. Configure static IP addresses"
    log "3. Follow setup instructions in setup_instructions.md"
    log "4. Run module-specific setup scripts"
}

# Run main function
main "$@" 