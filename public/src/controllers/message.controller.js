import axios from "axios";
import FormData from "form-data";
import asyncHandler from "../utils/asyncHandler.js"; 
import apiResponse from "../utils/apiResponse.js";
import { sendTextMsg, markAsRead, sendBinSizeTemplate } from "../function/index.js";
import ConversationService from "../services/conversation.service.js";
import { chatGPT } from "../function/ai.js";

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

        // Get conversation history and format for AI
        let responseMessage;
        let structuredData = null;
        
        if (conversationContext.hasPreviousConversation) {
          // Get last 5 messages for context
          const lastMessages = await ConversationService.getLastMessages(contact_id, 10);
          
          // Find the last complete details from previous messages
          let lastKnownDetails = null;
          for (let i = lastMessages.length - 1; i >= 0; i--) {
            if (lastMessages[i].sender_type === 'agent' && lastMessages[i].details) {
              lastKnownDetails = lastMessages[i].details;
              break;
            }
          }
          
          // Format conversation history for AI
          let conversationHistory = "";
          lastMessages.forEach(msg => {
            const sender = msg.sender_type === 'contact' ? 'customer' : 'ai';
            conversationHistory += `${sender} : "${msg.message_content}"\n`;
          });
          
          // Add previous details to conversation history
          if (lastKnownDetails) {
            conversationHistory += `\nPreviously Collected Data: ${JSON.stringify(lastKnownDetails)}\n`;
          }
          
          console.log("📋 Conversation history for AI:", conversationHistory);
          console.log("📊 Last known details:", lastKnownDetails);
          
          // Send to AI with conversation context
          const aiResponse = await chatGPT({
            message: textMsg,
            conversationHistory: conversationHistory,
            userInfo: {
              contact_id,
              contact_name: contact?.name,
              contact_phone: contact?.phone_no
            }
          });
          
          if (aiResponse.success) {
            responseMessage = aiResponse.message;
            structuredData = aiResponse.structuredData;
            console.log("🤖 AI Response:", responseMessage);
            console.log("📊 Structured Data:", structuredData);
          } else {
            responseMessage = "I'm sorry, I'm having trouble processing your request right now. Please try again.";
            console.error("❌ AI Error:", aiResponse.error);
          }
        } else {
          // First time customer - send to AI without conversation history
          const aiResponse = await chatGPT({
            message: textMsg,
            conversationHistory: "",
            userInfo: {
              contact_id,
              contact_name: contact?.name,
              contact_phone: contact?.phone_no
            }
          });
          
          if (aiResponse.success) {
            responseMessage = aiResponse.message;
            structuredData = aiResponse.structuredData;
            console.log("🤖 AI Response (New Customer):", responseMessage);
            console.log("📊 Structured Data:", structuredData);
          } else {
            responseMessage = "Hello! Thank you for contacting us. How can I assist you today?";
            console.error("❌ AI Error:", aiResponse.error);
          }
        }

        // Check if user wants subscription and has address
        const hasAddress = structuredData && structuredData.address;
        const wantsSubscription = structuredData && structuredData.wants_subscription === true;
        const hasBinSize = structuredData && structuredData.bin_size;
        
        // Check if all required information is collected (different paths for subscribers vs non-subscribers)
        const isCompleteForNonSubscriber = structuredData && 
          structuredData.fullname && 
          structuredData.block && 
          structuredData.ward_number && 
          structuredData.property_type && 
          structuredData.address && 
          structuredData.wants_subscription === false &&
          structuredData.free_time;

        const isCompleteForSubscriber = structuredData && 
          structuredData.fullname && 
          structuredData.block && 
          structuredData.ward_number && 
          structuredData.property_type && 
          structuredData.address && 
          structuredData.wants_subscription === true &&
          structuredData.bin_size;

        // Handle subscription decision
        if (hasAddress && structuredData.wants_subscription === true && !hasBinSize) {
          // User wants subscription but hasn't selected bin size yet
          console.log("🎯 User wants subscription, sending bin size template");
          await sendBinSizeTemplate(sender_id);
          
          // Save the subscription decision
          await ConversationService.saveOutgoingMessage({
            contact_id,
            sender_id: 'system',
            receiver_id: sender_id,
            message_content: "Great! Let me help you choose the right bin size for your needs.",
            message_type: 'text',
            status: 'sent',
            thread_id,
            contact_name: contact?.name,
            contact_phone: contact?.phone_no,
            contact_wa_id: contact?.wa_id,
            structured_data: JSON.stringify(structuredData)
          });
          
          return res.status(200).json({ success: true });
        }

        // Handle final completion for non-subscribers
        if (isCompleteForNonSubscriber) {
          const summaryMessage = `📋 Here's your information:

👤 Full Name: ${structuredData.fullname}
🏘️ Block: ${structuredData.block}
📍 Ward Number: ${structuredData.ward_number}
🏠 Property Type: ${structuredData.property_type}
🏡 Address: ${structuredData.address}
📞 Callback Time: ${structuredData.free_time}

Our team will reach out to you soon! 😊`;
          
          await sendTextMsg(sender_id, summaryMessage);
          console.log("📋 Final summary sent for non-subscriber");
          
          await ConversationService.saveOutgoingMessage({
            contact_id,
            sender_id: 'system',
            receiver_id: sender_id,
            message_content: summaryMessage,
            message_type: 'text',
            status: 'sent',
            thread_id,
            contact_name: contact?.name,
            contact_phone: contact?.phone_no,
            contact_wa_id: contact?.wa_id,
            structured_data: JSON.stringify(structuredData)
          });
          
          return res.status(200).json({ success: true });
        }

        // Handle final completion for subscribers
        if (isCompleteForSubscriber) {
          const summaryMessage = `📋 Here's your subscription details:

👤 Full Name: ${structuredData.fullname}
🏘️ Block: ${structuredData.block}
📍 Ward Number: ${structuredData.ward_number}
🏠 Property Type: ${structuredData.property_type}
🏡 Address: ${structuredData.address}
🗑️ Bin Size: ${structuredData.bin_size}

Your subscription is confirmed! Our team will contact you soon. 😊`;
          
          await sendTextMsg(sender_id, summaryMessage);
          console.log("📋 Final summary sent for subscriber");
          
          await ConversationService.saveOutgoingMessage({
            contact_id,
            sender_id: 'system',
            receiver_id: sender_id,
            message_content: summaryMessage,
            message_type: 'text',
            status: 'sent',
            thread_id,
            contact_name: contact?.name,
            contact_phone: contact?.phone_no,
            contact_wa_id: contact?.wa_id,
            structured_data: JSON.stringify(structuredData)
          });
          
          return res.status(200).json({ success: true });
        }

        // Send normal response for incomplete information
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
            contact_wa_id: contact?.wa_id,
            structured_data: structuredData ? JSON.stringify(structuredData) : null
          });
          console.log("💾 AI response saved to database with structured data");
        } catch (dbError) {
          console.error("❌ Error saving outgoing message:", dbError.message);
        }
        
      } else {
        console.warn("⚠️ Empty text message received.");
      }
    }

    // Handle interactive messages (bin size selection)
    if (type === "interactive") {
      const interactiveData = message?.interactive;
      
      if (interactiveData?.type === "list_reply") {
        const selectedOption = interactiveData.list_reply;
        console.log("🎯 User selected bin size:", selectedOption);
        
        // Get conversation context to update with bin size
        const conversationContext = await ConversationService.getConversationContext(contact_id);
        const lastMessages = await ConversationService.getLastMessages(contact_id, 10);
        
        // Find the last structured data
        let lastKnownDetails = null;
        for (let i = lastMessages.length - 1; i >= 0; i--) {
          if (lastMessages[i].sender_type === 'agent' && lastMessages[i].details) {
            lastKnownDetails = lastMessages[i].details;
            break;
          }
        }
        
        // Update structured data with bin size
        const updatedStructuredData = {
          ...lastKnownDetails,
          bin_size: selectedOption.id
        };
        
        console.log("📊 Updated structured data with bin size:", updatedStructuredData);
        
        // Check if subscription is now complete
        const isCompleteForSubscriber = updatedStructuredData && 
          updatedStructuredData.fullname && 
          updatedStructuredData.block && 
          updatedStructuredData.ward_number && 
          updatedStructuredData.property_type && 
          updatedStructuredData.address && 
          updatedStructuredData.wants_subscription === true &&
          updatedStructuredData.bin_size;

        if (isCompleteForSubscriber) {
          const summaryMessage = `📋 Here's your subscription details:

👤 Full Name: ${updatedStructuredData.fullname}
🏘️ Block: ${updatedStructuredData.block}
📍 Ward Number: ${updatedStructuredData.ward_number}
🏠 Property Type: ${updatedStructuredData.property_type}
🏡 Address: ${updatedStructuredData.address}
🗑️ Bin Size: ${selectedOption.title}

Your subscription is confirmed! Our team will contact you soon. 😊`;
          
          await sendTextMsg(sender_id, summaryMessage);
          console.log("📋 Final subscription summary sent");
          
          await ConversationService.saveOutgoingMessage({
            contact_id,
            sender_id: 'system',
            receiver_id: sender_id,
            message_content: summaryMessage,
            message_type: 'text',
            status: 'sent',
            thread_id,
            contact_name: contact?.name,
            contact_phone: contact?.phone_no,
            contact_wa_id: contact?.wa_id,
            structured_data: JSON.stringify(updatedStructuredData)
          });
        }
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
