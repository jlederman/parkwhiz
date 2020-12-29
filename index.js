const axios = require('axios');
const Mailgun = require('mailgun-js');
const { stringify } = require('qs');

require('dotenv').config();

const {
  MAILGUN_API_KEY,
  MAILGUN_DOMAIN,
  START_DATE,
  END_DATE,
  FROM_NAME,
  FROM_ADDRESS,
  TO,
} = process.env;

const mailgun = new Mailgun({
  apiKey: MAILGUN_API_KEY,
  domain: MAILGUN_DOMAIN,
});

const API_URL = 'https://api.parkwhiz.com/v3_1/venues/';
const VENUE_ID = 478498;
const PARAMS = {
  fields: [
    'event::default',
    'event:site_url',
    'event:availability',
  ].join(','),
  sort: 'start_time',
};

const ENDPOINT = `${API_URL}/${VENUE_ID}/events?${stringify(PARAMS)}`;

/**
 * Format the data and send the email.
 */
function send(available) {
  let html =
    'Hey, the following Mt. Bachelor dates just opened up:<br /><br />';

  available.forEach(({ name, site_url }) => {
    html += `<a href="https://www.parkwhiz.com${site_url}">${name}</a><br />`;
  });

  const data = {
    from: `${FROM_NAME} <${FROM_ADDRESS}>`,
    to: TO,
    subject: 'Some Mt. Bachelor Parking Spots Opened Up!',
    html,
  };

  mailgun.messages().send(data, (err, body) => {
    if (err) {
      console.error(err);
    } else {
      console.log('Email sent.');
    }
  });
}

async function main() {
  // Get the data from the endpoint.
  const { data } = await axios.get(ENDPOINT);

  // Filter out dates that don't match the conditions.
  const available = data.filter(({ availability, start_time }) => (
    availability.available > 0 &&
    start_time >= START_DATE &&
    start_time <= END_DATE
  ));

  if (available.length) {
    send(available);
  } else {
    console.log('No spots available.');
  }
}

main().catch(console.error);
