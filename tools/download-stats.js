const fs = require('fs');
const path = require('path');
const Imap = require('imap');
const { promisify } = require('util');
const { simpleParser } = require('mailparser');
const getEnvVars = require('./get-env-vars');

const attachmentDestination = './playlet.wiki';

function writeMarkDownFile(images) {
    const markdownFile = path.join(attachmentDestination, 'Home.md');

    let markdownContent = `# Playlet stats

This page was automatically generated on ${new Date().toUTCString()}.

`;
    images.forEach(image => {
        markdownContent += `## ${image.title}

![${image.title}](${image.filename})

`;
    });

    fs.writeFileSync(markdownFile, markdownContent);
}

const config = getEnvVars(['EMAIL', 'EMAIL_APP_PASSWORD']);

const imap = new Imap({
    user: config.EMAIL,
    password: config.EMAIL_APP_PASSWORD,
    host: 'imap.gmail.com',
    port: 993,
    tls: true,
    tlsOptions: {
        rejectUnauthorized: false
    }
});

const searchAsync = promisify(imap.search).bind(imap);
const openBoxAsync = promisify(imap.openBox).bind(imap);

async function getAttachementAsync(from, subject, since) {
    return new Promise(async (resolve, reject) => {
        const results = await searchAsync([['FROM', from], ['SUBJECT', subject], ['SINCE', since]]);
        const fetch = imap.fetch(results, { bodies: '' });

        let messageCount = 0;

        fetch.on('message', (msg, seqno) => {
            console.log('Message #%d', seqno);
            messageCount++;

            let data = ""
            msg.on("body", function (stream) {
                stream.on("data", function (chunk) {
                    data = data + chunk.toString("utf8");
                });

                stream.once("end", async () => {
                    console.log('stream end - parsing...');
                    try {
                        const parser = await simpleParser(data);
                        const attachments = parser.attachments;
                        if (attachments.length !== 1) {
                            throw new Error(`Expected 1 attachment, but found ${attachments.length}`);
                        }
                        const attachment = attachments[0];
                        const filename = attachment.filename;
                        fs.writeFileSync(path.join(attachmentDestination, filename), attachment.content);
                        console.log('attachment written');
                        resolve(filename);
                    } catch (error) {
                        console.error('Error:', error);
                        reject(error);
                    }
                })
            });
            msg.once("end", function () {
                console.log("Finished msg #" + seqno);
            });
        });

        fetch.once('end', () => {
            console.log('fetch end');
            if (messageCount === 0) {
                reject(new Error('No message found'));
            }
        });
    });
}
const timeout = setTimeout(() => {
    console.log('Timeout');
    process.exit(1);
}, 10 * 60 * 1000);

imap.once('ready', async () => {
    try {
        await openBoxAsync('INBOX');

        const now = new Date();
        const yesterday = new Date(now - 24 * 60 * 60 * 1000);
        const yesterdayString = yesterday.toISOString().slice(0, 19).replace('T', ' ');

        const images = []
        images.push({
            title: 'Channel Health',
            filename: await getAttachementAsync('bdp_noreply@data.roku.com', 'Channel Health', yesterdayString)
        })
        images.push({
            title: 'Channel Engagement',
            filename: await getAttachementAsync('bdp_noreply@data.roku.com', 'Channel Engagement', yesterdayString)
        })
        images.push({
            title: 'Viewership Summary',
            filename: await getAttachementAsync('bdp_noreply@data.roku.com', 'Viewership Summary', yesterdayString)
        })

        writeMarkDownFile(images);

        imap.end();
    } catch (error) {
        console.error('Error:', error);
    }
    clearTimeout(timeout);
});

imap.once('error', err => {
    console.error(err);
});

imap.once('end', () => {
    console.log('Connection ended');
});

imap.connect();
