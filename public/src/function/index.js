import axios from "axios"; 

exports.sendTextMsg = async (from, text) => {
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

// const sendFlowTemp = async (from, name) => {
//     try {
//       const options = {
//         method: "POST",
//         url: `${process.env.FBWA_URL}/send-message`,
//         headers: {
//           "Content-Type": "application/json",
//           Accept: "application/json, application/xml",
//           Authorization: `Bearer ${process.env.FBWA_KEY}`,
//         },
//         data: {
//           messaging_product: "whatsapp",
//           recipient_type: "individual",
//           to: from,
//           type: "template",
//           template: {
//             name: name,
//             language: {
//               code: "en",
//             },
//             components: [
//               {
//                 type: "button",
//                 sub_type: "flow",
//                 index: "0",
//               },
//             ],
//           },
//         },
//       };
  
//       const { data } = await axios.request(options);
//     } catch (error) {
//       console.log({ error: error?.message });
//     }
// };
  
// const sendTemp = async (from, name) => {
//     try {
//       const options = {
//         method: "POST",
//         url: `${process.env.FBWA_URL}/send-message`,
//         headers: {
//           "Content-Type": "application/json",
//           Accept: "application/json, application/xml",
//           Authorization: `Bearer ${process.env.FBWA_KEY}`,
//         },
//         data: {
//           messaging_product: "whatsapp",
//           recipient_type: "individual",
//           to: from,
//           type: "template",
//           template: {
//             name: name,
//             language: {
//               code: "en_US",
//             },
//           },
//         },
//       };
  
//       const { data } = await axios.request(options);
  
//       console.log(data);
//     } catch (error) {
//       console.log({ error: error });
//     }
// };
  
// const sendTempImage = async (from, name, image) => {
//     try {
//       const options = {
//         method: "POST",
//         url: `${process.env.FBWA_URL}/send-message`,
//         headers: {
//           "Content-Type": "application/json",
//           Accept: "application/json, application/xml",
//           Authorization: `Bearer ${process.env.FBWA_KEY}`,
//         },
//         data: {
//           messaging_product: "whatsapp",
//           recipient_type: "individual",
//           to: from,
//           type: "template",
//           template: {
//             name: name,
//             language: {
//               code: "en_US",
//             },
//             components: [
//               {
//                 type: "HEADER",
//                 parameters: [
//                   {
//                     type: "IMAGE",
//                     image: {
//                       link: image,
//                     },
//                   },
//                 ],
//               },
//             ],
//           },
//         },
//       };
  
//       const { data } = await axios.request(options);
  
//       console.log(data);
//     } catch (error) {
//       console.log({ error: JSON.stringify(error) });
//     }
// };
  
// const orderNoGen = async () => {
//     const orderData = await Order.findOne({ order: [["id", "DESC"]] });
//     if (orderData) {
//       const last_order = orderData?.orderNo;
//       const last = parseInt(last_order.match(/\d+/)[0], 10);
//       const next = last + 1;
//       const paddedNumber = String(next).padStart(7, "0");
//       return `ORD${paddedNumber}`;
//     }
//     return `ORD0000001`;
// };
  
// const invoiceNoGen = async () => {
//     const invoice = await Invoice.findOne({ order: [["id", "DESC"]] });
//     if (invoice) {
//       const last_invoice = invoice?.invoiceNo;
//       const last = parseInt(last_invoice.match(/\d+/)[0], 10);
//       const next = last + 1;
//       const paddedNumber = String(next).padStart(7, "0");
//       return `INV${paddedNumber}`;
//     }
//     return `INV0000001`;
// };

export { sendTextMsg, markAsRead };