const fs = require('fs');
const path = require('path');
const SERVERS_PATH = path.join(__dirname, '../database/fivemServers.json');

// Lê o JSON atualizado do disco
function readServers() {
    if (!fs.existsSync(SERVERS_PATH)) {
        fs.writeFileSync(SERVERS_PATH, JSON.stringify({ servidores: {} }, null, 2));
    }
    return JSON.parse(fs.readFileSync(SERVERS_PATH, 'utf8'));
}

// Salva o JSON no disco
function writeServers(data) {
    fs.writeFileSync(SERVERS_PATH, JSON.stringify(data, null, 2));
}

// Validação de IP
function isValidIP(ip) {
    const net = require('net');
    return net.isIP(ip) === 4;
}

// Validação de cor HEX
function isValidHex(hex) {
    return /^#([0-9A-F]{6})$/i.test(hex);
}

// Verifica status do servidor FiveM
async function checkServerStatus(ip, porta) {
    try {
        const fetch = require('node-fetch');
        const res = await fetch(`http://${ip}:${porta}/info.json`, { timeout: 4000 });
        if (!res.ok) return { online: false };
        
        const info = await res.json();
        
        // Buscar jogadores
        const playersRes = await fetch(`http://${ip}:${porta}/players.json`, { timeout: 4000 });
        const players = playersRes.ok ? await playersRes.json() : [];
        
        return {
            online: true,
            players: players.length,
            maxPlayers: info.vars?.sv_maxClients || '??',
            name: info.vars?.sv_projectName || 'Desconhecido',
            info
        };
    } catch (e) {
        return { online: false };
    }
}

module.exports = { readServers, writeServers, isValidIP, isValidHex, checkServerStatus };
