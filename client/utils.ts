export const classNames = (
  ...classNames: (string | null | false | undefined)[]
) => {
  return classNames.filter(Boolean).join(" ");
};
