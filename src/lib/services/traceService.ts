export type TraceStep = {
  name: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  timestamp: string;
};

export function addTraceStep(
  steps: TraceStep[],
  name: string,
  input: Record<string, unknown>,
  output: Record<string, unknown>,
) {
  steps.push({
    name,
    input,
    output,
    timestamp: new Date().toISOString(),
  });
}
