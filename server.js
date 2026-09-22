import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import crypto from "crypto";
import path from "path";
import { fileURLToPath } from "url";

import {
  getProducts,
  createInquiry,
  createOrder,
  checkOrderStatus
} from "./services/uniplay.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(helmet({
  contentSecurityPolicy: false
}));

app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

function sendApiError(res, error, defaultMessage) {
  const apiData = error?.detail || {};
  const responseCode = apiData?.code || apiData?.status || null;

  return res.status(error?.status || 500).json({
    success: false,
    message: apiData?.message || defaultMessage,
    code: responseCode,
    raw: apiData
  });
}

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Server top-up aktif"
  });
});

app.get("/api/products", async (req, res) => {
  try {
    const response = await getProducts();

    res.json({
      success: true,
      data: response
    });
  } catch (error) {
    sendApiError(res, error, "Gagal mengambil daftar produk UniPlay.");
  }
});

app.post("/api/inquiry", async (req, res) => {
  const {
    product_code,
    user_id,
    zone_id,
    customer_no
  } = req.body;

  if (!product_code || (!user_id && !customer_no)) {
    return res.status(400).json({
      success: false,
      message: "product_code dan user_id/customer_no wajib diisi."
    });
  }

  try {
    const response = await createInquiry({
      product_code,
      user_id,
      zone_id,
      customer_no
    });

    res.json({
      success: true,
      data: response
    });
  } catch (error) {
    sendApiError(res, error, "Inquiry akun game gagal.");
  }
});

app.post("/api/orders", async (req, res) => {
  const {
    product_code,
    user_id,
    zone_id,
    customer_no,
    inquiry_id,
    email,
    phone
  } = req.body;

  if (!product_code || (!user_id && !customer_no)) {
    return res.status(400).json({
      success: false,
      message: "Produk dan User ID/Nomor tujuan wajib diisi."
    });
  }

  const refId = `WEB-${Date.now()}-${crypto
    .randomBytes(3)
    .toString("hex")
    .toUpperCase()}`;

  try {
    const response = await createOrder({
      ref_id: refId,
      product_code,
      user_id,
      zone_id,
      customer_no,
      inquiry_id,
      email,
      phone
    });

    res.json({
      success: true,
      message: "Pesanan berhasil dikirim ke UniPlay.",
      ref_id: refId,
      data: response
    });
  } catch (error) {
    sendApiError(res, error, "Pesanan gagal diproses.");
  }
});

app.post("/api/orders/status", async (req, res) => {
  const { ref_id, invoice_id, transaction_id } = req.body;

  if (!ref_id && !invoice_id && !transaction_id) {
    return res.status(400).json({
      success: false,
      message: "Masukkan ref_id, invoice_id, atau transaction_id."
    });
  }

  try {
    const response = await checkOrderStatus({
      ref_id,
      invoice_id,
      transaction_id
    });

    res.json({
      success: true,
      data: response
    });
  } catch (error) {
    sendApiError(res, error, "Gagal memeriksa status transaksi.");
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(port, () => {
  console.log(`Server aktif di http://localhost:${port}`);
});
