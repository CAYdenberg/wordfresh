import { datetime } from "ptera";

interface HumanDateTimeProps {
  date?: string;
  /* See format options here: https://tak-iwamoto.github.io/ptera/format.html */
  format: string;
}

export function HumanDateTime({ date }: HumanDateTimeProps) {
  if (!date) return null;

  return (
    <time dateTime={date}>
      {datetime(date).format("MMM d, YYYY")}
    </time>
  );
}