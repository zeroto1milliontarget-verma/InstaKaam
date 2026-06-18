import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import Razorpay from "razorpay";
import dotenv from "dotenv";

dotenv.config();

let razorpayClient: Razorpay | null = null;

function getRazorpay() {
  if (!razorpayClient) {
    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    if (!key_id || !key_secret) {
      throw new Error("Razorpay credentials are not defined in environment variables.");
    }
    razorpayClient = new Razorpay({
      key_id,
      key_secret,
    });
  }
  return razorpayClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.post("/api/create-order", async (req, res) => {
    try {
      const { amount, currency = "INR", receipt = "receipt#1" } = req.body;
      const rzp = getRazorpay();
      
      const options = {
        amount: amount * 100, // amount in the smallest currency unit
        currency,
        receipt,
      };

      const order = await rzp.orders.create(options);
      
      res.json({
        orderId: order.id,
        keyId: process.env.RAZORPAY_KEY_ID,
        amount: options.amount,
        currency: options.currency
      });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message || "Failed to create order" });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
