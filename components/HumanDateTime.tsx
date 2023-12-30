import { datetime } from "https://deno.land/x/ptera@v1.0.2/mod.ts";

interface HumanDateTimeProps {
  date?: string;
  /* See format options here: https://tak-iwamoto.github.io/ptera/format.html */
  format: string;
}

export default function HumanDateTime({ date }: HumanDateTimeProps) {
  if (!date) return null;

  return (
    <time dateTime={date}>
      {datetime(date).format("MMM d, YYYY")}
    </time>
  );
}