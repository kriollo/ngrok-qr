import QRCode from 'qrcode';

export async function generateQR(text: string): Promise<string> {
    try {
        const qrCode = await QRCode.toString(text, {
            type: 'terminal',
            small: true
        });
        return qrCode;
    } catch (error) {
        console.error('Error al generar el código QR:', error);
        throw error;
    }
}
