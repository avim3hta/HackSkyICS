import React from 'react';
import { PurdueLevel } from '../types';

interface PurdueLevelLayerProps {
  level: PurdueLevel;
  width: number;
  height: number;
}

const PurdueLevelLayer: React.FC<PurdueLevelLayerProps> = ({ level, width, height }) => {
  // Calculate the y position and height for each level
  const levelHeight = height / 7; // Divide by 7 levels (0-5 + buffer)
  const yPosition = height - (level.level + 1) * levelHeight;
  
  return (
    <g className="purdue-level-layer">
      {/* Background rectangle for the level - very subtle */}
      <rect
        x={0}
        y={yPosition}
        width={width}
        height={levelHeight}
        fill={level.color}
        opacity={0.08} // Very low opacity to prevent overlap
        stroke={level.color}
        strokeWidth={1}
        strokeOpacity={0.15}
        strokeDasharray="5,5"
      />
      
      {/* Level label - positioned on the left edge */}
      <text
        x={15}
        y={yPosition + levelHeight / 2}
        fill={level.color}
        fontSize="10"
        fontWeight="500"
        className="font-mono"
        opacity={0.7}
        dominantBaseline="middle"
      >
        L{level.level}
      </text>
      
      {/* Risk level indicator */}
      <circle
        cx={35}
        cy={yPosition + levelHeight / 2}
        r={3}
        fill={
          level.riskLevel === 'critical' ? '#dc2626' :
          level.riskLevel === 'high' ? '#ea580c' :
          level.riskLevel === 'medium' ? '#ca8a04' : '#16a34a'
        }
        opacity={0.6}
      />
    </g>
  );
};

export default PurdueLevelLayer;

