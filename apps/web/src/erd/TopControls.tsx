import { useState } from "react";

type TopControlsProps = {
  schemasAll: string[];
  selectedSchemas: string[];
  onSchemasChange: (schemas: string[]) => void;
  search: string;
  onSearchChange: (search: string) => void;
  hideIsolated: boolean;
  onHideIsolatedChange: (hide: boolean) => void;
  showSchemaLanes: boolean;
  onShowSchemaLanesChange: (show: boolean) => void;
  showMinimap: boolean;
  onShowMinimapChange: (show: boolean) => void;
  onAutoLayout: () => void;
  onResetView: () => void;
};

export function TopControls({
  schemasAll,
  selectedSchemas,
  onSchemasChange,
  search,
  onSearchChange,
  hideIsolated,
  onHideIsolatedChange,
  showSchemaLanes,
  onShowSchemaLanesChange,
  showMinimap,
  onShowMinimapChange,
  onAutoLayout,
  onResetView,
}: TopControlsProps) {
  const [showSchemaFilter, setShowSchemaFilter] = useState(false);

  const toggleSchema = (schema: string) => {
    if (selectedSchemas.includes(schema)) {
      onSchemasChange(selectedSchemas.filter((s) => s !== schema));
    } else {
      onSchemasChange([...selectedSchemas, schema]);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Search */}
      <input
        type="text"
        placeholder="Search tables..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="px-3 py-1.5 rounded-xl border border-zinc-200 text-sm w-48"
      />

      {/* Schema filter */}
      <div className="relative">
        <button
          className="px-3 py-1.5 rounded-xl border border-zinc-200 text-sm"
          onClick={() => setShowSchemaFilter(!showSchemaFilter)}
        >
          Schemas ({selectedSchemas.length}/{schemasAll.length})
        </button>
        {showSchemaFilter && (
          <div className="absolute top-full left-0 mt-1 rounded-xl border border-zinc-200 bg-white shadow-lg p-2 space-y-1 z-30 min-w-[160px]">
            {schemasAll.map((schema) => (
              <label key={schema} className="flex items-center gap-2 px-2 py-1 hover:bg-zinc-50 rounded cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedSchemas.includes(schema)}
                  onChange={() => toggleSchema(schema)}
                  className="rounded border-zinc-300"
                />
                <span className="text-sm">{schema}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Toggles */}
      <button
        className={`px-3 py-1.5 rounded-xl border text-sm ${
          hideIsolated ? "border-black bg-black text-white" : "border-zinc-200"
        }`}
        onClick={() => onHideIsolatedChange(!hideIsolated)}
      >
        Hide isolated
      </button>

      <button
        className={`px-3 py-1.5 rounded-xl border text-sm ${
          showSchemaLanes ? "border-black bg-black text-white" : "border-zinc-200"
        }`}
        onClick={() => onShowSchemaLanesChange(!showSchemaLanes)}
      >
        Schema lanes
      </button>

      <button
        className={`px-3 py-1.5 rounded-xl border text-sm ${
          showMinimap ? "border-black bg-black text-white" : "border-zinc-200"
        }`}
        onClick={() => onShowMinimapChange(!showMinimap)}
      >
        Minimap
      </button>

      {/* Actions */}
      <div className="w-px h-6 bg-zinc-200" />

      <button
        className="px-3 py-1.5 rounded-xl border border-zinc-200 text-sm"
        onClick={onAutoLayout}
      >
        Auto layout
      </button>

      <button
        className="px-3 py-1.5 rounded-xl border border-zinc-200 text-sm"
        onClick={onResetView}
      >
        Reset view
      </button>
    </div>
  );
}
