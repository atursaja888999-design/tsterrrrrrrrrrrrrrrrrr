import axios from "axios";
import crypto from "crypto";

const baseURL = process.env.UNIPLAY_BASE_URL;
const apiKey = process.env.UNIPLAY_API_KEY;

if (!baseURL || !apiKey) {
  throw new Error(
    "UNIPLAY_BASE_URL atau UNIPLAY_API_KEY belum diisi di file .env"
  );
}

function getTimestamp() {
  const now = new Date();

  const pad = (value) => String(value).padStart(2, "0");

  return [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate())
  ].join("-") + " " + [
    pad(now.getHours()),
    pad(now.getMinutes()),
    pad(now.getSeconds())
  ].join(":");
}

function makeSignature() {
  const timestamp = getTimestamp();

  const payload = {
    api_key: apiKey,
    timestamp
  };

  const jsonString = JSON.stringify(payload);
  const hmacKey = `${apiKey}|${jsonString}`;

  const signature = crypto
    .createHmac("sha512", hmacKey)
    .update(jsonString)
    .digest("hex");

  return {
    timestamp,
    signature
  };
}

function makeHeaders(extraHeaders = {}) {
  const { timestamp, signature } = makeSignature();

  return {
    "Content-Type": "application/json",
    "Accept": "application/json",

    /*
      Nama header ini HARUS Anda samakan dengan Postman UniPlay:
      misalnya UPL-SIGNATURE / UPL-TIMESTAMP / API-KEY,
      atau mungkin api-key / signature / timestamp.
    */
    "UPL-SIGNATURE": signature,
    "UPL-TIMESTAMP": timestamp,
    "X-API-KEY": apiKey,

    ...extraHeaders
  };
}

async function requestUniPlay({
  method = "GET",
  endpoint,
  data = null,
  params = null
}) {
  try {
    const response = await axios({
      method,
      url: `${baseURL}${endpoint}`,
      headers: makeHeaders(),
      data,
      params,
      timeout: 30000
    });

    return response.data;
  } catch (error) {
    const detail = error.response?.data || {
      message: error.message || "Gagal menghubungi UniPlay API"
    };

    console.error("UniPlay API error:", detail);

    throw {
      status: error.response?.status || 500,
      detail
    };
  }
}

export async function getProducts() {
  const endpoint = process.env.UNIPLAY_ENDPOINT_PRODUCTS;

  /*
    Sesuaikan bila endpoint UniPlay membutuhkan body POST,
    kategori, game_id, atau access token tambahan.
  */
  return requestUniPlay({
    method: "GET",
    endpoint
  });
}

export async function createInquiry(payload) {
  const endpoint = process.env.UNIPLAY_ENDPOINT_INQUIRY;

  /*
    Contoh umum payload:
    {
      product_code: "ML86",
      user_id: "12345678",
      zone_id: "1234",
      customer_no: "..."
    }

    Cocokkan nama field dengan dokumentasi UniPlay Anda.
  */
  return requestUniPlay({
    method: "POST",
    endpoint,
    data: {
      api_key: apiKey,
      ...payload
    }
  });
}

export async function createOrder(payload) {
  const endpoint = process.env.UNIPLAY_ENDPOINT_ORDER;

  /*
    Contoh umum payload:
    {
      ref_id: "ORDER-...",
      product_code: "ML86",
      user_id: "12345678",
      zone_id: "1234",
      inquiry_id: "...",
      pin: "..."
    }
  */
  return requestUniPlay({
    method: "POST",
    endpoint,
    data: {
      api_key: apiKey,
      pin: process.env.UNIPLAY_PIN,
      ...payload
    }
  });
}

export async function checkOrderStatus(payload) {
  const endpoint = process.env.UNIPLAY_ENDPOINT_STATUS;

  return requestUniPlay({
    method: "POST",
    endpoint,
    data: {
      api_key: apiKey,
      ...payload
    }
  });
}
