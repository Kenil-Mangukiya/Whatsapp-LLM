import axios from "axios";
import FormData from "form-data";
import asyncHandler from "../utils/asyncHandler.js"; 
import apiResponse from "../utils/apiResponse.js";
import { sendTextMsg, markAsRead } from "../function/index.js";

const webhook = asyncHandler(async (req, res) => {
  try {
    const {
      message,
      contact,
      type,
      status,
      sender_id,
      whatsapp_message_id,
    } = req.body;

    console.log("📩 Incoming webhook body:", req.body);

    if (type === "text") {
      const textMsg = message?.text?.body?.trim() + "Kenil";
      if (textMsg) {
        await sendTextMsg(sender_id, textMsg);
      } else {
        console.warn("⚠️ Empty text message received.");
      }
    }

    // if (type === "order") {
    //   const product_items = message?.order?.product_items || [];
    //   console.log("🛒 Order received:", product_items);
    // }

    console.log("📌 Status:", status);

    res.status(200).json({
      success: true,
      message: "Webhook processed successfully",
    });
  } catch (error) {
    console.error("❌ Webhook error:", error.message);

    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    } else {
      console.error("Stack:", error.stack);
    }

    res.status(error?.response?.status || 500).json({
      success: false,
      message: error?.response?.data?.message || error.message || "Internal Server Error",
    });
  }
});



export { webhook };
