import { config } from 'dotenv'
config()
import fs from 'fs'
import CFonts from 'cfonts'
import { Boom } from '@hapi/boom'
import P from 'pino'
import makeWASocket, { AnyMessageContent, Browsers, delay, DisconnectReason, fetchLatestBaileysVersion, getContentType, isJidGroup, jidNormalizedUser, makeInMemoryStore, useSingleFileAuthState } from '@adiwajshing/baileys'
import moment from 'moment'
import chalk from 'chalk';
import path from 'path'

// the store maintains the data of the WA connection in memory
// can be written out to a file & read from it
const store = makeInMemoryStore({ logger: P().child({ level: 'debug', stream: 'store' }) })
store.readFromFile('./baileys_store_multi.json')
// save every 10s
setInterval(() => {
	store.writeToFile('./baileys_store_multi.json')
}, 10_000)

const color = (text:any, color:any) => {
	return !color ? chalk.green(text) : color.startsWith('#') ? chalk.hex(color)(text) : chalk.keyword(color)(text);
};

function bgColor(text: string, color: string) {
	return !color
		? chalk.bgGreen(text)
		: color.startsWith('#')
			? chalk.bgHex(color)(text)
			: chalk.bgKeyword(color)(text);
}
const { state, saveState } = useSingleFileAuthState('./auth_info_multi.json')

// start a connection
const start = async() => {
	// fetch latest version of WA Web
	const { version, isLatest } = await fetchLatestBaileysVersion()
	console.log(`using WA v${version.join('.')}, isLatest: ${isLatest}`)
	CFonts.say(`Welcome to Bnh`, {
        font: 'console',
        align: 'center',
        gradient: ['#DCE35B', '#45B649'],
        transitionGradient: true,
    });

	const { version: WAVersion } = await fetchLatestBaileysVersion()
    console.log(color('[SYS]', 'cyan'), `Package Version`, color(`v1`, '#009FF0'));
    console.log(color('[SYS]', 'cyan'), `WA Version`, color(WAVersion.join('.'), '#38ef7d'));

	const bnh = makeWASocket({
		version,
		logger: P({ level: 'trace' }),
		printQRInTerminal: true,
		auth: state,
		browser: Browsers.macOS('Safari'),
		// implement to handle retries
	
		}
	)

	store.bind(bnh.ev)

	const sendMessageWTyping = async(msg: AnyMessageContent, jid: string) => {
		await bnh.presenceSubscribe(jid)
		await delay(500)

		await bnh.sendPresenceUpdate('composing', jid)
		await delay(2000)

		await bnh.sendPresenceUpdate('paused', jid)

		await bnh.sendMessage(jid, msg)
	}
    
	bnh.ev.on('chats.set', (item:any) => console.log(`recv ${item.chats.length} chats (is latest: ${item.isLatest})`))
	bnh.ev.on('messages.set', (item:any) => console.log(`recv ${item.messages.length} messages (is latest: ${item.isLatest})`))
	bnh.ev.on('contacts.set', (item:any) => console.log(`recv ${item.contacts.length} contacts`))

	bnh.ev.on('messages.upsert', async (m:any)=> {
		console.log(JSON.stringify(m, undefined, 2))
        
		const msg = m.messages[0]
		if(!msg.key.fromMe && m.type === 'notify') {
			console.log('replying to', m.messages[0].key.remoteJid)
			await bnh!.sendReadReceipt(msg.key.remoteJid, msg.key.participant, [msg.key.id])
			await sendMessageWTyping({ text: 'Hello there!' }, msg.key.remoteJid)
		}
        
	})

	bnh.ev.on('messages.update',(m:any) => console.log(m))
	bnh.ev.on('message-receipt.update',(m:any) => console.log(m))
	bnh.ev.on('presence.update', (m:any) => console.log(m))
	bnh.ev.on('chats.update', (m:any) => console.log(m))
	bnh.ev.on('contacts.upsert', (m:any) => console.log(m))

	bnh.ev.on('connection.update', (update:any) => {
		const { connection, lastDisconnect } = update;
        if (connection === 'connecting') {
            console.log(color('[SYS]', '#009FFF'), color(moment().format('DD/MM/YY HH:mm:ss'), '#A1FFCE'), color(`Bnh is Authenticating...`, '#f12711'));
        } else if (connection === 'close') {
            const log = (msg:any) => console.log(color('[SYS]', '#009FFF'), color(moment().format('DD/MM/YY HH:mm:ss'), '#A1FFCE'), color(msg, '#f64f59'));
            const statusCode = lastDisconnect.error ? new Boom(lastDisconnect)?.output.statusCode : 0;

            console.log(lastDisconnect.error);
            if (statusCode === DisconnectReason.badSession) { log(`Bad session file, delete session.json and run again`); start(); }
            else if (statusCode === DisconnectReason.connectionClosed) { log('Connection closed, reconnecting....'); start() }
            else if (statusCode === DisconnectReason.connectionLost) { log('Connection lost, reconnecting....'); start() }
            else if (statusCode === DisconnectReason.connectionReplaced) { log('Connection Replaced, Another New Session Opened, Please Close Current Session First'); process.exit() }
            else if (statusCode === DisconnectReason.loggedOut) { log(`Device Logged Out, Please Delete session.json and Scan Again.`); process.exit(); }
            else if (statusCode === DisconnectReason.restartRequired) { log('Restart required, restarting...'); start(); }
            else if (statusCode === DisconnectReason.timedOut) { log('Connection timedOut, reconnecting...'); start(); }
            else {
                console.log(lastDisconnect.error); start()
            }
        } else if (connection === 'open') {
            console.log(color('[SYS]', '#009FFF'), color(moment().format('DD/MM/YY HH:mm:ss'), '#A1FFCE'), color(`Bnh is now Connected...`, '#38ef7d'));
        }
    });
	// listen for when the auth credentials is updated
	bnh.ev.on('creds.update', saveState)



start()

}
