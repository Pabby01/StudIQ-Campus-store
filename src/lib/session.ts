export function getSessionWalletFromReq(req: Request) {
  const raw = req.headers.get("cookie") ?? "";
  const match = raw.match(/(?:^|;\s)sid=([^;]+)/);
  return match ? match[1] : null;
}
