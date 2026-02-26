#!/usr/bin/env node
import { startNgrok, stopNgrok, isNgrokStarted } from './services/ngrok.js';
import { generateQR } from './services/qr.js';

function parseArgs(): { port: number } {
    const args = process.argv.slice(2);
    const portIndex = args.findIndex(arg => arg === '-p' || arg === '--port');

    if (portIndex !== -1 && args[portIndex + 1]) {
        const port = parseInt(args[portIndex + 1], 10);
        if (!isNaN(port)) {
            return { port };
        }
    }

    return { port: 3000 };
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
