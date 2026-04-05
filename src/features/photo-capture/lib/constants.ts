export const PHOTO_CAPTURE_PREFIX = 'photo-capture-';

export function isPhotoCaptureOccurrence(lessonSlug: string): boolean {
  return lessonSlug.startsWith(PHOTO_CAPTURE_PREFIX);
}
