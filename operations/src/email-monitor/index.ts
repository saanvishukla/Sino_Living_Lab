import { ImapFlow } from 'imapflow';
import fs from 'fs/promises';
import { JSDOM } from 'jsdom';
import quotedPrintable from 'quoted-printable';
import utf8 from "utf8"

const client = new ImapFlow({
    host: 'imap.gmail.com',
    port: 993,
    secure: true,
    auth: {
        user: process.env.GMAIL_ADDRESS,
        pass: process.env.GMAIL_PASSWORD
    },
    logger: false,
});

function decodeQuotedPrintable(text) {
    try {
        // Decode quoted-printable into raw bytes
        const decodedBytes = quotedPrintable.decode(text);

        // Convert bytes to UTF-8 string
        return utf8.decode(decodedBytes)
    } catch (error) {
        console.error('Error decoding quoted-printable:', error);
        return text;
    }
}

function decodeBase64(text) {
    try {
        return Buffer.from(text, 'base64').toString('utf-8');
    } catch (error) {
        console.error('Error decoding base64:', error);
        return text;
    }
}

function cleanQuotedPrintableText(text) {
    if (!text) return text;

    if (text.includes('=') && /=[0-9A-F]{2}/i.test(text)) {
        console.log('Detected quoted-printable encoding, decoding...');
        const decoded = decodeQuotedPrintable(text);
        console.log('Decoded sample (first 50 chars):', decoded.substring(0, 50));
        return decoded;
    }

    return text;
}

async function extractTableDataAndSave(htmlContent) {
    try {
        console.log('Analyzing HTML content for tables...');

        // First, clean any quoted-printable in the entire HTML
        htmlContent = cleanQuotedPrintableText(htmlContent);

        // Create a proper DOM with the HTML content
        const dom = new JSDOM(htmlContent);
        const document = dom.window.document;

        const tables = document.querySelectorAll('table');

        if (tables.length === 0) {
            console.log('No tables found in email');
            return;
        }

        console.log(`Found ${tables.length} table(s) in email`);

        for (let index = 0; index < tables.length; index++) {
            const table = tables[index];
            console.log(`\nProcessing Table ${index + 1}:`);

            const rows = table.querySelectorAll('tr');
            if (rows.length === 0) {
                console.log('No rows found in table');
                continue;
            }

            const headerCells = rows[0].querySelectorAll('th, td');
            const headers = Array.from(headerCells).map(cell => {
                let text = cell.textContent?.trim() || `Column ${headerCells.length}`;
                text = text.replace(/,/g, ';')
                    .replace(/\n/g, ' ')
                    .replace(/\r/g, '');
                return text;
            });

            console.log('Headers:', headers.join(' | '));

            const dataRows = [];
            for (let i = 1; i < rows.length; i++) {
                const cells = rows[i].querySelectorAll('td');
                if (cells.length > 0) {
                    const rowData = Array.from(cells).map(cell => {
                        let content = cell.textContent?.trim() || '';
                        content = content.replace(/,/g, ';')
                            .replace(/\n/g, ' ')
                            .replace(/\r/g, '');
                        return content;
                    });

                    if (rowData.some(cell => cell.length > 0)) {
                        dataRows.push(rowData);
                    }
                }
            }

            console.log(`Extracted ${dataRows.length} data rows`);

            let csvContent = '\uFEFF'; // UTF-8 BOM for Excel
            csvContent += headers.join(',') + '\n';
            dataRows.forEach(row => {
                while (row.length < headers.length) {
                    row.push('');
                }
                csvContent += row.join(',') + '\n';
            });

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `table_${timestamp}_${index + 1}.csv`;

            await fs.writeFile(filename, csvContent, 'utf8');
            console.log(`Table data saved to ${filename}`);

            if (dataRows.length > 0) {
                console.log('Sample data (first row):', dataRows[0].join(' | '));
            }
        }
    } catch (error) {
        console.error('Error parsing HTML:', error);
    }
}

export const main = async () => {
    let lock = null;

    try {
        await client.connect();
        console.log('Connected to Gmail');

        client.on('exists', async (event) => {
            try {
                const mailbox = await client.mailboxOpen('INBOX');
                console.log(`New email detected. Total messages: ${mailbox.exists}`);

                const message = await client.fetchOne(mailbox.exists, {
                    uid: true,
                    envelope: true,
                    source: true
                });

                if (message && message.envelope) {
                    const subject = message.envelope.subject?.toString() || 'No Subject';
                    console.log('Processing email subject:', subject);

                    const source = message.source.toString();
                    let htmlContent = null;

                    const htmlPartMatch = source.match(/Content-Type: text\/html;?\s*([^\r\n]*)\r\nContent-Transfer-Encoding:\s*([^\r\n]+)\r\n\r\n([\s\S]*?)(?=\r\n--|$)/i);

                    if (htmlPartMatch) {
                        const encoding = htmlPartMatch[2].toLowerCase().trim();
                        let content = htmlPartMatch[3].trim();

                        console.log(`Found HTML part with encoding: ${encoding}`);
                        console.log('Content preview (first 100 chars):', content.substring(0, 100));

                        if (encoding.includes('quoted-printable')) {
                            console.log('Decoding quoted-printable content...');
                            content = decodeQuotedPrintable(content);
                        } else if (encoding.includes('base64')) {
                            console.log('Decoding base64 content...');
                            content = decodeBase64(content);
                        }

                        htmlContent = content;
                        console.log('HTML extracted from MIME part');
                    } else {
                        const htmlTagMatch = source.match(/<html[\s\S]*?<\/html>/i);
                        if (htmlTagMatch) {
                            htmlContent = htmlTagMatch[0];
                            console.log('HTML extracted using html tag pattern');

                            if (htmlContent.includes('=') && /=[0-9A-F]{2}/i.test(htmlContent)) {
                                console.log('Detected quoted-printable in HTML, decoding...');
                                htmlContent = decodeQuotedPrintable(htmlContent);
                            }
                        } else {
                            const bodyMatch = source.match(/<body[\s\S]*?<\/body>/i);
                            if (bodyMatch) {
                                htmlContent = bodyMatch[0];
                                console.log('HTML extracted using body tag pattern');

                                if (htmlContent.includes('=') && /=[0-9A-F]{2}/i.test(htmlContent)) {
                                    console.log('Detected quoted-printable in HTML, decoding...');
                                    htmlContent = decodeQuotedPrintable(htmlContent);
                                }
                            }
                        }
                    }

                    if (htmlContent) {
                        console.log('HTML content length:', htmlContent.length);
                        console.log('Sample (first 200 chars):', htmlContent.substring(0, 200));
                        await extractTableDataAndSave(htmlContent);
                    } else {
                        console.log('No HTML content could be extracted');
                        console.log('Source preview:', source.substring(0, 500));
                    }
                }
            } catch (error) {
                console.error('Error processing new email:', error);
            }
        });

        lock = await client.getMailboxLock('INBOX');
        console.log('Monitoring INBOX for new emails...');

        return { client, lock };

    } catch (error) {
        console.error('Error setting up monitor:', error);
        if (lock) {
            lock.release();
        }
        await client.logout();
        throw error;
    }
};

export const disconnect = async (lock) => {
    if (lock) {
        lock.release();
        console.log('Mailbox lock released');
    }
    await client.logout();
    console.log('Disconnected from Gmail');
};
