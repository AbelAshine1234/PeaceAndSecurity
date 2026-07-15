import "dotenv/config";
import axios, { Method } from "axios";

type Cfg = { SMS_URL: string; SMS_TOKEN: string; SMS_SENDER: string };
type SendInput = { recipient: string; messageBody: string };
type SendResult = {
  ok: boolean;
  status: number;
  messageId?: string;
  error?: string;
  raw?: any;
};

const cfgFrom = (o?: Partial<Cfg>): Cfg => {
  const g = (global as any)?._CONFIG?._VALS ?? {};
  const cfg: Cfg = {
    SMS_URL: o?.SMS_URL ?? process.env.SMS_URL ?? g.SMS_URL ?? "",
    SMS_TOKEN: o?.SMS_TOKEN ?? process.env.SMS_TOKEN ?? g.SMS_TOKEN ?? "",
    SMS_SENDER: o?.SMS_SENDER ?? process.env.SMS_SENDER ?? g.SMS_SENDER ?? "",
  };
  if (!cfg.SMS_URL || !cfg.SMS_TOKEN || !cfg.SMS_SENDER)
    throw new Error("Missing SMS_URL/SMS_TOKEN/SMS_SENDER");
  return cfg;
};

const call = async <T>(
  method: Method,
  uri: string,
  { params, data }: { params?: Record<string, any>; data?: any } = {},
  override?: Partial<Cfg>,
): Promise<T> => {
  const c = cfgFrom(override);
  const base = c.SMS_URL.replace(/\/+$/, "");
  const path = uri.replace(/^\/+/, "");
  const qs = new URLSearchParams();
  Object.entries(params ?? {}).forEach(
    ([k, v]) => v != null && qs.append(k, String(v)),
  );
  const url = qs.toString() ? `${base}/${path}?${qs}` : `${base}/${path}`;
  console.log("url", url);
  const resp = await axios({
    method,
    url,
    headers: { Authorization: `Bearer ${c.SMS_TOKEN}` },
    data,
  });
  return resp.data as T;
};

export const sendSMS = async (
  p: SendInput,
  override?: Partial<Cfg>,
): Promise<SendResult> => {
  try {
    console.log("inside send sms service", p);
    const c = cfgFrom(override);
    const data = await call<any>(
      "GET",
      "send",
      {
        params: {
          sender: c.SMS_SENDER,
          to: p.recipient,
          message: p.messageBody,
        },
      },
      c,
    );
    //console.log("sms Data", data);
    const ok = data?.acknowledge === "success";
    const messageId =
      data?.response?.message_id ?? data?.message_id ?? data?.id;
    if (ok) return { ok: true, status: 201, messageId, raw: data };

    const err = data?.response?.errors || data?.error || "SMS Not Sent";
    return { ok: false, status: 400, error: String(err), raw: data };
  } catch (e: any) {
    console.log("error sms sending error", e);
    return {
      ok: false,
      status: 500,
      error: e?.message || "Failed to send SMS",
    };
  }
};
