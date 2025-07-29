import { MetricCard } from "./MetricCard";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line } from 'recharts';

const networkData = [
  { time: '10:00', traffic: 45 },
  { time: '10:05', traffic: 52 },
  { time: '10:10', traffic: 38 },
  { time: '10:15', traffic: 65 },
  { time: '10:20', traffic: 43 },
  { time: '10:25', traffic: 58 },
  { time: '10:30', traffic: 41 },
];

const modbusData = [
  { minute: '1', commands: 20 },
  { minute: '2', commands: 25 },
  { minute: '3', commands: 18 },
  { minute: '4', commands: 23 },
  { minute: '5', commands: 27 },
];

export const SecurityMonitoring = () => {
  return (
    <div className="dashboard-panel">
      <h3 className="text-xl font-semibold mb-6 text-primary">Security Monitoring</h3>
      
      {/* Network Traffic Chart */}
      <div className="mb-6">
        <h4 className="text-lg font-medium mb-3 text-accent">Live Network Traffic</h4>
        <div className="h-32 chart-glow">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={networkData}>
              <XAxis 
                dataKey="time" 
                axisLine={false} 
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              />
              <YAxis hide />
              <Line 
                type="monotone" 
                dataKey="traffic" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Modbus Commands Chart */}
      <div className="mb-6">
        <h4 className="text-lg font-medium mb-3 text-accent">Modbus Commands</h4>
        <div className="h-24">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={modbusData}>
              <XAxis 
                dataKey="minute" 
                axisLine={false} 
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              />
              <YAxis hide />
              <Bar 
                dataKey="commands" 
                fill="hsl(var(--accent))" 
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Security Metrics */}
      <div className="grid grid-cols-2 gap-4">
        <MetricCard 
          title="Modbus Commands/Min" 
          value={23} 
          status="normal"
        />
        <MetricCard 
          title="Anomalies Detected" 
          value={0} 
          status="normal"
        />
        <MetricCard 
          title="Commands Blocked" 
          value={0} 
          status="normal"
        />
        <MetricCard 
          title="Active Connections" 
          value={12} 
          status="normal"
        />
      </div>
    </div>
  );
};