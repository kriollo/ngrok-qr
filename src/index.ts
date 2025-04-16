import { startNgrok, stopNgrok } from './services/ngrok.js';
import { generateQR } from './services/qr.js';

async function main() {
    try {
        const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
        console.log(`Iniciando ngrok en el puerto ${port}...`);

        const url = await startNgrok(port);
        console.log('\nURL de ngrok generada:');
        console.log(url);

        console.log('\nCódigo QR:');
        const qr = await generateQR(url);
        console.log(qr);

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
