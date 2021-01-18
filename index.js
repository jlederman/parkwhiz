const sgMail = require('@sendgrid/mail');
const axios = require('axios');
const moment = require('moment');
const { stringify } = require('qs');

require('dotenv').config();

const {
    SGAPI,
    EVENTSURL,
    TO,
    FROM,
} = process.env;
sgMail.setApiKey(SGAPI)

const eventsUrl = EVENTSURL;
const urlParams = {
    fields: [
        'event::default',
        'event:site_url',
        'event:availability',
    ].join(','),
    sort: 'start_time',
};
const endpoint = `${eventsUrl}${stringify(urlParams)}`;

function sendEmail(available) {
    let messageBody = 'parking spots available:<br /><br />';
    available.forEach(({name, site_url}) => {
        messageBody += `<a href="https://www.parkwhiz.com${site_url}">${name}</a><br /><br />`;
    })
    let msg = {
        to: TO,
        from: FROM,
        subject: 'Parking Spots Available',
        html: messageBody
    }
    sgMail.send(msg)
}

async function main() {
    const { data } = await axios.get(endpoint);
    let comparisonTime = moment().add(3, 'days');
    let available = data.filter(({ availability, start_time}) => (
        availability.available > 0 &&
        moment(start_time) <= comparisonTime
    ));
    if (available.length) {
        sendEmail(available)
        console.info(moment.utc().format(), available.length, 'email sent');
    } else { 
        console.info(moment.utc().format(), available.length, 'nope')
    }
}

async function rerun() {
    await main();
    setTimeout((rerun), 300000);
}
rerun().catch(console.error);