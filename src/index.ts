#!/usr/bin/env node
import {
    startNgrok,
    stopNgrok,
    isNgrokStarted,
    refreshAuthtoken,
} from './services/ngrok.js';
import { generateQR } from './services/qr.js';

function parseArgs(): {
    port: number;
    refreshToken: boolean;
    refreshOnly: boolean;
} {
    const args = process.argv.slice(2);
    const refreshToken =
        args.includes('--refresh-token') || args.includes('-r');
    const portIndex = args.findIndex(arg => arg === '-p' || arg === '--port');
    const hasPortFlag = portIndex !== -1 && Boolean(args[portIndex + 1]);

    if (portIndex !== -1 && args[portIndex + 1]) {
        const port = parseInt(args[portIndex + 1], 10);
        if (!isNaN(port)) {
            return { port, refreshToken, refreshOnly: false };
        }
    }

    return {
        port: 3000,
        refreshToken,
        refreshOnly: refreshToken && !hasPortFlag,
    };
}

async function main() {
    const argv = parseArgs();

    const cleanup = async () => {
        if (isNgrokStarted()) {
            console.log('\nCerrando ngrok...');
            await stopNgrok();
        }
        process.exit(0);
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);

    try {
        console.log('\n\n\n\n');
        console.log('Iniciando la aplicación...\n');

        if (argv.refreshToken) {
            await refreshAuthtoken();
        }
        if (argv.refreshOnly) {
            process.exit(0);
        }
        console.log(`Iniciando ngrok en el puerto ${argv.port}...`);

        const url = await startNgrok(argv.port);

        await generateQR(url);
    } catch (error) {
        console.error('Error en la aplicación:', error);
        await stopNgrok();
        process.exit(1);
    }
}

main();
