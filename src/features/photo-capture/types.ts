import { z } from 'zod';

export const PhotoCaptureResultSchema = z.object({
  words: z.array(
    z.object({
      word: z
        .string()
        .describe('The English word in lowercase base form (lemma)'),
      pos: z
        .string()
        .optional()
        .describe('Part of speech, e.g. noun, verb, adjective'),
      definition: z
        .string()
        .optional()
        .describe('Brief English definition of the word'),
    })
  ),
});

export type ExtractedWord = z.infer<
  typeof PhotoCaptureResultSchema
>['words'][number];
