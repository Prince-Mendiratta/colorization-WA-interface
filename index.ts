import fs, { readFileSync } from 'fs';
import {
    Client,
    List,
    LocalAuth,
    Message,
    MessageMedia
} from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import { PythonShell } from 'python-shell';

let notHeadless = process.argv.includes('--no-headless');

const delay = ms => new Promise(res => setTimeout(res, ms));

let ops = {
    headless: true,
    args: ['--no-sandbox', '--max_old_space_size'],
    executablePath: '/usr/bin/google-chrome-stable'
};

if (notHeadless) {
    ops.headless = false;
}

const client = new Client({
    authStrategy: new LocalAuth({
        clientId: 'my_wpp'
    }),
    qrMaxRetries: 5,
    puppeteer: ops
});

client.on('loading_screen', (percent, message) => {
    console.log('LOADING SCREEN', percent, message);
});

client.on('qr', qr => {
    // NOTE: This event will not be fired if a session is specified.
    qrcode.generate(qr, { small: true });
});

client.on('authenticated', () => {
    console.log('AUTHENTICATED');
});

client.on('auth_failure', msg => {
    // Fired if session restore was unsuccessful
    console.error('AUTHENTICATION FAILURE', msg);
});

client.on('ready', () => {
    console.log('READY');
});

client.on('message', async msg => {
    console.log(msg);
    if (!msg.id.fromMe && msg.type === 'image' && msg.from.endsWith('@c.us')) {
        const media = await msg.downloadMedia();
        // console.log(media);
        // console.log(media.data);
        console.log('downloaded media');
        fs.writeFile('imgs/raw.jpg', media.data, 'base64', (err) => {
            console.log(err);
        });
        console.log('done');
        await runpythoncode();
        console.log('done processing');
        var medi = new MessageMedia(
            'image/png',
            readFileSync('imgs_out/img_eccv16.png', {encoding: 'base64'})
        );
        try{
            await client.sendMessage(msg.id.remote, medi, {
                caption: 'Here is the colorized image!'
            });
        }catch(err){
            console.log(err);
        }
    }
});

(async () => {
    // await dbAuth();
    client.initialize();
})();

function runpythoncode() {
    return new Promise(resolve => {
        PythonShell.run('convert.py', {
            args: ['-i', 'imgs/raw.jpg', '-o', 'imgs_out/img']
        }, function (err, result) {
            if (err) throw err;
            console.log(result);
            resolve(result);
        });
    })
}