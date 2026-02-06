import { useErdStore } from "../stores/erdStore";

type MinimapProps = {
  tableKeys: string[];
};

export function Minimap({ tableKeys }: MinimapProps) {
  const layout = useErdStore((s) => s.layout);
  const viewport = useErdStore((s) => s.viewport);
  const setViewport = useErdStore((s) => s.setViewport);

  // Calculate bounds of all tables
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const key of tableKeys) {
    const rect = layout[key];
    if (rect) {
      minX = Math.min(minX, rect.x);
      minY = Math.min(minY, rect.y);
      maxX = Math.max(maxX, rect.x + rect.w);
      maxY = Math.max(maxY, rect.y + rect.h);
    }
  }

  if (minX === Infinity) return null;

  const padding = 100;
  const worldW = maxX - minX + padding * 2;
  const worldH = maxY - minY + padding * 2;
  const worldX = minX - padding;
  const worldY = minY - padding;

  // Minimap dimensions
  const minimapW = 200;
  const minimapH = 150;
  const scale = Math.min(minimapW / worldW, minimapH / worldH);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Convert minimap click to world coordinates
    const worldClickX = worldX + clickX / scale;
    const worldClickY = worldY + clickY / scale;

    // Center viewport on clicked position
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    setViewport({
      x: vw / 2 - worldClickX * viewport.zoom,
      y: vh / 2 - worldClickY * viewport.zoom,
    });
  };

  // Calculate viewport rectangle in minimap space
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const viewportWorldX = -viewport.x / viewport.zoom;
  const viewportWorldY = -viewport.y / viewport.zoom;
  const viewportWorldW = vw / viewport.zoom;
  const viewportWorldH = vh / viewport.zoom;

  const viewportMinimapX = (viewportWorldX - worldX) * scale;
  const viewportMinimapY = (viewportWorldY - worldY) * scale;
  const viewportMinimapW = viewportWorldW * scale;
  const viewportMinimapH = viewportWorldH * scale;

  return (
    <div className="absolute bottom-4 right-4 z-20">
      <div
        className="rounded-xl border border-zinc-200 bg-white shadow-sm p-2 cursor-pointer"
        style={{ width: minimapW + 16, height: minimapH + 16 }}
        onClick={handleClick}
      >
        <div className="relative" style={{ width: minimapW, height: minimapH }}>
          {/* Background */}
          <div className="absolute inset-0 bg-zinc-50 rounded" />

          {/* Tables as rectangles */}
          {tableKeys.map((key) => {
            const rect = layout[key];
            if (!rect) return null;

            const x = (rect.x - worldX) * scale;
            const y = (rect.y - worldY) * scale;
            const w = rect.w * scale;
            const h = rect.h * scale;

            return (
              <div
                key={key}
                className="absolute bg-zinc-300 rounded-sm"
                style={{
                  left: x,
                  top: y,
                  width: w,
                  height: h,
                }}
              />
            );
          })}

          {/* Viewport rectangle */}
          <div
            className="absolute border-2 border-blue-500 rounded pointer-events-none"
            style={{
              left: viewportMinimapX,
              top: viewportMinimapY,
              width: viewportMinimapW,
              height: viewportMinimapH,
            }}
          />
        </div>
      </div>
    </div>
  );
}
