/**
 * @author SaltedFish-No1
 * @description 将 contentTemplate 中的 ___XXX___ 占位符归一化为 {{blankId}} 格式。
 */

/**
 * 归一化填空题 contentTemplate 中的占位符格式。
 *
 * AI 生成的模板可能使用 `___BLANK_1___` 而非 `{{b1}}`，
 * 此函数按出现顺序将 `___XXX___` 替换为对应 blank 的 `{{id}}`。
 */
export function normalizeCompletionTemplate(
  template: string,
  blanks: ReadonlyArray<{ id: string }>
): string {
  if (/\{\{[^}]+\}\}/.test(template)) return template;

  const placeholderRegex = /___[A-Za-z0-9_]+___/g;
  let idx = 0;
  return template.replace(placeholderRegex, () => {
    const blank = blanks[idx++];
    return blank ? `{{${blank.id}}}` : '';
  });
}
