/** A stage of the scraping pipeline. */
export type PipelineStage = 'discovery' | 'extraction' | 'output';

/** Progress reported by the pipeline while it runs. */
export type ProgressEvent =
  | { type: 'stageStart'; stage: PipelineStage }
  /** A page is about to be visited; `index`/`total` are set when the number of pages is known. */
  | { type: 'page'; stage: PipelineStage; url: string; index?: number; total?: number }
  | { type: 'stageEnd'; stage: PipelineStage; summary: string };

export type ProgressListener = (event: ProgressEvent) => void;

/** Ignores all progress events. */
export const noProgress: ProgressListener = () => {};
