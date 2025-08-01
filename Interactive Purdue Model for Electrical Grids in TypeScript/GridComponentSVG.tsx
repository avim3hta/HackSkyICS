import React from 'react';
import { GridComponent, StatusIndicator } from '../types';

interface GridComponentSVGProps {
  component: GridComponent;
  statusIndicator: StatusIndicator;
  isSelected: boolean;
  isHovered: boolean;
  onClick: () => void;
  onHover: (id: string | null) => void;
}

const GridComponentSVG: React.FC<GridComponentSVGProps> = ({
  component,
  statusIndicator,
  isSelected,
  isHovered,
  onClick,
  onHover
}) => {
  const getComponentIcon = () => {
    const baseProps = {
      fill: statusIndicator.color,
      stroke: isSelected ? '#ffffff' : statusIndicator.color,
      strokeWidth: isSelected ? 3 : 2,
      filter: statusIndicator.animation ? `url(#glow-${component.id})` : undefined
    };

    switch (component.type) {
      case 'generator':
        return (
          <g>
            <circle cx="0" cy="0" r="25" {...baseProps} />
            <text
              x="0"
              y="0"
              textAnchor="middle"
              dominantBaseline="central"
              fill="white"
              fontSize="12"
              fontWeight="bold"
            >
              G
            </text>
            {/* Generator symbol */}
            <circle cx="0" cy="0" r="15" fill="none" stroke="white" strokeWidth="1" />
          </g>
        );

      case 'transformer':
        return (
          <g>
            <rect x="-20" y="-15" width="40" height="30" {...baseProps} />
            <text
              x="0"
              y="0"
              textAnchor="middle"
              dominantBaseline="central"
              fill="white"
              fontSize="10"
              fontWeight="bold"
            >
              T
            </text>
            {/* Transformer coils */}
            <circle cx="-8" cy="0" r="6" fill="none" stroke="white" strokeWidth="1" />
            <circle cx="8" cy="0" r="6" fill="none" stroke="white" strokeWidth="1" />
          </g>
        );

      case 'substation':
        return (
          <g>
            <polygon
              points="-25,-20 25,-20 30,0 25,20 -25,20 -30,0"
              {...baseProps}
            />
            <text
              x="0"
              y="0"
              textAnchor="middle"
              dominantBaseline="central"
              fill="white"
              fontSize="10"
              fontWeight="bold"
            >
              SUB
            </text>
            {/* Substation lines */}
            <line x1="-15" y1="-10" x2="15" y2="-10" stroke="white" strokeWidth="1" />
            <line x1="-15" y1="10" x2="15" y2="10" stroke="white" strokeWidth="1" />
          </g>
        );

      case 'protection':
        return (
          <g>
            <polygon
              points="-20,-20 20,-20 20,20 -20,20"
              {...baseProps}
            />
            <text
              x="0"
              y="0"
              textAnchor="middle"
              dominantBaseline="central"
              fill="white"
              fontSize="8"
              fontWeight="bold"
            >
              PROT
            </text>
            {/* Protection shield */}
            <path
              d="M -10,-10 L 0,-15 L 10,-10 L 10,10 L 0,15 L -10,10 Z"
              fill="none"
              stroke="white"
              strokeWidth="1"
            />
          </g>
        );

      case 'load':
        return (
          <g>
            <polygon
              points="-25,-15 -15,-25 15,-25 25,-15 25,15 15,25 -15,25 -25,15"
              {...baseProps}
            />
            <text
              x="0"
              y="0"
              textAnchor="middle"
              dominantBaseline="central"
              fill="white"
              fontSize="9"
              fontWeight="bold"
            >
              LOAD
            </text>
            {/* Load resistor symbol */}
            <path
              d="M -15,0 L -10,-5 L -5,5 L 0,-5 L 5,5 L 10,-5 L 15,0"
              fill="none"
              stroke="white"
              strokeWidth="1"
            />
          </g>
        );

      default:
        return (
          <circle cx="0" cy="0" r="20" {...baseProps} />
        );
    }
  };

  return (
    <g
      transform={`translate(${component.position.x}, ${component.position.y})`}
      className="cursor-pointer transition-all duration-300"
      onClick={onClick}
      onMouseEnter={() => onHover(component.id)}
      onMouseLeave={() => onHover(null)}
    >
      {/* Glow effect definition */}
      <defs>
        <filter id={`glow-${component.id}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
          <feMerge> 
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* Selection ring */}
      {isSelected && (
        <circle
          cx="0"
          cy="0"
          r="35"
          fill="none"
          stroke="#ffffff"
          strokeWidth="2"
          strokeDasharray="5,5"
          className="animate-spin"
          style={{ animationDuration: '3s' }}
        />
      )}

      {/* Hover effect */}
      {isHovered && (
        <circle
          cx="0"
          cy="0"
          r="40"
          fill="rgba(255,255,255,0.1)"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="1"
        />
      )}

      {/* Component icon */}
      {getComponentIcon()}

      {/* Component label */}
      <text
        x="0"
        y="45"
        textAnchor="middle"
        fill="white"
        fontSize="12"
        fontWeight="bold"
        className="pointer-events-none"
      >
        {component.name}
      </text>

      {/* Status indicator */}
      <circle
        cx="20"
        cy="-20"
        r="5"
        fill={statusIndicator.color}
        className={statusIndicator.animation ? 'animate-pulse' : ''}
      />

      {/* Parameter display */}
      {component.parameters && (
        <g>
          {component.parameters.voltage && (
            <text
              x="0"
              y="60"
              textAnchor="middle"
              fill="#94a3b8"
              fontSize="10"
              className="pointer-events-none"
            >
              {component.parameters.voltage.toFixed(0)}kV
            </text>
          )}
          {component.parameters.capacity && (
            <text
              x="0"
              y="75"
              textAnchor="middle"
              fill="#94a3b8"
              fontSize="10"
              className="pointer-events-none"
            >
              {component.parameters.capacity.toFixed(0)}%
            </text>
          )}
        </g>
      )}
    </g>
  );
};

export default GridComponentSVG;

