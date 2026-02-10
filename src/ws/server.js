import { WebSocket, WebSocketServer } from "ws";
import { wsArcjet } from "../arcjet.js";

function sendJson(socket, payload){
    if(socket.readyState !== WebSocket.OPEN) return;

    socket.send(JSON.stringify(payload));
}

function broadcast(wss, payload){
    for(const client of wss.clients){
        if(client.readyState !== WebSocket.OPEN) continue;
        
        client.send(JSON.stringify(payload));
    }
}

export function attachWebSocketServer(server){
    const wss = new WebSocketServer({ 
        server,
        path: "/ws",
        maxPayload: 1024 * 1024, // 1MB
    });

    wss.on("connection", async (socket, req) => {
        if(wsArcjet){
            try {
                const decision = await wsArcjet.protect(req);
                if(decision.isDenied()){
                    const code = decision.reason.isRateLimit() ? 4290 : 4003;
                    const reason = decision.reason.isRateLimit() ? "Rate limit exceeded" : "Access denied";

                    socket.close(code, reason);
                    return;
                }
            } catch (error) {
                console.error("Ws Connection error:", error);
                socket.close(1011, "Service security error");
                return;
            }
        }

        socket.isAlive = true;
        socket.on("pong", () => {
            socket.isAlive = true;
        });

        sendJson(socket, { type: "welcome" });

        socket.on("error", (err) => {
            console.error("WebSocket error:", err);
        });
    });

    const interval = setInterval(() => {
        wss.clients.forEach((socket) => {
            if (socket.isAlive === false) {
                return socket.terminate();
            }

            socket.isAlive = false;
            socket.ping();
        });
    }, 30000);

    wss.on("close", () => {
        clearInterval(interval);
    });

    function broadcastMatchCreated(match){
        broadcast(wss, { type: "match_created", data: match });
    }

    return { broadcastMatchCreated };
}

