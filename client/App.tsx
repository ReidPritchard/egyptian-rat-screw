import React, { useState, useEffect } from 'react';
import { ClientGame } from './ClientGame';
import { api } from './api';
import { ClientPlayer } from './ClientPlayer';

export function App() {
    const [localPlayer, setLocalPlayer] = useState<ClientPlayer | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        api.on('connect', () => {
            console.log('Connected to server');
            setIsConnected(true);
            setLocalPlayer(new ClientPlayer(api.getSocketId(), ''));
        });

        api.on('disconnect', () => {
            console.log('Disconnected from server');
            setIsConnected(false);
            setLocalPlayer(null);
        });

        return () => {
            // Clean up listeners if necessary
            api.removeAllListeners('connect');
            api.removeAllListeners('disconnect');
        };
    }, []);

    if (!isConnected) {
        return <div>Connecting to server...</div>;
    }

    if (!localPlayer) {
        return <div>Initializing player...</div>;
    }

    return <ClientGame localPlayer={localPlayer} />;
}