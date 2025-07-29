# HackSky ICS Admin Portal

## Admin Credentials

**Demo Admin Account:**
- Email: `admin@hacksky.com`
- Password: `admin123`

## Features

### System Controls
- Turn reactors, turbines, pumps, and other critical infrastructure components on/off
- Emergency shutdown capabilities for entire facilities
- Bulk system activation controls
- Real-time status monitoring

### Attack Scenario Simulation
- Execute controlled attack scenarios for testing
- Available scenarios per facility:
  - **Water Treatment Plant**: DoS Attack, Unauthorized Control, Data Manipulation
  - **Nuclear Power Plant**: Forced SCRAM Attack, Coolant System Breach, Control Rod Override
  - **Electrical Grid**: Coordinated Blackout, System Overload, Frequency Attack
- Real-time attack status monitoring
- Attack history tracking

### Enhanced Features
- Visual status indicators with color coding
- Critical system identification (reactors, containment)
- System status overview with percentage indicators
- Admin authentication with role-based access control
- Toast notifications for all actions

## Setup Instructions

1. **Database Setup**: The migrations should create:
   - `profiles` table for user management
   - `system_controls` table for component controls
   - `attack_scenarios` table for attack simulation
   - Admin user with the credentials above

2. **Run the Application**:
   ```bash
   cd frontend
   npm run dev
   ```

3. **Access Admin Panel**:
   - Navigate to `/admin` in your browser
   - Use the demo credentials to login
   - Explore system controls and attack scenarios

## Security Notes

- This is a demonstration system only
- In production, use proper password hashing and secure authentication
- Attack scenarios are simulated and for testing purposes only
- Admin access should be properly secured in real environments

## Component Icons

- ⚛️ Reactors (Critical systems)
- ⚡ Turbines/Generators 
- ⚙️ General components
- 🚨 Emergency controls
- ⚔️ Attack scenarios
- 🛑 Stop/Deactivate actions
