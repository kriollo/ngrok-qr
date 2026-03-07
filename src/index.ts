#!/usr/bin/env node
import {
    startNgrok,
    stopNgrok,
    isNgrokStarted,
    refreshAuthtoken,
} from './services/ngrok.js';
import { generateQR } from './services/qr.js';
import ngrok from 'ngrok';
import { randomUUID } from 'crypto';
import fs from 'fs';
import { createInterface } from 'readline/promises';

type ParsedArgs = {
    port: number;
    refreshToken: boolean;
    refreshOnly: boolean;
    command: string | null;
    commandArgs: string[];
};

function parseArgs(): ParsedArgs {
    const args = process.argv.slice(2);
    const refreshToken =
        args.includes('--refresh-token') || args.includes('-r');
    const portIndex = args.findIndex(arg => arg === '-p' || arg === '--port');
    const hasPortFlag = portIndex !== -1 && Boolean(args[portIndex + 1]);

    const command =
        args[0] && !args[0].startsWith('-') ? args[0].toLowerCase() : null;
    const commandArgs = command ? args.slice(1) : [];

    if (portIndex !== -1 && args[portIndex + 1]) {
        const port = parseInt(args[portIndex + 1], 10);
        if (!isNaN(port)) {
            return {
                port,
                refreshToken,
                refreshOnly: false,
                command,
                commandArgs,
            };
        }
    }

    return {
        port: 3000,
        refreshToken,
        refreshOnly: refreshToken && !hasPortFlag,
        command,
        commandArgs,
    };
}

function printHelp(): void {
    console.log(`
Uso: ngrok-qr-cli [comando] [opciones]

Comandos:
  help, -h, --help        Muestra esta ayuda
  version, -v, --version  Muestra la versión instalada
  set-token [TOKEN]       Setea el authtoken de ngrok. Si no se pasa TOKEN, se pedirá interactivamente.
  check-token [TOKEN]     Valida si el authtoken (o el TOKEN provisto) puede abrir una sesión ngrok.
  (por defecto)           Inicia ngrok y muestra el código QR. Opciones:
    -p, --port <puerto>   Puerto local a exponer (por defecto 3000)
    -r, --refresh-token    Forzar reingreso / refresco del token antes de iniciar
`);
}

async function readPackageVersion(): Promise<string | null> {
    try {
        const pkgPath = new URL('../package.json', import.meta.url);
        const content = fs.readFileSync(pkgPath, 'utf8');
        const pkg = JSON.parse(content);
        return pkg.version ?? null;
    } catch {
        return null;
    }
}

async function promptForTokenInteractive(
    promptMessage = 'Ingresa tu authtoken de ngrok: ',
): Promise<string> {
    const rl = createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    const answer = await rl.question(promptMessage);
    rl.close();
    return answer.trim();
}

async function checkTokenFlow(token?: string): Promise<void> {
    try {
        let tokenToCheck = token ?? process.env.NGROK_AUTHTOKEN ?? null;

        // If no token provided via arg or env, try reading ngrok config like the service does
        if (!tokenToCheck) {
            const configPaths = [
                (ngrok as any).defaultConfigPath?.() ?? '',
                (ngrok as any).oldDefaultConfigPath?.() ?? '',
            ].filter(Boolean) as string[];

            for (const configPath of configPaths) {
                if (fs.existsSync(configPath)) {
                    const content = fs.readFileSync(configPath, 'utf-8');
                    const match = content.match(/authtoken:\s*(\S+)/);
                    if (match) {
                        tokenToCheck = match[1];
                        break;
                    }
                }
            }
        }

        if (!tokenToCheck) {
            console.error(
                'No se encontró ningún authtoken. Usa `set-token` para configurarlo o pásalo como argumento a `check-token`.',
            );
            process.exitCode = 2;
            return;
        }

        console.log('Validando authtoken con ngrok...');

        // Intenta conectar un túnel temporal para validar el token.
        // Usamos un puerto cualquiera; el objetivo es validar que ngrok acepte la sesión.
        const name = randomUUID();
        const connectPromise = ngrok.connect({
            addr: 4040,
            authtoken: tokenToCheck,
            name,
        });

        // Timeout razonable para la operación
        const timeout = new Promise<never>((_, reject) =>
            setTimeout(
                () => reject(new Error('Timeout al validar token (10s)')),
                10000,
            ),
        );

        const url = (await Promise.race([connectPromise, timeout])) as string;

        if (url) {
            console.log('✓ Token válido: se pudo establecer una sesión ngrok.');
            // Limpiar inmediatamente
            try {
                await ngrok.disconnect(url);
            } catch {
                // Ignorar
            }
            try {
                await ngrok.kill();
            } catch {
                // Ignorar
            }
            process.exitCode = 0;
            return;
        }

        console.error(
            '✖ No se pudo establecer una sesión con ngrok. El token podría ser inválido.',
        );
        process.exitCode = 1;
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('✖ Error al validar el token:', msg);
        process.exitCode = 1;
    }
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
        // Command handling
        if (argv.command) {
            const cmd = argv.command;
            const cmdArgs = argv.commandArgs;

            if (['help', '-h', '--help'].includes(cmd)) {
                printHelp();
                process.exit(0);
            }

            if (['version', '-v', '--version'].includes(cmd)) {
                const v = await readPackageVersion();
                if (v) {
                    console.log(v);
                    process.exit(0);
                } else {
                    console.log('Versión no disponible');
                    process.exit(2);
                }
            }

            if (cmd === 'set-token') {
                const providedToken = cmdArgs[0];
                if (providedToken) {
                    try {
                        await ngrok.authtoken(providedToken);
                        console.log('✓ Authtoken configurado correctamente.');
                        process.exit(0);
                    } catch (error) {
                        const msg =
                            error instanceof Error
                                ? error.message
                                : String(error);
                        console.error(
                            '✖ Error al configurar el authtoken:',
                            msg,
                        );
                        process.exit(1);
                    }
                } else {
                    // Reuse existing interactive flow which prompts and writes config
                    await refreshAuthtoken();
                    process.exit(0);
                }
            }

            if (cmd === 'check-token') {
                const providedToken = cmdArgs[0];
                await checkTokenFlow(providedToken);
                return;
            }

            // Unknown command
            console.error(`Comando desconocido: ${cmd}`);
            printHelp();
            process.exit(2);
        }

        // Default behavior: start app
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
