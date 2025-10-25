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
            text: "📅 Choose your pickup day"
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
                    description: "Weekly pickup on Monday"
                  },
                  {
                    id: "tuesday",
                    title: "Tuesday",
                    description: "Weekly pickup on Tuesday"
                  },
                  {
                    id: "wednesday",
                    title: "Wednesday",
                    description: "Weekly pickup on Wednesday"
                  },
                  {
                    id: "thursday",
                    title: "Thursday",
                    description: "Weekly pickup on Thursday"
                  },
                  {
                    id: "friday",
                    title: "Friday",
                    description: "Weekly pickup on Friday"
                  },
                  {
                    id: "saturday",
                    title: "Saturday",
                    description: "Weekly pickup on Saturday"
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

const fetchWards = async (blockId) => {
  try {
    const options = {
      method: "GET",
      url: `https://dev-api.dortibox.com/block/${blockId}/ward`,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4MzQzZTI4MjczYjcwYmNkNmZlODIzNSIsInVzZXJOYW1lIjoiY2hpcmFnQGFkbWluLmNvbSIsInR5cGUiOiJBRE1JTiIsImlhdCI6MTc2MDc3MTEzMiwiZXhwIjoxNzYwODA3MTMyfQ.p3t5UD89VwBw26hweaSCARxegbW7x6aDBHU8T_9r2O8"
      }
    };

    const { data } = await axios.request(options);
    console.log("✅ Wards fetched successfully:", data);
    return data;
  } catch (error) {
    console.log({ error: error?.response?.data || error?.message });
    throw error;
  }
};

const fetchBlocks = async () => {
  try {
    const options = {
      method: "GET",
      url: "https://dev-api.dortibox.com/get/block?isViewOnly=true",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4MzQzZTI4MjczYjcwYmNkNmZlODIzNSIsInVzZXJOYW1lIjoiY2hpcmFnQGFkbWluLmNvbSIsInR5cGUiOiJBRE1JTiIsImlhdCI6MTc2MDc3MTEzMiwiZXhwIjoxNzYwODA3MTMyfQ.p3t5UD89VwBw26hweaSCARxegbW7x6aDBHU8T_9r2O8"
      }
    };

    const { data } = await axios.request(options);
    console.log("✅ Blocks fetched successfully:", data);
    return data;
  } catch (error) {
    console.log({ error: error?.response?.data || error?.message });
    throw error;
  }
};

const createUser = async (userData) => {
  try {
    // Generate random 4-digit number
    const randomNumber = Math.floor(1000 + Math.random() * 9000);
    const userNumber = `USR${randomNumber}`;
    
    const options = {
      method: "POST",
      url: "https://dev-api.dortibox.com/admin/user/create",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: process.env.DORTIBOX_AUTH_TOKEN 
      },
      data: {
        countryCode: userData.countryCode || "+232",
        mobile: userData.mobile,
        password: "1234",
        userName: userData.userName,
        ward: userData.ward,
        block: userData.block,
        houseNumber: userData.houseNumber,
        propertyType: userData.propertyType
      }
    };

    const { data } = await axios.request(options);
    console.log("✅ User created successfully:", data);
    console.log("🔢 Generated user number:", userNumber);
    return data;
  } catch (error) {
    console.log({ error: error?.response?.data || error?.message });
    throw error;
  }
};

const sendWardNumberTemplate = async (from) => {
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
            text: "📍 Select your ward number:"
          },
          action: {
            button: "Select Ward",
            sections: [
              {
                title: "Ward Numbers",
                rows: [
                  {
                    id: "429",
                    title: "Ward 429"
                  },
                  {
                    id: "430",
                    title: "Ward 430"
                  },
                  {
                    id: "431",
                    title: "Ward 431"
                  },
                  {
                    id: "432",
                    title: "Ward 432"
                  },
                  {
                    id: "433",
                    title: "Ward 433"
                  },
                  {
                    id: "434",
                    title: "Ward 434"
                  }
                ]
              }
            ]
          }
        }
      }
    };

    const { data } = await axios.request(options);
    console.log("✅ Ward number template sent:", data);
    return data;
  } catch (error) {
    console.log({ error: error?.response?.data || error?.message });
    throw error;
  }
};

const sendPropertyTypeTemplate = async (from) => {
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
            text: "🏠 Select your property type:"
          },
          action: {
            button: "Select Property",
            sections: [
              {
                title: "Property Types",
                rows: [
                  {
                    id: "domestic",
                    title: "Domestic"
                  },
                  {
                    id: "commercial",
                    title: "Commercial"
                  },
                  {
                    id: "institutional",
                    title: "Institutional"
                  }
                ]
              }
            ]
          }
        }
      }
    };

    const { data } = await axios.request(options);
    console.log("✅ Property type template sent:", data);
    return data;
  } catch (error) {
    console.log({ error: error?.response?.data || error?.message });
    throw error;
  }
};

export { sendTextMsg, markAsRead, sendFlowTemp, sendTemp, sendTempImage, orderNoGen, invoiceNoGen, sendBinSizeTemplate, sendFrequencyTemplate, sendPickupDaysTemplate, sendBigPurchaseTemplate, createUser, fetchWards, fetchBlocks, sendWardNumberTemplate, sendPropertyTypeTemplate };