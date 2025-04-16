import chalk from 'chalk';
import QRCode from 'qrcode';

export async function generateQR(url: string): Promise<string> {
    try {
        const qrString = await QRCode.toString(url, {
            type: 'terminal',
            small: true,
        });
        console.log(chalk.cyan('\nCódigo QR para acceder a tu aplicación:'));
        console.log(qrString);
        return qrString;
    } catch (error) {
        console.error(chalk.red('✖ Error al generar el código QR:'), error);
        throw error;
    }
}
