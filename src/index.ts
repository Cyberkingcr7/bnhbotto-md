require('dotenv').config()
import makeWASocket, { 
    getDevice,
    DisconnectReason,
    delay,
    useSingleFileAuthState,
    Browsers,
    isJidGroup,
    S_WHATSAPP_NET,
    makeInMemoryStore,
    jidNormalizedUser,
    jidDecode,
    getContentType
} from '@adiwajshing/baileys';
import { Boom } from '@hapi/boom'
import _  from 'lodash'
import pino from 'pino';
import chalk from 'chalk';
import fs from 'fs'
import CFonts from 'cfonts';
import gradient from 'gradient-string';
const yargs = require('yargs/yargs')
import { exec } from 'child_process';
import moment from 'moment';
const opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse())
let session:any;

    session = './session.json'

const { state, saveState } = useSingleFileAuthState(session);

// the store maintains the data of the WA connection in memory
// can be written out to a file & read from it
const store = makeInMemoryStore({ logger: pino().child({ level: 'silent', stream: 'store' }) })
store.readFromFile('./baileys_store_multi.json')
// save every 10s
setInterval(() => {
    store.writeToFile('./baileys_store_multi.json')
}, 10_000)

const color = (text:any, color:any) => {
	return !color ? chalk.green(text) : color.startsWith('#') ? chalk.hex(color)(text) : chalk.keyword(color)(text);
};

module.exports = {

	color
};



/** LOCAL MODULE */

/** DB */
if (!fs.existsSync('./usersJid.json')) {
    fs.writeFileSync('./usersJid.json', JSON.stringify([]), 'utf-8')
}

let chatsJid = JSON.parse(fs.readFileSync('./usersJid.json', 'utf-8'))


const start = async () => {
    // LOAD PLUGINS

    CFonts.say(` Coded `, {
        font: 'console',
        align: 'center',
        gradient: ['#DCE35B', '#45B649'],
        transitionGradient: true,
    });
    console.log(color('[SYS]', 'cyan'), `Package Version`, color(`65`, '#009FF0'));
   
    let bnh = makeWASocket({
        printQRInTerminal: true,
        logger: pino({ level: 'silent' }),
        auth: state,
        browser: Browsers.macOS('Safari')
    });

    bnh.ev.on('connection.update', async (update) => {
        {
            const qr = update.qr
        }
        
        const { connection, lastDisconnect } = update;
        if (connection === 'connecting') {
            console.log(color('[SYS]', '#009FFF'), color(moment().format('DD/MM/YY HH:mm:ss'), '#A1FFCE'), color(` is Authenticating...`, '#f12711'));
        } else if (connection === 'close') {
            const log = (msg: string) => console.log(color('[SYS]', '#009FFF'), color(moment().format('DD/MM/YY HH:mm:ss'), '#A1FFCE'), color(msg, '#f64f59'));
           
            
        } else if (connection === 'open') {
            console.log(color('[SYS]', '#009FFF'), color(moment().format('DD/MM/YY HH:mm:ss'), '#A1FFCE'), color(` is now Connected...`, '#38ef7d'));
        }
    });

    bnh.ev.on('creds.update', () => saveState)

    store.bind(bnh.ev)

    bnh.ev.on('messages.upsert', async (msg: { messages: any[]; }) => {
        try {
            if (!msg.messages) return
            const m = msg.messages[0]
            if (m.key.fromMe) return
            const from = m.key.remoteJid;
            let type  = getContentType(m.message);

            Serialize(bnh, m)
            let t = m.messageTimestamp
         
            const body = (type === 'conversation') ? m.message.conversation : (type == 'imageMessage') ? m.message.imageMessage.caption : (type == 'videoMessage') ? m.message.videoMessage.caption : (type == 'extendedTextMessage') ? m.message.extendedTextMessage.text : (type == 'buttonsResponseMessage') ? m.message.buttonsResponseMessage.selectedButtonId : (type == 'listResponseMessage') ? m.message.listResponseMessage.singleSelectReply.selectedRowId : (type == 'templateButtonReplyMessage') ? m.message.templateButtonReplyMessage.selectedId : (type === 'messageContextInfo') ? (m.message.listResponseMessage.singleSelectReply.selectedRowId || m.message.buttonsResponseMessage.selectedButtonId || m.text) : ''

            let isGroupMsg = isJidGroup(from)
            let sender = m.sender
            
            const botNumber = bnh.user.id
            const groupId = isGroupMsg ? from : ''
           

            // let _plugin = []
            // for (let _pluginName in plugins) {
            //     let filtered = plugins[_pluginName]
            //     _plugin.push(filtered)
            // }
            // const str2Regex = str => str.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&')

           


            // store user jid to json file
           

            
       
        } catch (error) {
            console.log(color('[ERROR]', 'red'), color(moment().format('DD/MM/YY HH:mm:ss'), '#A1FFCE'), error);
        }
    })
};
    
    start().catch(() => start());
    

start().catch(() => start());

function Serialize(client: any, m: any) {
    throw new Error('Function not implemented.');
}
function bgColor(arg0: any, arg1: string): any {
    throw new Error('Function not implemented.');
}

