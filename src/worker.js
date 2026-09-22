function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      "Cache-Control": "no-store",
      ...extraHeaders
    }
  });
}

function sanitizeText(value, maxLength = 150) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function getJakartaTimestamp() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23"
  }).formatToParts(new Date());

  const get = (type) => parts.find((part) => part.type === type)?.value;

  return `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get("minute")}:${get("second")}`;
}

function toHex(arrayBuffer) {
  return [...new Uint8Array(arrayBuffer)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

/*
  Signature menyesuaikan pola dokumentasi UniPlay:
  jsonString = JSON.stringify({ api_key, timestamp })
  hmacKey    = `${api_key}|${jsonString}`
  signature  = HMAC SHA-512 dari jsonString memakai hmacKey

  Harap cocokkan kembali pada collection Postman UniPlay akun Anda,
  terutama bentuk payload dan header endpoint.
*/
async function makeUniPlaySignature(env) {
  const timestamp = getJakartaTimestamp();

  const signatureBody = {
    api_key: env.UNIPLAY_API_KEY,
    timestamp
  };

  const jsonString = JSON.stringify(signatureBody);
  const hmacKey = `${env.UNIPLAY_API_KEY}|${jsonString}`;

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(hmacKey),
    {
      name: "HMAC",
      hash: "SHA-512"
    },
    false,
    ["sign"]
  );

  const signed = await crypto.subtle.sign(
    "HMAC",
    cryptoKey,
    new TextEncoder().encode(jsonString)
  );

  return {
    timestamp,
    signature: toHex(signed)
  };
}

async function uniplayRequest(env, endpoint, options = {}) {
  const {
    method = "GET",
    payload = null
  } = options;

  if (!env.UNIPLAY_BASE_URL || !env.UNIPLAY_API_KEY) {
    throw new Error("Konfigurasi UniPlay belum lengkap pada Cloudflare Secret.");
  }

  const { timestamp, signature } = await makeUniPlaySignature(env);

  const url = new URL(endpoint, env.UNIPLAY_BASE_URL);

  /*
    Header dapat berbeda tergantung API UniPlay.
    Samakan persis dengan API docs / Postman account Anda.
  */
  const headers = {
    "Accept": "application/json",
    "Content-Type": "application/json",
    "UPL-SIGNATURE": signature,
    "UPL-TIMESTAMP": timestamp,
    "X-API-KEY": env.UNIPLAY_API_KEY
  };

  const response = await fetch(url.toString(), {
    method,
    headers,
    body: payload ? JSON.stringify(payload) : undefined
  });

  const rawText = await response.text();

  let data;
  try {
    data = JSON.parse(rawText);
  } catch {
    data = {
      message: rawText || "Respons UniPlay bukan JSON."
    };
  }

  if (!response.ok) {
    const error = new Error(
      data?.message || `UniPlay API error: HTTP ${response.status}`
    );

    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

function createReference() {
  const random = crypto.randomUUID()
    .replaceAll("-", "")
    .slice(0, 8)
    .toUpperCase();

  return `WEB-${Date.now()}-${random}`;
}

function getPublicErrorMessage(error) {
  const code = error?.data?.code || error?.data?.status;

  if (String(code) === "1000") {
    return "Saldo UniPlay Point tidak mencukupi.";
  }

  if (String(code) === "1100") {
    return "Kode produk tidak valid.";
  }

  if (String(code) === "1200") {
    return "Channel pembayaran tidak valid.";
  }

  if (String(code) === "400") {
    return "Signature API ditolak. Cek konfigurasi integrasi UniPlay.";
  }

  return error?.message || "Terjadi gangguan saat menghubungi layanan top up.";
}

async function apiRouter(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  if (path === "/api/health" && method === "GET") {
    return json({
      success: true,
      message: "Cloudflare Worker aktif"
    });
  }

  if (path === "/api/products" && method === "GET") {
    try {
      const data = await uniplayRequest(
        env,
        env.UNIPLAY_ENDPOINT_PRODUCTS,
        { method: "GET" }
      );

      return json({
        success: true,
        data
      });
    } catch (error) {
      console.error("UniPlay products error:", error.data || error.message);

      return json({
        success: false,
        message: getPublicErrorMessage(error)
      }, error.status || 500);
    }
  }

  if (path === "/api/inquiry" && method === "POST") {
    let body;

    try {
      body = await request.json();
    } catch {
      return json({
        success: false,
        message: "Body JSON tidak valid."
      }, 400);
    }

    const productCode = sanitizeText(body.product_code, 100);
    const userId = sanitizeText(body.user_id, 100);
    const zoneId = sanitizeText(body.zone_id, 100);
    const customerNo = sanitizeText(body.customer_no, 100);

    if (!productCode || (!userId && !customerNo)) {
      return json({
        success: false,
        message: "product_code dan User ID/Nomor tujuan wajib diisi."
      }, 400);
    }

    try {
      const data = await uniplayRequest(
        env,
        env.UNIPLAY_ENDPOINT_INQUIRY,
        {
          method: "POST",
          payload: {
            api_key: env.UNIPLAY_API_KEY,
            product_code: productCode,
            user_id: userId,
            zone_id: zoneId,
            customer_no: customerNo
          }
        }
      );

      return json({
        success: true,
        data
      });
    } catch (error) {
      console.error("UniPlay inquiry error:", error.data || error.message);

      return json({
        success: false,
        message: getPublicErrorMessage(error)
      }, error.status || 500);
    }
  }

  if (path === "/api/orders" && method === "POST") {
    let body;

    try {
      body = await request.json();
    } catch {
      return json({
        success: false,
        message: "Body JSON tidak valid."
      }, 400);
    }

    const productCode = sanitizeText(body.product_code, 100);
    const userId = sanitizeText(body.user_id, 100);
    const zoneId = sanitizeText(body.zone_id, 100);
    const customerNo = sanitizeText(body.customer_no, 100);
    const inquiryId = sanitizeText(body.inquiry_id, 100);
    const email = sanitizeText(body.email, 150);
    const phone = sanitizeText(body.phone, 40);

    if (!productCode || (!userId && !customerNo)) {
      return json({
        success: false,
        message: "Produk dan User ID/Nomor tujuan wajib diisi."
      }, 400);
    }

    const referenceId = createReference();

    try {
      const data = await uniplayRequest(
        env,
        env.UNIPLAY_ENDPOINT_ORDER,
        {
          method: "POST",
          payload: {
            api_key: env.UNIPLAY_API_KEY,
            pin: env.UNIPLAY_PIN,
            ref_id: referenceId,
            product_code: productCode,
            user_id: userId,
            zone_id: zoneId,
            customer_no: customerNo,
            inquiry_id: inquiryId,
            email,
            phone
          }
        }
      );

      return json({
        success: true,
        message: "Pesanan berhasil dikirim.",
        ref_id: referenceId,
        data
      });
    } catch (error) {
      console.error("UniPlay order error:", error.data || error.message);

      return json({
        success: false,
        message: getPublicErrorMessage(error)
      }, error.status || 500);
    }
  }

  if (path === "/api/orders/status" && method === "POST") {
    let body;

    try {
      body = await request.json();
    } catch {
      return json({
        success: false,
        message: "Body JSON tidak valid."
      }, 400);
    }

    const refId = sanitizeText(body.ref_id, 100);
    const invoiceId = sanitizeText(body.invoice_id, 100);
    const transactionId = sanitizeText(body.transaction_id, 100);

    if (!refId && !invoiceId && !transactionId) {
      return json({
        success: false,
        message: "Masukkan nomor referensi atau ID transaksi."
      }, 400);
    }

    try {
      const data = await uniplayRequest(
        env,
        env.UNIPLAY_ENDPOINT_STATUS,
        {
          method: "POST",
          payload: {
            api_key: env.UNIPLAY_API_KEY,
            ref_id: refId,
            invoice_id: invoiceId,
            transaction_id: transactionId
          }
        }
      );

      return json({
        success: true,
        data
      });
    } catch (error) {
      console.error("UniPlay status error:", error.data || error.message);

      return json({
        success: false,
        message: getPublicErrorMessage(error)
      }, error.status || 500);
    }
  }

  return null;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/")) {
      const apiResponse = await apiRouter(request, env);

      if (apiResponse) {
        return apiResponse;
      }

      return json({
        success: false,
        message: "Endpoint API tidak ditemukan."
      }, 404);
    }

    return env.ASSETS.fetch(request);
  }
};
