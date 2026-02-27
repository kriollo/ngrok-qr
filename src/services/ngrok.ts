import chalk from 'chalk';
import ngrok from 'ngrok';
import readline from 'readline';

let ngrokStarted = false;

async function promptForAuthtoken(): Promise<string> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise(resolve => {
        rl.question(
            chalk.yellow('ℹ Ingresa tu authtoken de ngrok: '),
            answer => {
                rl.close();
                resolve(answer.trim());
            },
        );
    });
}

async function getAuthtoken(): Promise<string | null> {
    const envToken = process.env.NGROK_AUTHTOKEN;
    if (envToken) {
        return envToken;
    }

    const fs = await import('fs');
    const configPaths = [ngrok.defaultConfigPath(), ngrok.oldDefaultConfigPath()];

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

// Elimina túneles activos del daemon ngrok si ya está corriendo (de una ejecución anterior)
async function clearExistingTunnels(): Promise<void> {
    try {
        const res = await fetch('http://127.0.0.1:4040/api/tunnels');
        if (!res.ok) return;
        const data = (await res.json()) as { tunnels: Array<{ name: string }> };
        await Promise.all(
            data.tunnels.map(t =>
                fetch(
                    `http://127.0.0.1:4040/api/tunnels/${encodeURIComponent(t.name)}`,
                    { method: 'DELETE' },
                ).catch(() => {}),
            ),
        );
    } catch {
        // ngrok no está en ejecución — ignorar
    }
}

export async function startNgrok(port: number = 3000): Promise<string> {
    const token = await ensureAuthtoken();

    // Limpiar túneles y procesos de ejecuciones anteriores
    await clearExistingTunnels();
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
    const sessionReady = new Promise<void>(r => (resolveSession = r));

    for (let attempt = 1; attempt <= 2; attempt++) {
        try {
            const url = await ngrok.connect({
                addr: port,
                authtoken: token,
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
            return url;
        } catch (error) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const isGhostTunnelBug =
                (error as any)?.body?.error_code === 102 && attempt < 2;
            if (!isGhostTunnelBug) throw error;

            // Esperar hasta que la sesión esté establecida (máx. 10 s)
            await Promise.race([
                sessionReady,
                new Promise<void>(r => setTimeout(r, 10_000)),
            ]);
        }
    }

    throw new Error('No se pudo establecer el túnel ngrok');
}

export async function stopNgrok(): Promise<void> {
    try {
        await ngrok.disconnect();
    } catch {}
    try {
        await ngrok.kill();
    } catch {}
    if (ngrokStarted) {
        console.log(chalk.green('✓') + ' Ngrok túnel cerrado correctamente');
    }
    ngrokStarted = false;
}

export function isNgrokStarted(): boolean {
    return ngrokStarted;
}
