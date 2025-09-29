import axios from "axios";
import FormData from "form-data";
import asyncHandler from "../utils/asyncHandler.js"; 
import apiResponse from "../utils/apiResponse.js";
import { sendTextMsg, markAsRead } from "../function/index.js";
import ConversationService from "../services/conversation.service.js";

const webhook = asyncHandler(async (req, res) => {
  try {
    const {
      message,
      contact,
      type,
      status,
      sender_id,
      whatsapp_message_id,
      contact_id,
      thread_id,
      is_sent_to_contact,
      is_delivered_to_contact,
      is_read_by_contact,
      is_read,
      is_failed,
      error_response,
      in_replay_to,
      reaction_emoji,
      user_reaction_emoji
    } = req.body;

    console.log("📩 Incoming webhook body:", req.body);

    // Save incoming message to database
    try {
      await ConversationService.saveIncomingMessage(req.body);
    } catch (dbError) {
      console.error("❌ Database error:", dbError.message);
      // Continue processing even if database save fails
    }

    if (type === "text") {
      const textMsg = message?.text?.body?.trim();
      if (textMsg) {
        // Get conversation context
        const conversationContext = await ConversationService.getConversationContext(contact_id);
        
        console.log("💬 Conversation context:", {
          hasPreviousConversation: conversationContext.hasPreviousConversation,
          messageCount: conversationContext.messageCount
        });

        // Mark message as read first (blue tick)
        try {
          await markAsRead(whatsapp_message_id);
          console.log("✅ Message marked as read:", whatsapp_message_id);
        } catch (markError) {
          console.error("❌ Error marking message as read:", markError.message);
        }

        // Create response based on conversation context
        let responseMessage = textMsg;
        
        if (conversationContext.hasPreviousConversation) {
          // Get conversation summary for context
          const conversationSummary = await ConversationService.getConversationSummary(contact_id);
          console.log("📋 Previous conversation context:", conversationSummary);
          
          // You can customize the response based on previous conversation
          responseMessage = `Thank you for your message: "${textMsg}". I can see we've spoken before. How can I help you today?`;
        } else {
          // First time customer
          responseMessage = `Hello! Thank you for your message: "${textMsg}". This is your first time contacting us. How can I assist you today?`;
        }

        // Send response
        const response = await sendTextMsg(sender_id, responseMessage);
        console.log("📤 Response sent:", response);
        
        // Save outgoing message to database
        try {
          await ConversationService.saveOutgoingMessage({
            contact_id,
            sender_id: 'system', // or your agent ID
            receiver_id: sender_id,
            message_content: responseMessage,
            message_type: 'text',
            status: 'sent',
            thread_id,
            contact_name: contact?.name,
            contact_phone: contact?.phone_no,
            contact_wa_id: contact?.wa_id
          });
          console.log("✅ Outgoing message saved to database:", responseMessage);
        } catch (dbError) {
          console.error("❌ Error saving outgoing message:", dbError.message);
        }
        
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
