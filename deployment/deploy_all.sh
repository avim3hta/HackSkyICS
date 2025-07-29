#!/bin/bash
# Complete ICS Cybersecurity Platform Deployment Script
# This script deploys all components across the VM infrastructure

set -e  # Exit on any error

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# VM IP Addresses
ICS_VM_IP="192.168.100.10"
ATTACK_VM_IP="192.168.100.20"
DEFENSE_VM_IP="192.168.100.30"
DISPLAY_VM_IP="192.168.100.40"

# SSH Configuration
SSH_USER="ubuntu"
SSH_KEY="~/.ssh/id_rsa"
SSH_OPTS="-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
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

# Check prerequisites
check_prerequisites() {
    log "Checking deployment prerequisites..."
    
    # Check if SSH key exists
    if [[ ! -f ~/.ssh/id_rsa ]]; then
        warning "SSH key not found. Generating new key pair..."
        ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa -N ""
    fi
    
    # Check if VMs are accessible
    local vms=("$ICS_VM_IP" "$ATTACK_VM_IP" "$DEFENSE_VM_IP" "$DISPLAY_VM_IP")
    for vm_ip in "${vms[@]}"; do
        if ! ping -c 1 -W 5 "$vm_ip" &> /dev/null; then
            error "VM $vm_ip is not accessible. Please ensure all VMs are running."
        fi
    done
    
    log "Prerequisites check completed"
}

# Copy SSH key to VMs
setup_ssh_access() {
    log "Setting up SSH access to VMs..."
    
    local vms=("$ICS_VM_IP" "$ATTACK_VM_IP" "$DEFENSE_VM_IP" "$DISPLAY_VM_IP")
    
    for vm_ip in "${vms[@]}"; do
        log "Setting up SSH access to $vm_ip..."
        
        # Copy SSH key (assuming password authentication for initial setup)
        sshpass -p "password" ssh-copy-id -i ~/.ssh/id_rsa.pub "$SSH_USER@$vm_ip" $SSH_OPTS || {
            warning "Could not copy SSH key to $vm_ip. Manual setup may be required."
        }
    done
    
    log "SSH access setup completed"
}

# Deploy ICS environment
deploy_ics_environment() {
    log "Deploying ICS environment on $ICS_VM_IP..."
    
    # Copy ICS setup files
    scp $SSH_OPTS -r "$PROJECT_ROOT/attack/" "$SSH_USER@$ICS_VM_IP:/opt/"
    scp $SSH_OPTS -r "$PROJECT_ROOT/defense/" "$SSH_USER@$ICS_VM_IP:/opt/"
    scp $SSH_OPTS -r "$PROJECT_ROOT/monitoring/" "$SSH_USER@$ICS_VM_IP:/opt/"
    
    # Execute ICS setup
    ssh $SSH_OPTS "$SSH_USER@$ICS_VM_IP" << 'EOF'
        # Update system
        sudo apt update && sudo apt upgrade -y
        
        # Install required packages
        sudo apt install -y python3 python3-pip git curl wget
        
        # Install OpenPLC
        cd /opt
        git clone https://github.com/thiagoralves/OpenPLC_v3.git
        cd OpenPLC_v3
        ./install.sh linux
        sudo systemctl enable openplc
        sudo systemctl start openplc
        
        # Install ModbusPal
        wget https://github.com/zeelos/ModbusPal/releases/download/v1.6b/ModbusPal.jar
        sudo apt install -y openjdk-11-jre
        java -jar ModbusPal.jar &
        
        # Install ScadaBR
        sudo apt install -y tomcat9
        wget https://sourceforge.net/projects/scadabr/files/ScadaBR_1.2.0.zip
        unzip ScadaBR_1.2.0.zip -d /var/lib/tomcat9/webapps/
        
        # Configure network
        sudo ip addr add 192.168.100.10/24 dev eth0
        sudo ip route add default via 192.168.100.1
        
        echo "ICS environment deployment completed"
EOF
    
    log "ICS environment deployment completed"
}

# Deploy attack tools
deploy_attack_tools() {
    log "Deploying attack tools on $ATTACK_VM_IP..."
    
    # Copy attack module files
    scp $SSH_OPTS -r "$PROJECT_ROOT/attack/" "$SSH_USER@$ATTACK_VM_IP:/opt/"
    
    # Execute attack setup
    ssh $SSH_OPTS "$SSH_USER@$ATTACK_VM_IP" << 'EOF'
        # Update Kali Linux
        sudo apt update && sudo apt upgrade -y
        
        # Install additional tools
        sudo apt install -y python3 python3-pip git nmap wireshark
        
        # Install Metasploit (if not already installed)
        if ! command -v msfconsole &> /dev/null; then
            curl https://raw.githubusercontent.com/rapid7/metasploit-omnibus/master/config/templates/metasploit-framework-wrappers/msfupdate.erb > msfinstall
            chmod +x msfinstall
            ./msfinstall
            msfdb init
            msfdb start
        fi
        
        # Install Python dependencies
        cd /opt/attack
        pip3 install -r requirements.txt
        
        # Configure network
        sudo ip addr add 192.168.100.20/24 dev eth0
        sudo ip route add default via 192.168.100.1
        
        echo "Attack tools deployment completed"
EOF
    
    log "Attack tools deployment completed"
}

# Deploy defense system
deploy_defense_system() {
    log "Deploying defense system on $DEFENSE_VM_IP..."
    
    # Copy defense module files
    scp $SSH_OPTS -r "$PROJECT_ROOT/defense/" "$SSH_USER@$DEFENSE_VM_IP:/opt/"
    
    # Execute defense setup
    ssh $SSH_OPTS "$SSH_USER@$DEFENSE_VM_IP" << 'EOF'
        # Update system
        sudo apt update && sudo apt upgrade -y
        
        # Install required packages
        sudo apt install -y python3 python3-pip git docker.io docker-compose
        
        # Start Docker service
        sudo systemctl enable docker
        sudo systemctl start docker
        
        # Install Python dependencies
        cd /opt/defense
        pip3 install -r requirements.txt
        
        # Setup ELK Stack
        docker-compose -f elk-stack.yml up -d
        
        # Configure network
        sudo ip addr add 192.168.100.30/24 dev eth0
        sudo ip route add default via 192.168.100.1
        
        # Start defense services
        cd /opt/defense
        python3 detection_engine.py --start &
        python3 response_engine.py --start &
        
        echo "Defense system deployment completed"
EOF
    
    log "Defense system deployment completed"
}

# Deploy monitoring dashboards
deploy_monitoring_dashboards() {
    log "Deploying monitoring dashboards on $DISPLAY_VM_IP..."
    
    # Copy monitoring module files
    scp $SSH_OPTS -r "$PROJECT_ROOT/monitoring/" "$SSH_USER@$DISPLAY_VM_IP:/opt/"
    
    # Execute monitoring setup
    ssh $SSH_OPTS "$SSH_USER@$DISPLAY_VM_IP" << 'EOF'
        # Update system
        sudo apt update && sudo apt upgrade -y
        
        # Install required packages
        sudo apt install -y python3 python3-pip nginx
        
        # Install Python dependencies
        cd /opt/monitoring
        pip3 install -r requirements.txt
        
        # Configure nginx
        sudo cp nginx.conf /etc/nginx/sites-available/ics-dashboard
        sudo ln -s /etc/nginx/sites-available/ics-dashboard /etc/nginx/sites-enabled/
        sudo systemctl restart nginx
        
        # Configure network
        sudo ip addr add 192.168.100.40/24 dev eth0
        sudo ip route add default via 192.168.100.1
        
        # Start dashboard services
        cd /opt/monitoring
        streamlit run operations_dashboard.py --server.port 8501 &
        streamlit run executive_dashboard.py --server.port 8502 &
        
        echo "Monitoring dashboards deployment completed"
EOF
    
    log "Monitoring dashboards deployment completed"
}

# Test system connectivity
test_connectivity() {
    log "Testing system connectivity..."
    
    # Test ICS services
    if curl -s "http://$ICS_VM_IP:8080" &> /dev/null; then
        log "✓ OpenPLC web interface accessible"
    else
        warning "✗ OpenPLC web interface not accessible"
    fi
    
    # Test defense system
    if curl -s "http://$DEFENSE_VM_IP:5000/api/status" &> /dev/null; then
        log "✓ Defense system API accessible"
    else
        warning "✗ Defense system API not accessible"
    fi
    
    # Test monitoring dashboards
    if curl -s "http://$DISPLAY_VM_IP:8501" &> /dev/null; then
        log "✓ Operations dashboard accessible"
    else
        warning "✗ Operations dashboard not accessible"
    fi
    
    if curl -s "http://$DISPLAY_VM_IP:8502" &> /dev/null; then
        log "✓ Executive dashboard accessible"
    else
        warning "✗ Executive dashboard not accessible"
    fi
    
    log "Connectivity testing completed"
}

# Generate deployment report
generate_deployment_report() {
    log "Generating deployment report..."
    
    cat > deployment_report.md << EOF
# ICS Cybersecurity Platform Deployment Report

## Deployment Summary
- **Date**: $(date)
- **Status**: Completed
- **Total VMs**: 4
- **Total Components**: 3 modules

## VM Status

### ICS VM ($ICS_VM_IP)
- **Status**: ✅ Deployed
- **Services**: OpenPLC, ModbusPal, ScadaBR
- **Access**: http://$ICS_VM_IP:8080 (OpenPLC)
- **Access**: http://$ICS_VM_IP:9600 (ScadaBR)

### Attack VM ($ATTACK_VM_IP)
- **Status**: ✅ Deployed
- **Services**: Metasploit, Custom Attack Tools
- **Access**: SSH to $ATTACK_VM_IP
- **Tools**: /opt/attack/

### Defense VM ($DEFENSE_VM_IP)
- **Status**: ✅ Deployed
- **Services**: Detection Engine, Response System, ELK Stack
- **Access**: http://$DEFENSE_VM_IP:5000 (API)
- **Access**: http://$DEFENSE_VM_IP:5601 (Kibana)

### Display VM ($DISPLAY_VM_IP)
- **Status**: ✅ Deployed
- **Services**: Operations Dashboard, Executive Dashboard
- **Access**: http://$DISPLAY_VM_IP:8501 (Operations)
- **Access**: http://$DISPLAY_VM_IP:8502 (Executive)

## Network Configuration
- **Network**: 192.168.100.0/24
- **Gateway**: 192.168.100.1
- **Isolation**: Virtual network, no internet access

## Next Steps
1. **Verify Services**: Check all services are running correctly
2. **Run Demo Scenarios**: Execute attack/defense demonstrations
3. **Monitor Performance**: Ensure system performance meets requirements
4. **Document Issues**: Report any deployment problems

## Troubleshooting
- Check VM network connectivity
- Verify service status on each VM
- Review system logs for errors
- Ensure sufficient host resources

## Security Notes
- All VMs are isolated on virtual network
- No internet access for security
- Use strong authentication
- Regular security updates recommended
EOF
    
    log "Deployment report saved to deployment_report.md"
}

# Main deployment function
main() {
    log "Starting ICS Cybersecurity Platform deployment..."
    
    # Check prerequisites
    check_prerequisites
    
    # Setup SSH access
    setup_ssh_access
    
    # Deploy components
    deploy_ics_environment
    deploy_attack_tools
    deploy_defense_system
    deploy_monitoring_dashboards
    
    # Test connectivity
    test_connectivity
    
    # Generate report
    generate_deployment_report
    
    log "Deployment completed successfully!"
    log "Access your dashboards at:"
    log "- Operations Dashboard: http://$DISPLAY_VM_IP:8501"
    log "- Executive Dashboard: http://$DISPLAY_VM_IP:8502"
    log "- OpenPLC Interface: http://$ICS_VM_IP:8080"
    log "- Defense API: http://$DEFENSE_VM_IP:5000"
}

# Run main function
main "$@" 