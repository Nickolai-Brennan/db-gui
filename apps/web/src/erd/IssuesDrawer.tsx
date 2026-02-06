import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getIssues } from "../api/client";
import { useErdStore } from "../stores/erdStore";

type Issue = {
  id: string;
  severity: string;
  title: string;
  description?: string;
  targetKind?: string;
  targetRef?: {
    schema?: string;
    table?: string;
    column?: string;
  };
};

export function IssuesDrawer({ instanceId }: { instanceId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [severityFilter, setSeverityFilter] = useState<string | null>(null);
  const focusOn = useErdStore((s) => s.focusOn);

  const { data: issues, isLoading } = useQuery({
    queryKey: ["issues", instanceId],
    queryFn: async () => (await getIssues(instanceId)) as Issue[],
    enabled: !!instanceId,
  });

  const filteredIssues = severityFilter
    ? issues?.filter((i) => i.severity === severityFilter)
    : issues;

  const handleIssueClick = (issue: Issue) => {
    if (issue.targetKind === "table" && issue.targetRef?.schema && issue.targetRef?.table) {
      const key = `${issue.targetRef.schema}.${issue.targetRef.table}`;
      focusOn({ type: "table", key });
    }
  };

  const severityCounts = {
    blocking: issues?.filter((i) => i.severity === "blocking").length || 0,
    error: issues?.filter((i) => i.severity === "error").length || 0,
    warning: issues?.filter((i) => i.severity === "warning").length || 0,
    info: issues?.filter((i) => i.severity === "info").length || 0,
  };

  return (
    <>
      {/* Toggle button */}
      <div className="absolute top-3 left-3 z-20">
        <button
          className="px-3 py-1.5 rounded-xl border border-zinc-200 bg-white text-sm shadow-sm"
          onClick={() => setIsOpen(!isOpen)}
        >
          Issues ({issues?.length || 0})
        </button>
      </div>

      {/* Drawer */}
      {isOpen && (
        <aside className="w-[320px] shrink-0 border-r border-zinc-200 bg-white flex flex-col">
          <div className="p-4 border-b border-zinc-200">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-semibold">Issues</div>
              <button
                className="text-xs text-zinc-500 hover:text-zinc-700"
                onClick={() => setIsOpen(false)}
              >
                Close
              </button>
            </div>

            {/* Severity filters */}
            <div className="flex gap-1.5 flex-wrap">
              <button
                className={`text-xs px-2 py-1 rounded-lg border ${
                  severityFilter === null
                    ? "border-black bg-black text-white"
                    : "border-zinc-200 hover:border-zinc-300"
                }`}
                onClick={() => setSeverityFilter(null)}
              >
                All
              </button>
              {severityCounts.blocking > 0 && (
                <button
                  className={`text-xs px-2 py-1 rounded-lg border ${
                    severityFilter === "blocking"
                      ? "border-red-600 bg-red-600 text-white"
                      : "border-zinc-200 hover:border-zinc-300"
                  }`}
                  onClick={() => setSeverityFilter("blocking")}
                >
                  Block ({severityCounts.blocking})
                </button>
              )}
              {severityCounts.error > 0 && (
                <button
                  className={`text-xs px-2 py-1 rounded-lg border ${
                    severityFilter === "error"
                      ? "border-red-500 bg-red-500 text-white"
                      : "border-zinc-200 hover:border-zinc-300"
                  }`}
                  onClick={() => setSeverityFilter("error")}
                >
                  Fail ({severityCounts.error})
                </button>
              )}
              {severityCounts.warning > 0 && (
                <button
                  className={`text-xs px-2 py-1 rounded-lg border ${
                    severityFilter === "warning"
                      ? "border-amber-500 bg-amber-500 text-white"
                      : "border-zinc-200 hover:border-zinc-300"
                  }`}
                  onClick={() => setSeverityFilter("warning")}
                >
                  Warn ({severityCounts.warning})
                </button>
              )}
            </div>
          </div>

          {/* Issues list */}
          <div className="flex-1 overflow-auto p-4 space-y-2">
            {isLoading ? (
              <div className="text-sm text-zinc-500">Loading...</div>
            ) : !filteredIssues || filteredIssues.length === 0 ? (
              <div className="text-sm text-zinc-500">No issues found</div>
            ) : (
              filteredIssues.map((issue) => (
                <div
                  key={issue.id}
                  className="rounded-xl border border-zinc-200 p-3 hover:border-zinc-300 cursor-pointer"
                  onClick={() => handleIssueClick(issue)}
                >
                  <div className="flex items-start gap-2">
                    <div
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                        issue.severity === "blocking"
                          ? "bg-red-100 text-red-700"
                          : issue.severity === "error"
                            ? "bg-red-50 text-red-600"
                            : issue.severity === "warning"
                              ? "bg-amber-50 text-amber-600"
                              : "bg-blue-50 text-blue-600"
                      }`}
                    >
                      {issue.severity === "blocking"
                        ? "BLOCK"
                        : issue.severity === "error"
                          ? "FAIL"
                          : issue.severity === "warning"
                            ? "WARN"
                            : "INFO"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{issue.title}</div>
                      {issue.description && (
                        <div className="text-xs text-zinc-500 mt-1 line-clamp-2">
                          {issue.description}
                        </div>
                      )}
                      {issue.targetRef?.table && (
                        <div className="text-xs text-zinc-500 mt-1">
                          {issue.targetRef.schema}.{issue.targetRef.table}
                          {issue.targetRef.column && `.${issue.targetRef.column}`}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>
      )}
    </>
  );
}
