export type LabTopic = { key: string; label: string; blurb: string };

export const LAB_TOPICS: LabTopic[] = [
  { key: "phonetics", label: "Phonetics & IPA", blurb: "Speech sounds, articulation and IPA transcription." },
  { key: "phonology", label: "Phonology & Minimal Pairs", blurb: "Phonemes, allophones and sound patterns." },
  { key: "morphology", label: "Morphology", blurb: "Morphemes, affixes and word formation." },
  { key: "syntax", label: "Syntax", blurb: "Phrase structure, clauses and sentence types." },
  { key: "semantics", label: "Semantics", blurb: "Meaning, lexical relations and sense." },
  { key: "pragmatics", label: "Pragmatics & Speech Acts", blurb: "Context, implicature and speech acts." },
  { key: "sociolinguistics", label: "Sociolinguistics", blurb: "Language variation, dialect and identity." },
  { key: "discourse", label: "Discourse & CDA", blurb: "Discourse analysis and Critical Discourse Analysis." },
  { key: "corpus", label: "Corpus Linguistics", blurb: "Corpora, concordances, frequency and collocation." },
];

export const labTopic = (key: string) => LAB_TOPICS.find((t) => t.key === key);
