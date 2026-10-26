// Sends a private reply to a comment (Instagram API with Instagram Login).
export async function sendPrivateReply(igId, commentId, text) {
  const version = process.env.GRAPH_VERSION || "v23.0";
  const res = await fetch(`https://graph.instagram.com/${version}/${igId}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.IG_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      recipient: { comment_id: commentId },
      message: { text },
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error?.message || `HTTP ${res.status}`);
  }
  return data;
}
