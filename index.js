//=== Query ===
//=== For https://mineserv.top ===
logger.setTitle("\x1b[95mLL Query\x1b[37m")
logger.setLogLevel(4)
const dgram = require('dgram')//UDP datagram socket
var server = dgram.createSocket('udp4')//Open UDP v4 socket
var BufferCursor = require('buffercursor')//Buffer Util
const config = new JsonConfigFile('./plugins/MineServ/query/config.json')//Config
config.init('query-port',30333)
var pr = require('properties-reader')
var properties = pr('./server.properties')
var onlinePlayers = new Map()
var playerNum = 0
mc.listen('onJoin',function(pl){
    onlinePlayers.set(pl.realName,pl.xuid)
    playerNum ++
})
mc.listen('onLeft',function(pl){
    onlinePlayers.delete(pl.realName)
    playerNum --
})
//Bedrock RakNet Pong
var serverId = BigInt(Math.floor(Math.random() * 10000000000000000)) //RakNet Server ID
const MAGIC = Buffer.from([0x00, 0xff, 0xff, 0x00, 0xfe, 0xfe, 0xfe, 0xfe, 0xfd, 0xfd, 0xfd, 0xfd, 0x12, 0x34, 0x56, 0x78]) //RakNet MagickData
const un_ping = 0x01 //RakNet Unconnected Ping
const un_pong = 0x1c //RakNet Unconnected Pong

function pongBe(port, addr, pingTime) {
    let data = Buffer.alloc(17)
    let status = `MCPE;${properties.get('server-name')};${mc.getServerProtocolVersion()};${mc.getBDSVersion().replace('v','')};0;${properties.get('max-players')};${serverId};${properties.get('level-name')};${properties.get('gamemode')};1`//Responce
    data.writeInt8(un_pong, 0)
    data.writeBigInt64BE(pingTime, 1)
    data.writeBigInt64BE(serverId, 9)
    data = Buffer.concat([data, MAGIC], 1024)
    data.writeInt16BE(status.length, 33)
    data.write(status, 35, status.length, 'utf8')
    server.send(data.subarray(0, 35 + status.length), port, addr, (err) => {})
    logger.debug('Reply: '+status)
}
//Java Query Pong
var token
setInterval(() => {
    min = Math.ceil(1000000)
    max = Math.floor(9999999)
    token = Math.floor(Math.random() * (max - min) + min)
}, 120000)
function pongJe(port, addr, msg){
    if(msg.readInt8(2) == 9){//handshake packet
        let bc = new BufferCursor(Buffer.alloc(13))
        bc.writeInt8(0x09)
        bc.writeInt32BE(msg.readInt32BE(3))
        bc.write(token+'\0')
        server.send(bc.buffer, port, addr, (err) => {})
        logger.debug('Reply: '+bc.buffer)
    }
    else if(msg.readInt8(2) == 0){
        let gm
        switch (properties.get('gamemode')){
            case 'survival':
                gm = 'SMP'
                break;
            case 'creative':
                gm = 'CMP'
            break;
            case 'adventure':
                gm = 'AMP'
            break;
            default:
                gm = 'SMP'
            break;
        }
        let wl
        if(properties.get('allow-list') == false){
            wl = 'off'
        }
        if(properties.get('allow-list') == true){
            wl = 'on'
        }
        if(msg.length == 15){//long query packet
            let KVdata = new Map()
            KVdata.set("hostname", String(properties.get('server-name')))
            KVdata.set("gametype", String(gm))
            KVdata.set("game_id", String('MINECRAFTPE'))
            KVdata.set("version", String(mc.getBDSVersion().replace('v','')))
            KVdata.set("server_engine", String('Bedrock Dedicated Server'))
            KVdata.set("plugins",String( `BDS:LiteLoaderBDS v${ll.versionString()};LLQuery v1.0;`))
            KVdata.set("map", String(properties.get('level-name')))
            KVdata.set("numplayers", '0')
            KVdata.set("maxplayers", String(properties.get('max-players')))
            KVdata.set("whitelist", String(wl))
            KVdata.set("hostip", String('0.0.0.0'))
            KVdata.set("hostport", String(properties.get('server-port')))
            let d = new BufferCursor(Buffer.alloc(512))
            d.writeInt8(0x00)
            d.writeInt32BE(msg.readInt32BE(3))
            d.write("splitnum")
            d.writeInt16BE(0x0080)
            d.writeInt8(0x00)
            KVdata.forEach((v,k)=>{
                d.write(k)
                d.writeInt8(0x00)
                d.write(v)
                d.writeInt8(0x00)
            })
            d.writeInt8(0x00)
            d.writeInt8(0x01)
            d.write("player_")
            d.writeInt8(0x00)
            d.writeInt8(0x00)
            onlinePlayers.forEach((v,k)=>{
                d.write(k.replace(' ','-'))
                d.writeInt8(0x00)
            })
            d.writeInt8(0x00)
            server.send(d.buffer, port, addr, (err) => {})
            logger.debug('Reply: '+d.buffer)
        }
        else{
            let d = new BufferCursor(Buffer.alloc(512))
            d.writeInt8(0x00)
            d.writeInt32BE(msg.readInt32BE(3))
            d.write(String(properties.get('server-name')))
            d.writeInt8(0x00)
            d.write(String(gm))
            d.writeInt8(0x00)
            d.write(String(properties.get('level-name')))
            d.writeInt8(0x00)
            d.write(String(mc.getOnlinePlayers().length))
            d.writeInt8(0x00)
            d.write(String(properties.get('max-players')))
            d.writeInt8(0x00)
            d.write(String(properties.get('server-port')))
            d.write(String('0.0.0.0'))
            d.writeInt8(0x00)
            server.send(d.buffer, port, addr, (err) => {})
            logger.debug('Reply: '+d.buffer)
        }
    }
}
server.on('error', (err) => {
    logger.error(`server error:\n${err}`)
});
server.on('message', (msg, rinfo) => {
    if ((msg.readInt8(0) & 0xff) == un_ping){
        try {
            logger.debug('BE request: port: '+rinfo.port+' addr: '+rinfo.address+' data: '+msg)
            pongBe(rinfo.port, rinfo.address, msg.readBigInt64BE(1))
        } catch (err){
            logger.debug(`Bad data:\n${msg}\n${err}`)
        }
    }
    else if(msg.readInt8(0) == -2){
        try {
            logger.debug('JE request: port: '+rinfo.port+' addr: '+rinfo.address+' data: '+msg)
            pongJe(rinfo.port, rinfo.address, msg)
        } catch (err){
            logger.debug(`Bad data:\n${msg}\n${err}`)
        }
    }
})
server.on('listening', () => {
    const address = server.address();
    logger.info(`\x1b[94mquery started on \x1b[93m${address.address}:${address.port}\x1b[94m!`)
    logger.info('\x1b[94mcheck \x1b[93m./plugins/MineServ/query/config.json \x1b[94mto configure query')
});
server.on('close', () => {
    try {
        logger.info('\x1b[91mclose query')
    } catch (err) {}
});
server.bind(config.get('query-port'), "0.0.0.0")