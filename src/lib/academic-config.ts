export const CRITICAL_LENSES = [
  { key: "feminist", label: "Feminist criticism" },
  { key: "marxist", label: "Marxist criticism" },
  { key: "psychoanalytic", label: "Psychoanalytic criticism" },
  { key: "postcolonial", label: "Postcolonial criticism" },
  { key: "formalism", label: "Formalism" },
  { key: "structuralism", label: "Structuralism" },
  { key: "reader-response", label: "Reader-response criticism" },
] as const;

export const RUBRIC = [
  { key: "knowledge", label: "Subject knowledge", weight: 25, description: "Accuracy and depth of literary/linguistic knowledge." },
  { key: "relevance", label: "Relevance", weight: 20, description: "Directly addresses every part of the question." },
  { key: "organisation", label: "Organisation & coherence", weight: 15, description: "Clear introduction, logical flow, conclusion." },
  { key: "evidence", label: "Evidence & examples", weight: 15, description: "Apt references, examples, quotations, critics." },
  { key: "language", label: "Academic language", weight: 10, description: "Formal register, accurate grammar, terminology." },
  { key: "analysis", label: "Critical analysis", weight: 15, description: "Argument, evaluation and original insight beyond description." },
] as const;

export const WRITING_AREAS = [
  { key: "grammar", label: "Grammar" },
  { key: "vocabulary", label: "Vocabulary" },
  { key: "coherence", label: "Coherence & cohesion" },
  { key: "paragraphs", label: "Paragraph organisation" },
  { key: "thesis", label: "Thesis statement" },
  { key: "tone", label: "Academic tone" },
] as const;
