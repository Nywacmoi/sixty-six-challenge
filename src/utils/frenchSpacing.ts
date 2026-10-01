// The app's own strings use a narrow no-break space before ? ! : ; — the
// French rule, and the thing that stops the mark being orphaned on its own
// line. Text written by the model at runtime doesn't, so it goes through
// this before it's shown.
export function frenchSpacing(text: string): string {
  return text.replace(/ ([?!:;»])/g, ' $1').replace(/« /g, '« ');
}
