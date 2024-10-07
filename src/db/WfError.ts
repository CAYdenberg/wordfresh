export class WfError extends Error {
  public status: number;
  public isWfError: true;

  constructor(status: number, message?: string) {
    super(message);
    this.status = status;
    this.isWfError = true;
  }

  public toHttp() {
    return new Response(
      JSON.stringify({
        message: this.message,
      }),
      {
        status: this.status,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }
}
