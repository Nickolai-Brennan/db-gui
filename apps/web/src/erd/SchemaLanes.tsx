import type { SchemaLane } from "./lanes";

export function SchemaLanes({ lanes }: { lanes: SchemaLane[] }) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <svg width="100%" height="100%" style={{ position: "absolute", left: 0, top: 0 }}>
        {lanes.map((lane) => (
          <g key={lane.schema}>
            {/* Vertical divider */}
            <line
              x1={lane.x}
              y1={0}
              x2={lane.x}
              y2={6000}
              stroke="rgba(0,0,0,0.1)"
              strokeWidth={2}
            />
            <line
              x1={lane.x + lane.width}
              y1={0}
              x2={lane.x + lane.width}
              y2={6000}
              stroke="rgba(0,0,0,0.1)"
              strokeWidth={2}
            />
            {/* Schema label at top */}
            <text
              x={lane.x + lane.width / 2}
              y={30}
              fill="rgba(0,0,0,0.4)"
              fontSize={14}
              fontWeight="600"
              textAnchor="middle"
            >
              {lane.schema}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
