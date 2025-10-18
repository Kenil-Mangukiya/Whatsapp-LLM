import axios from "axios";
import FormData from "form-data";
import asyncHandler from "../utils/asyncHandler.js"; 
import apiResponse from "../utils/apiResponse.js";
import { sendTextMsg, markAsRead, sendBinSizeTemplate, sendFrequencyTemplate, sendPickupDaysTemplate, sendBigPurchaseTemplate, createUser, fetchWards, fetchBlocks, sendWardNumberTemplate, sendPropertyTypeTemplate } from "../function/index.js";
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

        // Check if we need to send ward number template
        if (structuredData && structuredData.block === 6 && !structuredData.ward_number) {
          console.log("🎯 User provided block 6, sending ward number template");
          await sendWardNumberTemplate(sender_id);
          
          await ConversationService.saveOutgoingMessage({
            contact_id,
            sender_id: 'system',
            receiver_id: sender_id,
            message_content: "📍 Please select your ward number from the options above.",
            message_type: 'template',
            status: 'sent',
            thread_id,
            contact_name: contact?.name,
            contact_phone: contact?.phone_no,
            contact_wa_id: contact?.wa_id,
            structured_data: JSON.stringify(structuredData)
          });
          
          return res.status(200).json({ success: true });
        }

        // Check if we need to send property type template
        if (structuredData && structuredData.ward_number && !structuredData.property_type) {
          console.log("🎯 User provided ward number, sending property type template");
          await sendPropertyTypeTemplate(sender_id);
          
          await ConversationService.saveOutgoingMessage({
            contact_id,
            sender_id: 'system',
            receiver_id: sender_id,
            message_content: "🏠 Please select your property type from the options above.",
            message_type: 'template',
            status: 'sent',
            thread_id,
            contact_name: contact?.name,
            contact_phone: contact?.phone_no,
            contact_wa_id: contact?.wa_id,
            structured_data: JSON.stringify(structuredData)
          });
          
          return res.status(200).json({ success: true });
        }

        // Create user in Dortibox API if address is collected
        if (structuredData && structuredData.address && structuredData.block && structuredData.ward_number) {
          try {
            console.log("🚀 Creating user in Dortibox API...");
            
            // Extract mobile number from contact
            const mobile = contact?.phone_no?.replace(/\D/g, '') || contact?.wa_id?.replace(/\D/g, '');
            
            // Extract country code (default to +232 if not available)
            const countryCode = contact?.phone_no?.includes('+') ? 
              contact.phone_no.substring(0, contact.phone_no.length - mobile.length) : '+232';
            
            // Fetch blocks to get block ID
            const blocksResponse = await fetchBlocks();
            const blocks = blocksResponse.data || [];
            
            // Find matching block by name
            const matchingBlock = blocks.find(block => 
              block.name.toLowerCase().includes(structuredData.block.toString().toLowerCase()) ||
              structuredData.block.toString().toLowerCase().includes(block.name.toLowerCase())
            );
            
            if (!matchingBlock) {
              throw new Error(`Block "${structuredData.block}" not found`);
            }
            
            // Fetch wards for the block
            const wardsResponse = await fetchWards(matchingBlock._id);
            const wards = wardsResponse.result || [];
            
            // Find matching ward by ward number
            const matchingWard = wards.find(ward => 
              ward.wardNumber === structuredData.ward_number.toString()
            );
            
            if (!matchingWard) {
              throw new Error(`Ward "${structuredData.ward_number}" not found in block "${structuredData.block}"`);
            }
            
            const userData = {
              countryCode: countryCode,
              mobile: mobile,
              userName: structuredData.fullname || 'User',
              ward: matchingWard._id, // Use ward ID
              block: matchingBlock._id, // Use block ID
              houseNumber: structuredData.address
            };
            
            await createUser(userData);
            console.log("✅ User created successfully in Dortibox API");
            console.log("🏘️ Block ID:", matchingBlock._id, "Block Name:", matchingBlock.name);
            console.log("📍 Ward ID:", matchingWard._id, "Ward Number:", matchingWard.wardNumber);
            
            // Send success message
            await sendTextMsg(sender_id, "✅ Your account has been created successfully! Let's continue with your subscription setup.");
            
            // Save the success message
            await ConversationService.saveOutgoingMessage({
              contact_id,
              sender_id: 'system',
              receiver_id: sender_id,
              message_content: "✅ Your account has been created successfully! Let's continue with your subscription setup.",
              message_type: 'text',
              status: 'sent',
              thread_id,
              contact_name: contact?.name,
              contact_phone: contact?.phone_no,
              contact_wa_id: contact?.wa_id,
              structured_data: JSON.stringify(structuredData)
            });
            
          } catch (error) {
            console.error("❌ Failed to create user in Dortibox API:", error);
            
            // Send failure message
            await sendTextMsg(sender_id, "❌ Failed to store your information. Please try again or contact support.");
            
            // Save the failure message
            await ConversationService.saveOutgoingMessage({
              contact_id,
              sender_id: 'system',
              receiver_id: sender_id,
              message_content: "❌ Failed to store your information. Please try again or contact support.",
              message_type: 'text',
              status: 'sent',
              thread_id,
              contact_name: contact?.name,
              contact_phone: contact?.phone_no,
              contact_wa_id: contact?.wa_id,
              structured_data: JSON.stringify(structuredData)
            });
            
            // Return early to stop the flow
            return res.status(200).json({ success: true });
          }
        }

        // Check if user wants subscription and has address
        const hasAddress = structuredData && structuredData.address;
        const wantsSubscription = structuredData && structuredData.wants_subscription === true;
        const hasBinSize = structuredData && structuredData.bin_size;
        const hasFrequency = structuredData && structuredData.frequency;
        const hasPickupDays = structuredData && structuredData.pickup_days && Array.isArray(structuredData.pickup_days) && structuredData.pickup_days.length > 0;
        const hasBigPurchase = structuredData && structuredData.big_purchase !== null;
        
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
          structuredData.bin_size &&
          structuredData.frequency &&
          hasPickupDays &&
          structuredData.big_purchase !== null;

        // Handle subscription flow progression
        if (hasAddress && structuredData.wants_subscription === true && !hasBinSize) {
          // User wants subscription but hasn't selected bin size yet
          console.log("🎯 User wants subscription, sending bin size template");
          await sendBinSizeTemplate(sender_id);
          
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

        // Handle frequency selection
        if (hasBinSize && !hasFrequency) {
          console.log("🎯 User selected bin size, sending frequency template");
          await sendFrequencyTemplate(sender_id);
          
          await ConversationService.saveOutgoingMessage({
            contact_id,
            sender_id: 'system',
            receiver_id: sender_id,
            message_content: "Perfect! Now let's set up your pickup schedule.",
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

        // Handle pickup days selection
        if (hasFrequency && !hasPickupDays) {
          console.log("🎯 User selected frequency, sending pickup days template");
          await sendPickupDaysTemplate(sender_id);
          
          await ConversationService.saveOutgoingMessage({
            contact_id,
            sender_id: 'system',
            receiver_id: sender_id,
            message_content: "Great! Now select your preferred pickup days.",
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

        // Handle big purchase decision
        if (hasPickupDays && structuredData.big_purchase === null) {
          console.log("🎯 User selected pickup days, sending big purchase template");
          await sendBigPurchaseTemplate(sender_id);
          
          await ConversationService.saveOutgoingMessage({
            contact_id,
            sender_id: 'system',
            receiver_id: sender_id,
            message_content: "Excellent! One final question about additional services.",
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
          const pickupDaysText = structuredData.pickup_days.join(', ');
          const bigPurchaseText = structuredData.big_purchase ? 'Yes' : 'No';
          
          const summaryMessage = `📋 Here's your subscription details:

👤 Full Name: ${structuredData.fullname}
🏘️ Block: ${structuredData.block}
📍 Ward Number: ${structuredData.ward_number}
🏠 Property Type: ${structuredData.property_type}
🏡 Address: ${structuredData.address}
🗑️ Bin Size: ${structuredData.bin_size}
📅 Frequency: ${structuredData.frequency}
📆 Pickup Days: ${pickupDaysText}
🛒 Additional Services: ${bigPurchaseText}

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

    // Handle interactive messages (all template selections)
    if (type === "interactive") {
      const interactiveData = message?.interactive;
      
      if (interactiveData?.type === "list_reply") {
        const selectedOption = interactiveData.list_reply;
        console.log("🎯 User selected option:", selectedOption);
        
        // Get conversation context to update with selection
        const lastMessages = await ConversationService.getLastMessages(contact_id, 10);
        
        // Find the last structured data
        let lastKnownDetails = null;
        for (let i = lastMessages.length - 1; i >= 0; i--) {
          if (lastMessages[i].sender_type === 'agent' && lastMessages[i].details) {
            lastKnownDetails = lastMessages[i].details;
            break;
          }
        }
        
        // Determine what was selected based on the option ID
        let updatedStructuredData = { ...lastKnownDetails };
        
        if (selectedOption.id.includes('ltr') || selectedOption.id.includes('kg')) {
          // Bin size selection
          updatedStructuredData.bin_size = selectedOption.id;
          console.log("📊 Updated with bin size:", selectedOption.id);
          
          // Send frequency template next
          await sendFrequencyTemplate(sender_id);
          await sendTextMsg(sender_id, "Perfect! Now let's set up your pickup schedule.");
          
        } else if (selectedOption.id.includes('per_week') || selectedOption.id === 'daily') {
          // Frequency selection
          updatedStructuredData.frequency = selectedOption.id;
          console.log("📊 Updated with frequency:", selectedOption.id);
          
          // Send pickup days template next
          await sendPickupDaysTemplate(sender_id);
          
        } else if (['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].includes(selectedOption.id)) {
          // Pickup day selection - simple handling
          updatedStructuredData.pickup_days = [selectedOption.id];
          console.log("📊 Updated pickup days:", selectedOption.id);
          
          // Save the pickup day selection
          await ConversationService.saveOutgoingMessage({
            contact_id,
            sender_id: 'system',
            receiver_id: sender_id,
            message_content: `Selected pickup day: ${selectedOption.title}`,
            message_type: 'template',
            status: 'sent',
            thread_id,
            contact_name: contact?.name,
            contact_phone: contact?.phone_no,
            contact_wa_id: contact?.wa_id,
            structured_data: JSON.stringify(updatedStructuredData)
          });
          
          // Send big purchase template next
          await sendBigPurchaseTemplate(sender_id);
          
          return res.status(200).json({ success: true });
        } else if (['429', '430', '431', '432', '433', '434'].includes(selectedOption.id)) {
          // Ward number selection
          updatedStructuredData.ward_number = selectedOption.id;
          console.log("📊 Updated ward number:", selectedOption.id);
          
          // Save the ward number selection
          await ConversationService.saveOutgoingMessage({
            contact_id,
            sender_id: 'system',
            receiver_id: sender_id,
            message_content: `Selected ward: ${selectedOption.title}`,
            message_type: 'template',
            status: 'sent',
            thread_id,
            contact_name: contact?.name,
            contact_phone: contact?.phone_no,
            contact_wa_id: contact?.wa_id,
            structured_data: JSON.stringify(updatedStructuredData)
          });
          
          // Send property type template next
          await sendPropertyTypeTemplate(sender_id);
          
          return res.status(200).json({ success: true });
        } else if (['domestic', 'commercial', 'institutional'].includes(selectedOption.id)) {
          // Property type selection
          updatedStructuredData.property_type = selectedOption.id;
          console.log("📊 Updated property type:", selectedOption.id);
          
          // Save the property type selection
          await ConversationService.saveOutgoingMessage({
            contact_id,
            sender_id: 'system',
            receiver_id: sender_id,
            message_content: `Selected property type: ${selectedOption.title}`,
            message_type: 'template',
            status: 'sent',
            thread_id,
            contact_name: contact?.name,
            contact_phone: contact?.phone_no,
            contact_wa_id: contact?.wa_id,
            structured_data: JSON.stringify(updatedStructuredData)
          });
          
          // Send AI message to continue the flow
          await sendTextMsg(sender_id, "Thanks! Please share your complete address or nearby landmark.");
          
          await ConversationService.saveOutgoingMessage({
            contact_id,
            sender_id: 'system',
            receiver_id: sender_id,
            message_content: "Thanks! Please share your complete address or nearby landmark.",
            message_type: 'text',
            status: 'sent',
            thread_id,
            contact_name: contact?.name,
            contact_phone: contact?.phone_no,
            contact_wa_id: contact?.wa_id,
            structured_data: JSON.stringify(updatedStructuredData)
          });
          
          return res.status(200).json({ success: true });
        }
        
        // Save the updated data
        await ConversationService.saveOutgoingMessage({
          contact_id,
          sender_id: 'system',
          receiver_id: sender_id,
          message_content: `Selected: ${selectedOption.title}`,
          message_type: 'interactive',
          status: 'sent',
          thread_id,
          contact_name: contact?.name,
          contact_phone: contact?.phone_no,
          contact_wa_id: contact?.wa_id,
          structured_data: JSON.stringify(updatedStructuredData)
        });
        
      } else if (interactiveData?.type === "button_reply") {
        // Handle button replies (big purchase yes/no)
        const buttonReply = interactiveData.button_reply;
        console.log("🎯 User clicked button:", buttonReply);
        
        // Get conversation context
        const lastMessages = await ConversationService.getLastMessages(contact_id, 10);
        let lastKnownDetails = null;
        for (let i = lastMessages.length - 1; i >= 0; i--) {
          if (lastMessages[i].sender_type === 'agent' && lastMessages[i].details) {
            lastKnownDetails = lastMessages[i].details;
            break;
          }
        }
        
        const updatedStructuredData = {
          ...lastKnownDetails,
          big_purchase: buttonReply.id === 'big_purchase_yes'
        };
        
        console.log("📊 Updated with big purchase decision:", updatedStructuredData.big_purchase);
        
        // Check if subscription is now complete
        const isCompleteForSubscriber = updatedStructuredData && 
          updatedStructuredData.fullname && 
          updatedStructuredData.block && 
          updatedStructuredData.ward_number && 
          updatedStructuredData.property_type && 
          updatedStructuredData.address && 
          updatedStructuredData.wants_subscription === true &&
          updatedStructuredData.bin_size &&
          updatedStructuredData.frequency &&
          updatedStructuredData.pickup_days &&
          updatedStructuredData.pickup_days.length > 0 &&
          updatedStructuredData.big_purchase !== null;

        if (isCompleteForSubscriber) {
          const pickupDaysText = updatedStructuredData.pickup_days.join(', ');
          const bigPurchaseText = updatedStructuredData.big_purchase ? 'Yes' : 'No';
          
          const summaryMessage = `📋 Here's your subscription details:

👤 Full Name: ${updatedStructuredData.fullname}
🏘️ Block: ${updatedStructuredData.block}
📍 Ward Number: ${updatedStructuredData.ward_number}
🏠 Property Type: ${updatedStructuredData.property_type}
🏡 Address: ${updatedStructuredData.address}
🗑️ Bin Size: ${updatedStructuredData.bin_size}
📅 Frequency: ${updatedStructuredData.frequency}
📆 Pickup Days: ${pickupDaysText}
🛒 Additional Services: ${bigPurchaseText}

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
