import { AccessToken } from "livekit-server-sdk";

export const getToken = async (req, res) => {
  const { room, username } = req.query;

  if (!room || !username) {
    return res.status(400).json({ error: "room and username query params are required" });
  }

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!apiKey || !apiSecret) {
    return res.status(500).json({ error: "LiveKit credentials are not configured on the server" });
  }

  const at = new AccessToken(apiKey, apiSecret, {
    identity: username,
    name: username,
    ttl: "1h",
  });

  at.addGrant({
    room,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    roomCreate: true,
  });

  const token = await at.toJwt();

  return res.json({
    token,
    url: process.env.LIVEKIT_URL,
  });
};
