# QueryLLSE

# EN: 
Plugin for LLSE that adds support for Minecraft Query protocol.

To install the plugin you need to go to [**releases**](https://github.com/mineserv-top/QueryLLSE/releases/) and download **"QueryLLSE.llplugin"**, then put it in a folder **"./plugins/"** and restart the server.

Plugin configuration in **"./plugins/QueryLLSE/config.json"**.

Default Config -

```json
{
    "QueryServer": {
        "host": "0.0.0.0",//Query adres. If set to "default", used "0.0.0.0"
        "port": "25565",//Query port. If set to "default", used "25565"
        "maxPlayers": "default",//Max players. (228) If set to "default", then the values ​​received from the server are used. (below as well)
        "motd": "default",//MOTD. (AlphaCraft)
        "map": "default",//Level name. (world)
        "gameMode": "default",//Server gamemode. (survival)
        "wl": "default",//Is whitelist enabled. (boolean)
        "gameID": "default",//Game ID (MINECRAFT/MINECRAFTBE)
        "version": "default",//Version. (1.19.70)
        "tokenLifetime": "default"//client token lifetime. (30) If set to "default", used 30
    }
}
```
The plugin was developed specifically for Minecraft servers monitoring [**Mineserv.top**](https://mineserv.top)

# RU: 

Плагин для LLSE, который добавляет поддержку протокола Minecraft Query.

Для установки плагина тебе необходимо перейти к [**релизам**](https://github.com/mineserv-top/QueryLLSE/releases/) и загрузить оттуда файл **"QueryLLSE.llplugin"**, затем закинуть его в папку **"./plugins/"** и перезагрузить сервер.

Настройка плагина производится в файле **"./plugins/QueryLLSE/config.json"**.

Пример конфига -

```json
{
    "QueryServer": {
        "host": "0.0.0.0",//Адрес Query. Если стоит "default", то используются "0.0.0.0"
        "port": "25565",//Порт Query. Если стоит "default", то используются "25565"

        "maxPlayers": "default",//Макс игроков. (228) Если стоит "default", то используются значения, получаемые от сервера. (ниже так-же)
        "motd": "default",//MOTD сервера. (AlphaCraft)
        "map": "default",//Название мира. (world)
        "gameMode": "default",//Режим игры на сервере. (survival)
        "wl": "default",//Включен ли вайтлист. (boolean)
        "gameID": "default",//Айди игры (MINECRAFT/MINECRAFTBE)
        "version": "default",//Версия сервера. (1.19.70)
        "tokenLifetime": "default"//Время жизни токена клиента. (30) Весли стоит "default", то используются 30
    }
}
```