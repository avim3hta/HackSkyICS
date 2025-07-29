# Admin Portal Guide

## 🔐 Accessing the Admin Portal

1. **Navigate to the Admin Portal**: Click the "🔧 Admin" button in the top-right corner of the main dashboard, or go directly to `/admin`

2. **Sign In**: Enter your admin credentials and click "Sign In"

## 🎛️ Admin Portal Features

### System Control Management
- **Individual Component Control**: Toggle individual system components on/off
- **Emergency Shutdown**: Disable all systems for a specific plant
- **Activate All Systems**: Enable all systems for a specific plant

### Real-time Monitoring
- **System Status Overview**: View the operational status of all plants
- **Component Status**: See which components are online/offline
- **Percentage Indicators**: Visual representation of system health

### Plant Management
The admin portal manages three industrial facilities:

#### 🏭 Water Treatment Plant
- Pump systems (PUMP-1, PUMP-2, BACKUP-PUMP)
- Valve controls (VALVE-A, VALVE-B)
- Tank level monitoring
- Filtration systems
- Monitoring systems

#### ☢️ Nuclear Power Plant
- Reactor controls (REACTOR-1, REACTOR-2)
- Turbine systems (TURBINE-1, TURBINE-2)
- Coolant systems (COOLANT-A, COOLANT-B)
- Containment systems

#### ⚡ Electrical Grid
- Generator controls (GENERATOR-1, GENERATOR-2)
- Transformer systems (TRANSFORMER-A, TRANSFORMER-B)
- Substation controls (SUBSTATION-1, SUBSTATION-2)
- Protection systems
- Load management

## 🚨 Emergency Procedures

### Emergency Shutdown
- **Purpose**: Immediately disable all systems for safety
- **Use Case**: Emergency situations requiring immediate system shutdown
- **Effect**: All components for the selected plant will be turned off

### System Activation
- **Purpose**: Restore all systems to operational status
- **Use Case**: After emergency shutdown or maintenance
- **Effect**: All components for the selected plant will be turned on

## 🔧 Demo Mode Features

The admin portal includes a demo mode that:
- Works without requiring a full Supabase database setup
- Provides realistic system control simulation
- Maintains state during the session
- Allows full testing of all admin features

## 📊 Status Indicators

- **🟢 All Systems Online**: 100% operational
- **🟡 Partial Operations**: Some systems offline
- **🔴 All Systems Offline**: 0% operational
- **CRITICAL Badge**: Applied to safety-critical components

## 🔄 Navigation

- **Dashboard Button**: Return to the main monitoring dashboard
- **Sign Out**: End the admin session and return to login

## ⚠️ Important Notes

- This is a demo system for educational purposes
- All changes are simulated and don't affect real industrial systems
- The demo mode provides full functionality without database dependencies
- Use the emergency controls responsibly in the demo environment 