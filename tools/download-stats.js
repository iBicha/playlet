// Description: Download stats from Roku (through email) and save them to a local folder.
// This script is meant to be run daily from Github Actions.
// It will download the stats from the previous day and update repo wiki.

const fs = require('fs');
const path = require('path');
const Imap = require('imap');
const { promisify } = require('util');
const { simpleParser } = require('mailparser');
const getEnvVars = require('./get-env-vars');

const attachmentDestination = './playlet.wiki';

function writeMarkDownFile(images) {
    const markdownFile = path.join(attachmentDestination, 'Home.md');

    const date = new Date();
    const options = { timeZone: 'America/New_York' };
    const formattedDate = `${date.toLocaleString('en-US', options)} (Eastern Time)`;

    let markdownContent = `# Playlet stats

This page was automatically generated on ${formattedDate}.

`;
    images.forEach(image => {
        markdownContent += `## ${image.title}

![${image.title}](${image.filename})

`;
    });

    fs.writeFileSync(markdownFile, markdownContent);
}

async function deleteExistingAttachments() {
    try {
        const files = fs.readdirSync(attachmentDestination);

        for (const file of files) {
            if (path.extname(file) === '.png') {
                fs.unlinkSync(path.join(attachmentDestination, file));
                console.log(`Deleted ${file}`);
            }
        }
    } catch (error) {
        console.error(error);
    }
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
const moveAsync = promisify(imap.move).bind(imap);

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

async function moveToTrash(from, subject, since) {
    // imap.search returns UIDs (UID SEARCH), so move them directly with a single
    // UID MOVE command. Moving inside an active imap.fetch loop expunges messages
    // from INBOX mid-fetch, which desyncs sequence numbers and hangs the connection.
    const uids = await searchAsync([['FROM', from], ['SUBJECT', subject], ['SINCE', since]]);
    if (uids.length === 0) {
        console.log('No messages to move to Trash for subject "%s"', subject);
        return;
    }
    await moveAsync(uids, '[Gmail]/Trash');
    console.log('Moved %d message(s) to Trash for subject "%s"', uids.length, subject);
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

        deleteExistingAttachments();

        const images = []
        images.push({
            title: 'App Health',
            filename: await getAttachementAsync('bdp_noreply@data.roku.com', 'App Health', yesterdayString)
        })
        images.push({
            title: 'App Engagement',
            filename: await getAttachementAsync('bdp_noreply@data.roku.com', 'App Engagement', yesterdayString)
        })
        images.push({
            title: 'Viewership Summary',
            filename: await getAttachementAsync('bdp_noreply@data.roku.com', 'Viewership Summary', yesterdayString)
        })
        images.push({
            title: 'App Stability',
            filename: await getAttachementAsync('bdp_noreply@data.roku.com', 'App Stability', yesterdayString)
        })

        writeMarkDownFile(images);

        await moveToTrash('bdp_noreply@data.roku.com', 'App Health', yesterdayString);
        await moveToTrash('bdp_noreply@data.roku.com', 'App Engagement', yesterdayString);
        await moveToTrash('bdp_noreply@data.roku.com', 'Viewership Summary', yesterdayString);
        await moveToTrash('bdp_noreply@data.roku.com', 'App Stability', yesterdayString);

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
