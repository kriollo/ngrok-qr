import ngrok from 'ngrok';

export async function startNgrok(port: number = 3000): Promise<string> {
    try {
        const url = await ngrok.connect({
            addr: port,
            proto: 'http'
        });
        console.log(`Ngrok túnel establecido en: ${url}`);
        return url;
    } catch (error) {
        console.error('Error al iniciar ngrok:', error);
        throw error;
    }
}

export async function stopNgrok(): Promise<void> {
    try {
        await ngrok.disconnect();
        await ngrok.kill();
        console.log('Ngrok túnel cerrado');
    } catch (error) {
        console.error('Error al detener ngrok:', error);
        throw error;
    }
}
