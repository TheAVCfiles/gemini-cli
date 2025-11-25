export function makeRoom({
  id,
  title,
  mood,
  summary,
  entry,
  beats,
  prompts,
  artifacts = [],
  engineHooks = []
}) {
  return {
    id,
    title,
    mood,
    summary,
    entry,
    beats,
    prompts,
    artifacts,
    engineHooks
  };
}
