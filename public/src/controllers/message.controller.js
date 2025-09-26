import axios from "axios";
import FormData from "form-data";
import asyncHandler from "../utils/asyncHandler.js"; 
import apiResponse from "../utils/apiResponse.js";
import { sendTextMsg, markAsRead, sendFlowTemp, sendTemp, sendTempImage, orderNoGen, invoiceNoGen } from "../function/index.js";

const webhook = asyncHandler(async (req, res) => {
    try {
      const { message, contact, type, status, sender_id, whatsapp_message_id } = req.body;
      if (type == "text") {
        const textMsg = message?.text?.body;
        if(textMsg != ''){
              sendTextMsg(sender_id, textMsg);
        }
        //console.log({ textMsg });
      }
      if(whatsapp_message_id){
          markAsRead(whatsapp_message_id);
      }
      if (type == "order") {
        const product_items = message?.order?.product_items;
        console.log({ product_items });
      }
      console.log({status});
      res
        .status(200)
        .json({ success: true, message: "Message Send Successfully" });
    } catch (error) {
      console.log(error);
      res
        .status(error?.body?.statusCode || 500)
        .json({ message: error?.response?.data?.message });
    }
  });


export { webhook };
