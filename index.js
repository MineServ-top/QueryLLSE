const dgram = require("dgram");
const { SmartBuffer } = require('@harmonytf/smart-buffer');
const properties = require('properties-reader');
const config_file = new JsonConfigFile('./plugins/QueryLLSE/config.json');
const pr = properties('./server.properties');
if(!config_file.get('QueryServer')){
    logger.warn(`Configuration file not found, creating!`)
    config_file.init('QueryServer', {
      host: "0.0.0.0",
      port: 25565,

      maxPlayers: "default",
      motd: "default",
      map: "default",
      gameMode: "default",
      wl: "default",
      gameID: "default",
      version: "default",
      tokenLifetime: "default"
    });
    logger.warn(`The config file has been created and is located in \x1b[1m\x1b[32m"./plugins/QueryLLSE/config.json"\x1b[0m!`);
}
const config = config_file.get('QueryServer');
ll.registerPlugin('QueryLLSE', 'Minecraft Query protocol support.', [2,0,0]);
logger.setTitle("\x1b[95mQueryLLSE\x1b[37m");
class QueryServer {
  constructor(options = {}) {
    this.host = options.host || "0.0.0.0";
    this.port = options.port || 25565;

    this.players = new Map();
    this.maxPlayers = options.maxPlayers || 20;
    this.motd = options.motd || "A Minecraft Server";
    this.map = options.map || "World";
    this.gameMode = options.gameMode || "Survival";
    this.wl = options.wl || "off";
    this.gameID = options.gameID || "MINECRAFTBE";
    this.version = options.version || "1.19.70";
    this.clientTokens = new Map();
    this.tokenLifetime = options.tokenLifetime || 30;
    this.socket = dgram.createSocket("udp4");
    this.socket.bind(this.port, this.host, () => {
      logger.debug(`Server is listening on ${this.host}:${this.port}`);
    });
    this.socket.on('listening', () => {
        const address = this.socket.address();
        logger.info(`\x1b[94mMinecraft Query server started on \x1b[93m${address.address}:${address.port}\x1b[94m!`);
    });
    this.socket.on("message", (message, rinfo) => this.handleMessage(message, rinfo));
  }

  genToken() {
    const min = Math.ceil(1000000);
    return Math.floor(Math.random() * (Math.floor(9999999) - min + 1) + min);
  }

  handleMessage(message, rinfo) {
    const magick = message.readUInt16BE(0);
    const type = message.readUInt8(2);
    if (magick !== 0xfefd) {
      logger.debug(`Client ${rinfo.address}:${rinfo.port} send bad data!`);
      return;
    }
    if ((this.clientTokens.has(rinfo.address) && this.clientTokens.get(rinfo.address).expiresAt < Date.now()) || !this.clientTokens.has(rinfo.address)) {
      this.clientTokens.set(rinfo.address, {
        token: this.genToken(),
        expiresAt: Date.now() + this.tokenLifetime * 1000,
      });
    }

    if (type === 0x09) {
      this.sendHandshake(rinfo, message);
    } else if (type === 0x00 && message.length == 15) {
      this.sendFullInfo(rinfo, message);
    } else if (type === 0x00 && message.length == 11) {
      this.sendBasicInfo(rinfo, message);
    } 
  }

  sendHandshake(rinfo, message) {
    const sessionID = message.readInt32BE(3);
    const clientToken = this.clientTokens.get(rinfo.address).token;
    if (!this.clientTokens.has(rinfo.address) || this.clientTokens.get(rinfo.address).expiresAt < Date.now()) {
      return;
    }
  
    const buffer = new SmartBuffer();
    buffer
      .writeUInt8(0x09) // packet ID
      .writeInt32BE(sessionID) // session ID
      .writeStringNT(clientToken.toString()) // challenge token
  
    const data = buffer.toBuffer();
  
    this.socket.send(data, 0, data.length, rinfo.port, rinfo.address, (err) => {
      if (err) {
        logger.error(err);
      }
    });
  }
  

  sendBasicInfo(rinfo, message) {
    const sessionID = message.readInt32BE(3);
    const cToken = message.readInt32BE(7).toString();

    if (
      !this.clientTokens.has(rinfo.address) ||
      this.clientTokens.get(rinfo.address).expiresAt < Date.now() ||
      cToken !== this.clientTokens.get(rinfo.address).token
    ) {
      return;
    }
  
    const buffer = new SmartBuffer();
    buffer
      .writeUInt8(0x00) // packet ID
      .writeInt32BE(sessionID) // session ID
      .writeStringNT(this.motd) // MOTD
      .writeStringNT(this.gameID) // game ID (type)
      .writeStringNT(this.map) // server map
      .writeStringNT(this.players.size) // current number of players
      .writeStringNT(this.maxPlayers) // maximum number of players
      .writeUInt16LE(this.port) // server port in little-endian short format
      .writeStringNT(this.host) // server IP
  
    const data = buffer.toBuffer();
  
    this.socket.send(data, 0, data.length, rinfo.port, rinfo.address, (err) => {
      if (err) {
        logger.error(err);
      }
    });
  }  

  sendFullInfo(rinfo, message) {
    const sessionID = message.readInt32BE(3);
    const clientToken = this.clientTokens.get(rinfo.address).token;

    if (
      !this.clientTokens.has(rinfo.address) ||
      this.clientTokens.get(rinfo.address).expiresAt < Date.now() ||
      clientToken !== this.clientTokens.get(rinfo.address).token
    ) {
      return;
    }
    const kvData = [
      { key: "hostname", value: this.motd },
      { key: "gametype", value: this.gameMode },
      { key: "game_id", value: this.gameID },
      { key: "version", value: this.version },
      { key: "server_engine", value: "Bedrock Dedicated Server" },
      { key: "plugins", value: "BDS:QueryLLSE v2" },
      { key: "map", value: this.map },
      { key: "numplayers", value: this.players.size },
      { key: "maxplayers", value: this.maxPlayers },
      { key: "whitelist", value: this.wl },
      { key: "hostip", value: this.host },
      { key: "hostport", value: this.port },
    ];

    const buffer = new SmartBuffer();
    buffer
    .writeUInt8(0x00) // packet ID
    .writeInt32BE(sessionID) // session ID
    .writeStringNT("splitnum") // Padding
    .writeUInt8(0x80) // Padding
    .writeUInt8(0x00) // Padding
    kvData.forEach(({ key, value }) => {// K, V section
      buffer.writeStringNT(String(key));
      buffer.writeStringNT(String(value));
    });
    buffer
    .writeUInt8(0x00) // Padding
    .writeUInt8(0x01) // Padding
    .writeStringNT("player_") // Padding
    .writeUInt8(0x00) // Padding
    for (const [playerName] of this.players) {// Players section
      buffer.writeStringNT(playerName);
    }
    buffer.writeUInt8(0x00)// terminating

    const data = buffer.toBuffer();
    this.socket.send(data, 0, data.length, rinfo.port, rinfo.address, (err) => {
      if (err) {
        logger.error(err);
      }
    });
  }

  addPlayer(player) {
    this.players.set(player.realName, player.xuid);
  }

  removePlayer(player) {
    this.players.delete(player.realName);
  }

  stop() {
    this.socket.close(() => {
      logger.debug(`Query server is stopped`);
    });
  }
}

const query = new QueryServer({
  host: config.host !== "default" ? config.host : "0.0.0.0",
  port: config.port !== "default" ? config.port : 25565,
  
  maxPlayers: config.maxPlayers !== "default" ? config.maxPlayers : pr.get('max-players'),
  motd: config.motd !== "default" ? config.motd : pr.get('server-name'),
  map: config.map !== "default" ? config.map : pr.get('level-name'),
  gameMode: config.gameMode !== "default" ? config.gameMode : pr.get('gamemode'),
  wl: config.wl !== "default" ? config.port : pr.get('allow-list'),
  gameID: config.gameID !== "default" ? config.gameID : "MINECRAFTBE",
  version: config.version !== "default" ? config.version : mc.getBDSVersion().replace('v',''),
  tokenLifetime: config.tokenLifetime !== "default" ? config.tokenLifetime : 30
})

mc.listen("onConsoleCmd",(cmd) => {
    if(cmd === 'll reload' || cmd === 'll reload RConLLSE'){
        query.stop()
    }
})

mc.listen('onJoin', (player) => {
    query.addPlayer(player)
});
mc.listen('onLeft', (player) => {
    query.removePlayer(player)
});
