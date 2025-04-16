#!/usr/bin/env node
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { startNgrok, stopNgrok } from './services/ngrok.js';
import { generateQR } from './services/qr.js';

async function main() {
    const argv = await yargs(hideBin(process.argv))
        .option('port', {
            alias: 'p',
            type: 'number',
            description: 'Puerto a utilizar',
            default: 3000,
        })
        .help().argv;

    try {
        console.log('Iniciando la aplicación...\n\n\n\n');
        console.log(`Iniciando ngrok en el puerto ${argv.port}...`);

        const url = await startNgrok(argv.port);
        console.log('\nURL de ngrok generada:');
        console.log(url);

        console.log('\nCódigo QR:');
        await generateQR(url);
        // console.log(qr);

        // Manejar el cierre de la aplicación
        process.on('SIGINT', async () => {
            console.log('\nCerrando ngrok...');
            await stopNgrok();
            process.exit(0);
        });
    } catch (error) {
        console.error('Error en la aplicación:', error);
        await stopNgrok();
        process.exit(1);
    }
}

main();
