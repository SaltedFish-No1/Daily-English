import { z } from 'zod';

export const PhotoCaptureResultSchema = z.object({
  words: z.array(
    z.object({
      word: z
        .string()
        .describe('The English word in lowercase base form (lemma)'),
      pos: z
        .string()
        .nullable()
        .describe(
          'Part of speech, e.g. noun, verb, adjective, or null if unknown'
        ),
      definition: z
        .string()
        .nullable()
        .describe('Brief English definition of the word, or null if unknown'),
    })
  ),
});

export type ExtractedWord = z.infer<
  typeof PhotoCaptureResultSchema
>['words'][number];
