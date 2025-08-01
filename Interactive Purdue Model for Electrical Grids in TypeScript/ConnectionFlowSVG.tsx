import React from 'react';
import { ConnectionFlow, GridComponent } from '../types';

interface ConnectionFlowSVGProps {
  connection: ConnectionFlow;
  components: GridComponent[];
  isHighlighted: boolean;
}

const ConnectionFlowSVG: React.FC<ConnectionFlowSVGProps> = ({
  connection,
  components,
  isHighlighted
}) => {
  const fromComponent = components.find(c => c.id === connection.from);
  const toComponent = components.find(c => c.id === connection.to);

  if (!fromComponent || !toComponent) {
    return null;
  }

  const getConnectionColor = () => {
    switch (connection.type) {
      case 'power':
        return connection.status === 'active' ? '#22c55e' : '#6b7280';
      case 'data':
        return connection.status === 'active' ? '#3b82f6' : '#6b7280';
      case 'control':
        return connection.status === 'active' ? '#eab308' : '#6b7280';
      default:
        return '#6b7280';
    }
  };

  const getStrokeWidth = () => {
    if (isHighlighted) return 4;
    return connection.type === 'power' ? 3 : 2;
  };

  const getStrokeDashArray = () => {
    switch (connection.type) {
      case 'power':
        return 'none';
      case 'data':
        return '5,5';
      case 'control':
        return '10,5';
      default:
        return 'none';
    }
  };

  // Calculate connection points
  const dx = toComponent.position.x - fromComponent.position.x;
  const dy = toComponent.position.y - fromComponent.position.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // Offset from component centers to edges
  const offset = 30;
  const fromX = fromComponent.position.x + (dx / distance) * offset;
  const fromY = fromComponent.position.y + (dy / distance) * offset;
  const toX = toComponent.position.x - (dx / distance) * offset;
  const toY = toComponent.position.y - (dy / distance) * offset;

  // Create curved path for better aesthetics
  const midX = (fromX + toX) / 2;
  const midY = (fromY + toY) / 2;
  const controlOffset = 20;
  const controlX = midX + (dy / distance) * controlOffset;
  const controlY = midY - (dx / distance) * controlOffset;

  const pathData = `M ${fromX} ${fromY} Q ${controlX} ${controlY} ${toX} ${toY}`;

  // Calculate arrow position and rotation
  const arrowX = toX - (dx / distance) * 10;
  const arrowY = toY - (dy / distance) * 10;
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

  return (
    <g className="connection-flow">
      {/* Glow effect for active connections */}
      {connection.status === 'active' && (
        <path
          d={pathData}
          fill="none"
          stroke={getConnectionColor()}
          strokeWidth={getStrokeWidth() + 2}
          strokeDasharray={getStrokeDashArray()}
          opacity="0.3"
          filter="blur(2px)"
        />
      )}

      {/* Main connection line */}
      <path
        d={pathData}
        fill="none"
        stroke={getConnectionColor()}
        strokeWidth={getStrokeWidth()}
        strokeDasharray={getStrokeDashArray()}
        opacity={isHighlighted ? 1 : 0.8}
        className={connection.status === 'active' ? 'animate-pulse' : ''}
      />

      {/* Flow animation for active power connections */}
      {connection.status === 'active' && connection.type === 'power' && (
        <circle r="3" fill={getConnectionColor()}>
          <animateMotion
            dur="2s"
            repeatCount="indefinite"
            path={pathData}
          />
        </circle>
      )}

      {/* Direction arrow */}
      <g transform={`translate(${arrowX}, ${arrowY}) rotate(${angle})`}>
        <polygon
          points="0,0 -8,-3 -8,3"
          fill={getConnectionColor()}
          opacity={isHighlighted ? 1 : 0.8}
        />
      </g>

      {/* Bidirectional arrow for control connections */}
      {connection.direction === 'bidirectional' && (
        <g transform={`translate(${fromX + (dx / distance) * 10}, ${fromY + (dy / distance) * 10}) rotate(${angle + 180})`}>
          <polygon
            points="0,0 -8,-3 -8,3"
            fill={getConnectionColor()}
            opacity={isHighlighted ? 1 : 0.8}
          />
        </g>
      )}

      {/* Flow rate indicator */}
      {connection.flowRate && connection.status === 'active' && (
        <text
          x={midX}
          y={midY - 10}
          textAnchor="middle"
          fill={getConnectionColor()}
          fontSize="10"
          fontWeight="bold"
          className="pointer-events-none"
        >
          {connection.flowRate}%
        </text>
      )}

      {/* Connection type label */}
      <text
        x={midX}
        y={midY + 15}
        textAnchor="middle"
        fill="#94a3b8"
        fontSize="8"
        className="pointer-events-none uppercase"
      >
        {connection.type}
      </text>
    </g>
  );
};

export default ConnectionFlowSVG;

