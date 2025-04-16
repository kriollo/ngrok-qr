import chalk from 'chalk';
import ngrok from 'ngrok';

export async function startNgrok(port: number = 3000): Promise<string> {
    try {
        const url = await ngrok.connect({
            addr: port,
            proto: 'http',
        });
        console.log(
            chalk.green('✓') +
                chalk.bold(' Ngrok túnel establecido en: ') +
                chalk.blue.underline(url),
        );
        console.log(
            chalk.yellow('ℹ') +
                chalk.bold(' Interfaz de inspección de Ngrok disponible en: ') +
                chalk.blue.underline('http://localhost:4040'),
        );
        return url;
    } catch (error) {
        console.error(chalk.red('✖ Error al iniciar ngrok:'), error);
        throw error;
    }
}

export async function stopNgrok(): Promise<void> {
    try {
        await ngrok.disconnect();
        await ngrok.kill();
        console.log(chalk.green('✓') + ' Ngrok túnel cerrado correctamente');
    } catch (error) {
        console.error(chalk.red('✖ Error al detener ngrok:'), error);
        throw error;
    }
}
