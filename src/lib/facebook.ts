/**
 * Facebook Graph API client for auto-posting to FB Group.
 *
 * Environment variables (set on production, not required for dev):
 *   FB_ACCESS_TOKEN  – Page/User access token with publish_to_groups permission
 *   FB_GROUP_ID      – Target Facebook Group ID
 *
 * When either variable is missing the client logs a warning and silently
 * skips the post (graceful degradation, no errors thrown to callers).
 */

const FB_GRAPH_URL = "https://graph.facebook.com/v19.0";

interface ShareToGroupParams {
  incidentType: string;
  severity: number;
  guestId: string;
}

interface FacebookPostResult {
  success: boolean;
  postId?: string;
  skipped?: boolean;
  error?: string;
}

/**
 * Map incident_type DB values to human-readable labels.
 */
const INCIDENT_LABELS: Record<string, string> = {
  damage: "Property Damage",
  theft: "Theft",
  noise: "Noise Complaint",
  fraud: "Fraud",
  no_show: "No Show",
  other: "Other",
};

function getConfig(): { token: string; groupId: string } | null {
  const token = process.env.FB_ACCESS_TOKEN;
  const groupId = process.env.FB_GROUP_ID;

  if (!token || !groupId) {
    console.warn(
      "[facebook] FB_ACCESS_TOKEN or FB_GROUP_ID not set — skipping FB post"
    );
    return null;
  }

  return { token, groupId };
}

/**
 * Build the post message. Contains ONLY public info — no personal data.
 */
function buildPostMessage(
  params: ShareToGroupParams,
  baseUrl: string
): string {
  const typeLabel = INCIDENT_LABELS[params.incidentType] ?? params.incidentType;
  const guestUrl = `${baseUrl}/guest/${params.guestId}`;

  return [
    "🚨 Nový report na Host Blacklist",
    "",
    `Typ: ${typeLabel}`,
    `Závažnosť: ${params.severity}/5`,
    "",
    guestUrl,
  ].join("\n");
}

/**
 * Post a new report notification to the configured Facebook Group.
 *
 * Returns `{ success: true, postId }` on success,
 * `{ success: true, skipped: true }` when env vars are missing,
 * or `{ success: false, error }` on API failure.
 */
export async function shareToFacebookGroup(
  params: ShareToGroupParams,
  baseUrl: string
): Promise<FacebookPostResult> {
  const config = getConfig();

  if (!config) {
    return { success: true, skipped: true };
  }

  const message = buildPostMessage(params, baseUrl);

  try {
    const response = await fetch(
      `${FB_GRAPH_URL}/${config.groupId}/feed`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          access_token: config.token,
        }),
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(
        `[facebook] Graph API error ${response.status}: ${errorBody}`
      );
      return {
        success: false,
        error: `Facebook API responded with ${response.status}`,
      };
    }

    const data = (await response.json()) as { id?: string };
    return { success: true, postId: data.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[facebook] Network error: ${message}`);
    return { success: false, error: message };
  }
}
