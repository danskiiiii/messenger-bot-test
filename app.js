'use strict';

const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

const request = require('request');
const express = require('express');
const body_parser = require('body-parser');
const qs = require('querystring');

const app = express().use(body_parser.json());

// Sets server port and logs message on success
app.listen(process.env.PORT || 3000, () => { console.log('App is running...'); });

// Accepts POST requests at /webhook endpoint
app.post('/webhook', (req, res) => {  

  // Parse the request body from the POST
  let body = req.body;

  // Check the webhook event is from a Page subscription
  if (body.object === 'page') {

    body.entry.forEach((entry) => {

      // Gets the body of the webhook event
      const webhook_event = entry.messaging[0];
      console.log(webhook_event);

      // Get the sender PSID
      let sender_psid = webhook_event.sender.id;
      console.log('Sender ID: ' + sender_psid);

      // Check if the event is a message or postback and
      // pass the event to the appropriate handler function
      if (webhook_event.message) {
        handleMessage(sender_psid, webhook_event.message);        
      }
    });
    // Return a '200 OK' response to all events
    res.status(200).send('EVENT_RECEIVED');
  } else {
    // Return a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }
});

// Accepts GET requests at the /webhook endpoint
app.get('/webhook', (req, res) => {
  const VERIFY_TOKEN = "<YOUR VERIFY TOKEN>";
  
  // Parse params from the webhook verification request
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
    
  // Check if a token and mode were sent
  if (mode && token) {
  
    // Check the mode and token sent are correct
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      
      // Respond with 200 OK and challenge token from the request
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);      
    }
  }
});

function handleMessage(sender_psid, received_message) {
  if (received_message.text) {
    request.get(`https://api.wit.ai/message?${qs.stringify({q: received_message.text})}`, {
      'auth': {
        'bearer': 'CEPHSBBS6PW63FIDRHFX6I2TFQM6NUXO'        // from WIT.AI app
      }
    }, (err, res, body) => {
      if (err) {
        console.error(err);
      }

      body = JSON.parse(body);

      if (!body.entities || !body.entities.command || !body.entities.command.length < 0) {
        callSendAPI(sender_psid, {"text": 'I don\'t understand. Could you repeat?'});
      } else {
        const commandEntity = body.entities.command ? body.entities.command[0] : null;

        if (!commandEntity) {
          callSendAPI(sender_psid, {"text": 'I don\'t understand. Could you repeat?'});
        }

        switch (commandEntity.value) {
          case 'create_file':
            callSendAPI(sender_psid, {"text": 'create_file'});
            break;
          case 'remove_file':
            callSendAPI(sender_psid, {"text": 'remove_file'});
            break;
          case 'open_file':
            callSendAPI(sender_psid, {"text": 'open_file'});
            break;
          case 'create_folder':
            callSendAPI(sender_psid, {"text": 'create_folder'});
            break;
          case 'remove_folder':
            callSendAPI(sender_psid, {"text": 'remove_folder'});
            break;
          case 'open_folder':
            callSendAPI(sender_psid, {"text": 'open_folder'});
            break;
          case 'open_webbrowser':
            callSendAPI(sender_psid, {"text": 'open_webbrowser'});
            break;
          case 'back_folder':
            callSendAPI(sender_psid, {"text": 'back_folder'});
            break;
          case 'exit':
            callSendAPI(sender_psid, {"text": 'exit'});
            break;
          default:
            callSendAPI(sender_psid, {"text": 'I don\'t understand. Could you repeat?'});
        }
      }
    });
  }
}

function callSendAPI(sender_psid, response) {
  // Construct the message body
  const request_body = {
    "recipient": {
      "id": sender_psid
    },
    "message": response
  };

  // Send the HTTP request to the Messenger Platform
  request({
    "uri": "https://graph.facebook.com/v2.6/me/messages",
    "qs": { "access_token": PAGE_ACCESS_TOKEN },
    "method": "POST",
    "json": request_body
  }, (err) => {
    if (!err) {
      console.log('message sent!')
    } else {
      console.error("Unable to send message:" + err);
    }
  }); 
}