import chalk from 'chalk';
import ngrok from 'ngrok';
import { createInterface } from 'readline/promises';
import { setTimeout as delay } from 'timers/promises';
import { randomUUID } from 'crypto';

let ngrokStarted = false;

function isSessionLimitError(error: unknown): boolean {
    const err = error as {
        message?: string;
        body?: { details?: { err?: string } };
    };
    const message = err?.message ?? '';
    const details = err?.body?.details?.err ?? '';
    return (
        message.includes('ERR_NGROK_108') ||
        details.includes('ERR_NGROK_108') ||
        message.toLowerCase().includes('session') ||
        details.toLowerCase().includes('session')
    );
}

async function promptForAuthtoken(): Promise<string> {
    const rl = createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    const answer = await rl.question(
        chalk.yellow('ℹ Ingresa tu authtoken de ngrok: '),
    );
    rl.close();
    return answer.trim();
}

async function getAuthtoken(): Promise<string | null> {
    const envToken = process.env.NGROK_AUTHTOKEN;
    if (envToken) {
        return envToken;
    }

    const fs = await import('fs');
    const configPaths = [
        ngrok.defaultConfigPath(),
        ngrok.oldDefaultConfigPath(),
    ];

    for (const configPath of configPaths) {
        if (fs.existsSync(configPath)) {
            const content = fs.readFileSync(configPath, 'utf-8');
            const match = content.match(/authtoken:\s*(\S+)/);
            if (match) {
                return match[1];
            }
        }
    }

    return null;
}

async function ensureAuthtoken(): Promise<string> {
    let token = await getAuthtoken();

    if (!token) {
        console.log(chalk.yellow('ℹ No se encontró authtoken configurado.'));
        token = await promptForAuthtoken();

        if (!token) {
            throw new Error(
                'Se requiere un authtoken de ngrok para continuar.',
            );
        }

        try {
            await ngrok.authtoken(token);
            console.log(
                chalk.green('✓') + ' Authtoken configurado correctamente.',
            );
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            console.error(
                chalk.red('✖ Error al configurar el authtoken:'),
                msg,
            );
            throw new Error(
                'Error al configurar el authtoken. Verifica que sea válido.',
            );
        }
    }

    return token;
}

// Mata cualquier proceso ngrok huérfano de ejecuciones anteriores.
// Necesario porque cuentas free solo permiten 1 sesión simultánea (ERR_NGROK_108):
// si el daemon anterior sigue activo, el nuevo proceso arranca en puerto alternativo
// y falla al intentar establecer una segunda sesión con el servidor de ngrok.
async function killOrphanedDaemon(): Promise<void> {
    try {
        const res = await fetch('http://127.0.0.1:4040/api/tunnels', {
            signal: AbortSignal.timeout(500),
        });
        if (!res.ok) return;

        // Daemon encontrado — matarlo a nivel OS para liberar la sesión ngrok
        const { execSync } = await import('child_process');
        if (process.platform === 'win32') {
            execSync('taskkill /f /im ngrok.exe', { stdio: 'ignore' });
        } else {
            execSync('pkill ngrok', { stdio: 'ignore' });
        }
        await delay(400);
    } catch {
        // Daemon no activo o ya muerto — continuar normalmente
    }
}

export async function startNgrok(port: number = 3000): Promise<string> {
    const token = await ensureAuthtoken();

    // Liberar cualquier daemon huérfano y proceso previo de esta instancia
    await killOrphanedDaemon();
    try {
        await ngrok.kill();
    } catch {
        // Ignorar si no hay proceso activo
    }

    // Workaround para bug en ngrok@5.0.0-beta.2 + binario ngrok v3:
    // El daemon pre-registra el UUID del túnel internamente incluso cuando devuelve
    // 503 "not ready yet". La librería reintenta con el mismo UUID → 400 "already exists".
    // Solución: detectar el error, esperar a que la sesión se establezca realmente
    // (via onStatusChange), y reintentar con un nuevo UUID.
    let resolveSession!: () => void;
    // eslint-disable-next-line promise/avoid-new
    const sessionReady = new Promise<void>(
        resolve => (resolveSession = resolve),
    );

    let lastError: unknown = null;
    for (let attempt = 1; attempt <= 2; attempt++) {
        try {
            const url = await ngrok.connect({
                addr: port,
                authtoken: token,
                name: randomUUID(),
                // Solo en el primer intento: registrar el callback en startProcess
                ...(attempt === 1 && {
                    onStatusChange: (status: 'connected' | 'closed') => {
                        if (status === 'connected') resolveSession();
                    },
                }),
            });
            ngrokStarted = true;
            console.log(
                chalk.green('✓') +
                    chalk.bold(' Ngrok túnel establecido en: ') +
                    chalk.blue.underline(url),
            );
            const inspectUrl = ngrok.getUrl();
            if (inspectUrl) {
                console.log(
                    chalk.yellow('ℹ') +
                        chalk.bold(' Interfaz de inspección disponible en: ') +
                        chalk.blue.underline(inspectUrl),
                );
            }
            return url;
        } catch (error) {
            lastError = error;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const isGhostTunnelBug =
                (error as any)?.body?.error_code === 102 && attempt < 2;
            if (!isGhostTunnelBug) throw error;

            // Esperar hasta que la sesión esté establecida (máx. 10 s)
            await Promise.race([sessionReady, delay(10_000)]);
        }
    }

    if (isSessionLimitError(lastError)) {
        throw new Error(
            'Parece que ya hay una sesión ngrok activa con este token en este u otro PC. ' +
                'Cierra esa sesión y vuelve a intentar.',
        );
    }

    throw new Error('No se pudo establecer el túnel ngrok');
}

export async function refreshAuthtoken(): Promise<string> {
    const token = await promptForAuthtoken();

    if (!token) {
        throw new Error('Se requiere un authtoken de ngrok para continuar.');
    }

    try {
        await ngrok.authtoken(token);
        console.log(chalk.green('✓') + ' Authtoken configurado correctamente.');
    } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error(chalk.red('✖ Error al configurar el authtoken:'), msg);
        throw new Error(
            'Error al configurar el authtoken. Verifica que sea válido.',
        );
    }

    return token;
}

export async function stopNgrok(): Promise<void> {
    try {
        await ngrok.disconnect();
    } catch {
        // sin efecto si no hay túnel activo
    }
    try {
        await ngrok.kill();
    } catch {
        // sin efecto si no hay proceso activo
    }
    if (ngrokStarted) {
        console.log(chalk.green('✓') + ' Ngrok túnel cerrado correctamente');
    }
    ngrokStarted = false;
}

export function isNgrokStarted(): boolean {
    return ngrokStarted;
}
