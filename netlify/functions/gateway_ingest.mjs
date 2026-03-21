export default async () => {
  return new Response(
    JSON.stringify({ ok: true, message: "gateway_ingest works" }),
    {
      status: 200,
      headers: { "content-type": "application/json" },
    }
  );
};