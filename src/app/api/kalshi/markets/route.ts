export async function GET() {
  const markets: ReadonlyArray<{ id: string; title: string }> = [];
  return Response.json(markets);
}
