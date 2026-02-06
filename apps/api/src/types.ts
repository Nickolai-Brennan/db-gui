export type UUID = string;

export type CheckStatus = "unchecked" | "pass" | "warning" | "fail" | "blocked";
export type Severity = "info" | "warning" | "error" | "blocking";
export type RunType = "manual" | "automatic" | "hybrid";
