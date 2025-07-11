export async function register() {
  console.log(
    "[INSTRUMENATION] - process.env.NEXT_RUNTIME: ",
    process.env.NEXT_RUNTIME,
  );

  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./lib/orpc.server");
  }
}
