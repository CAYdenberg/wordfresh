export const HttpError = (status: number, message?: string) => {
  return new Response(
    JSON.stringify({
      message,
    }),
    {
      status,
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
};
