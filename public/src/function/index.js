import axios from "axios"; 
import { Conversation } from "../db/models/index.js";

const sendTextMsg = async (from, text) => {
  var config = {
    method: "post",
    maxBodyLength: Infinity,
    url: `${process.env.FBWA_URL}/send-message`,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, application/xml",
      Authorization: `Bearer ${process.env.UPMATRIX_TOKEN}`,
    },
    data: {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: from,
      type: "text",
      text: {
        body: text
      },
    },
  };

  axios(config)
    .then(function (response) {
      //console.log(JSON.stringify(response.data));
    })
    .catch(function (error) {
      console.log(error);
    });
};

const markAsRead = async (msgId) => {
  var config = {
    method: "post",
    maxBodyLength: Infinity,
    url: `${process.env.FBWA_URL}/mark-read`,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, application/xml",
      Authorization: `Bearer ${process.env.UPMATRIX_TOKEN}`,
    },
    data: {
      "messaging_product": "whatsapp",
      "status": "read",
      "message_id": msgId
    }
  };
    

  axios(config)
    .then(function (response) {
      console.log({response});
    })
    .catch(function (error) {
      console.log(error);
    });
}

const sendFlowTemp = async (from, name) => {
  try {
    const options = {
      method: "POST",
      url: `${process.env.FBWA_URL}/send-message`,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, application/xml",
        Authorization: `Bearer ${process.env.UPMATRIX_TOKEN}`,
      },
      data: {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: from,
        type: "template",
        template: {
          name: name,
          language: {
            code: "en",
          },
          components: [
            {
              type: "button",
              sub_type: "flow",
              index: "0",
            },
          ],
        },
      },
    };

    const { data } = await axios.request(options);
  } catch (error) {
    console.log({ error: error?.message });
  }
};

const sendTemp = async (from, name) => {
  try {
    const options = {
      method: "POST",
      url: `${process.env.FBWA_URL}/send-message`,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, application/xml",
        Authorization: `Bearer ${process.env.UPMATRIX_TOKEN}`,
      },
      data: {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: from,
        type: "template",
        template: {
          name: name,
          language: {
            code: "en_US",
          },
        },
      },
    };

    const { data } = await axios.request(options);

    console.log(data);
  } catch (error) {
    console.log({ error: error });
  }
};

const sendTempImage = async (from, name, image) => {
  try {
    const options = {
      method: "POST",
      url: `${process.env.FBWA_URL}/send-message`,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, application/xml",
        Authorization: `Bearer ${process.env.UPMATRIX_TOKEN}`,
      },
      data: {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: from,
        type: "template",
        template: {
          name: name,
          language: {
            code: "en_US",
          },
          components: [
            {
              type: "HEADER",
              parameters: [
                {
                  type: "IMAGE",
                  image: {
                    link: image,
                  },
                },
              ],
            },
          ],
        },
      },
    };

    const { data } = await axios.request(options);

    console.log(data);
  } catch (error) {
    console.log({ error: JSON.stringify(error) });
  }
};

const orderNoGen = async () => {
  const orderData = await Conversation.findOne({ order: [["id", "DESC"]] });
  if (orderData) {
    const last_order = orderData?.message_content;
    const last = parseInt(last_order.match(/\d+/)[0], 10);
    const next = last + 1;
    const paddedNumber = String(next).padStart(7, "0");
    return `ORD${paddedNumber}`;
  }
  return `ORD0000001`;
};

const invoiceNoGen = async () => {
  const invoice = await Conversation.findOne({ order: [["id", "DESC"]] });
  if (invoice) {
    const last_invoice = invoice?.message_content;
    const last = parseInt(last_invoice.match(/\d+/)[0], 10);
    const next = last + 1;
    const paddedNumber = String(next).padStart(7, "0");
    return `INV${paddedNumber}`;
  }
  return `INV0000001`;
};

const sendBinSizeTemplate = async (from) => {
  try {
    const options = {
      method: "POST",
      url: `${process.env.FBWA_URL}/send-message`,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, application/xml",
        Authorization: `Bearer ${process.env.UPMATRIX_TOKEN}`,
      },
      data: {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: from,
        type: "interactive",
        interactive: {
          type: "list",
          body: {
            text: "🗑️ Please select your preferred waste bin size"
          },
          action: {
            button: "Select Bin Size",
            sections: [
              {
                title: "Waste Bin Sizes",
                rows: [
                  {
                    id: "33ltr",
                    title: "33 Liters",
                    description: "Small household bin"
                  },
                  {
                    id: "50ltr",
                    title: "50 Liters",
                    description: "Medium household bin"
                  },
                  {
                    id: "120ltr",
                    title: "120 Liters",
                    description: "Large household bin"
                  },
                  {
                    id: "500ltr",
                    title: "500 Liters",
                    description: "Commercial bin"
                  },
                  {
                    id: "1000ltr",
                    title: "1000 Liters",
                    description: "Large commercial bin"
                  },
                  {
                    id: "25kg",
                    title: "25 KG",
                    description: "Weight-based option"
                  },
                  {
                    id: "50kg",
                    title: "50 KG",
                    description: "Heavy-duty option"
                  }
                ]
              }
            ]
          }
        }
      }
    };

    const { data } = await axios.request(options);
    console.log("✅ Bin size template sent:", data);
    return data;
  } catch (error) {
    console.log({ error: error?.response?.data || error?.message });
    throw error;
  }
};

const sendFrequencyTemplate = async (from) => {
  try {
    const options = {
      method: "POST",
      url: `${process.env.FBWA_URL}/send-message`,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, application/xml",
        Authorization: `Bearer ${process.env.UPMATRIX_TOKEN}`,
      },
      data: {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: from,
        type: "interactive",
        interactive: {
          type: "list",
          body: {
            text: "📅 How often would you like waste pickup?"
          },
          action: {
            button: "Select Frequency",
            sections: [
              {
                title: "Pickup Frequency",
                rows: [
                  {
                    id: "1x_per_week",
                    title: "1x per week",
                    description: "Weekly pickup"
                  },
                  {
                    id: "2x_per_week",
                    title: "2x per week",
                    description: "Twice weekly"
                  },
                  {
                    id: "3x_per_week",
                    title: "3x per week",
                    description: "Three times weekly"
                  },
                  {
                    id: "5x_per_week",
                    title: "5x per week",
                    description: "Weekdays only"
                  },
                  {
                    id: "daily",
                    title: "Daily (6x per week)",
                    description: "Every day except Sunday"
                  }
                ]
              }
            ]
          }
        }
      }
    };

    const { data } = await axios.request(options);
    console.log("✅ Frequency template sent:", data);
    return data;
  } catch (error) {
    console.log({ error: error?.response?.data || error?.message });
    throw error;
  }
};

const sendPickupDaysTemplate = async (from) => {
  try {
    // Get current day of week
    const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayName = dayNames[today];
    
    const options = {
      method: "POST",
      url: `${process.env.FBWA_URL}/send-message`,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, application/xml",
        Authorization: `Bearer ${process.env.UPMATRIX_TOKEN}`,
      },
      data: {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: from,
        type: "interactive",
        interactive: {
          type: "list",
          body: {
            text: `📅 Select your pickup days (minimum 3 days required). ${todayName.charAt(0).toUpperCase() + todayName.slice(1)} is pre-selected as today:`
          },
          action: {
            button: "Select Days",
            sections: [
              {
                title: "Pickup Days",
                rows: [
                  {
                    id: "monday",
                    title: "Monday",
                    description: today === 1 ? "✅ Today (Required)" : "Available"
                  },
                  {
                    id: "tuesday",
                    title: "Tuesday", 
                    description: today === 2 ? "✅ Today (Required)" : "Available"
                  },
                  {
                    id: "wednesday",
                    title: "Wednesday",
                    description: today === 3 ? "✅ Today (Required)" : "Available"
                  },
                  {
                    id: "thursday",
                    title: "Thursday",
                    description: today === 4 ? "✅ Today (Required)" : "Available"
                  },
                  {
                    id: "friday",
                    title: "Friday",
                    description: today === 5 ? "✅ Today (Required)" : "Available"
                  },
                  {
                    id: "saturday",
                    title: "Saturday",
                    description: today === 6 ? "✅ Today (Required)" : "Available"
                  }
                ]
              }
            ]
          }
        }
      }
    };

    const { data } = await axios.request(options);
    console.log("✅ Pickup days template sent:", data);
    return data;
  } catch (error) {
    console.log({ error: error?.response?.data || error?.message });
    throw error;
  }
};

const sendBigPurchaseTemplate = async (from) => {
  try {
    const options = {
      method: "POST",
      url: `${process.env.FBWA_URL}/send-message`,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, application/xml",
        Authorization: `Bearer ${process.env.UPMATRIX_TOKEN}`,
      },
      data: {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: from,
        type: "interactive",
        interactive: {
          type: "button",
          body: {
            text: "🛒 Would you like to purchase additional waste management services or products?"
          },
          action: {
            buttons: [
              {
                type: "reply",
                reply: {
                  id: "big_purchase_yes",
                  title: "Yes"
                }
              },
              {
                type: "reply", 
                reply: {
                  id: "big_purchase_no",
                  title: "No"
                }
              }
            ]
          }
        }
      }
    };

    const { data } = await axios.request(options);
    console.log("✅ Big purchase template sent:", data);
    return data;
  } catch (error) {
    console.log({ error: error?.response?.data || error?.message });
    throw error;
  }
};

export { sendTextMsg, markAsRead, sendFlowTemp, sendTemp, sendTempImage, orderNoGen, invoiceNoGen, sendBinSizeTemplate, sendFrequencyTemplate, sendPickupDaysTemplate, sendBigPurchaseTemplate };