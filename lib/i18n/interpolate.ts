export function interpolate(
  template: string,
  vars?: Record<string, string | number>
): string {
  if (!vars) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, k) =>
    vars[k] !== undefined && vars[k] !== null ? String(vars[k]) : `{{${k}}}`
  );
}
