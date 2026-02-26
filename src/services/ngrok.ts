import chalk from 'chalk';
import ngrok from 'ngrok';
import readline from 'readline';
import { spawn, ChildProcess } from 'child_process';
import { promisify } from 'util';
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const execAsync = promisify(exec);

let ngrokStarted = false;
let ngrokProcess: ChildProcess | null = null;

async function killNgrokProcess(): Promise<void> {
    try {
        await execAsync('taskkill //F //IM ngrok.exe', { windowsHide: true });
    } catch {
        // Ignore if no process
    }
}

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

    const configPath = ngrok.defaultConfigPath();
    const fs = await import('fs');

    if (fs.existsSync(configPath)) {
        const content = fs.readFileSync(configPath, 'utf-8');
        const match = content.match(/authtoken:\s*(\S+)/);
        if (match) {
            return match[1];
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

export async function startNgrok(port: number = 3000): Promise<string> {
    const token = await ensureAuthtoken();

    await killNgrokProcess();
    await new Promise(resolve => setTimeout(resolve, 1000));

    const ngrokPath = path.join(
        process.cwd(),
        'node_modules',
        '.pnpm',
        'ngrok@5.0.0-beta.2',
        'node_modules',
        'ngrok',
        'bin',
        'ngrok.exe',
    );

    console.log('Using ngrok from:', ngrokPath);

    return new Promise((resolve, reject) => {
        const args = [
            'http',
            String(port),
            '--authtoken',
            token,
            '--log',
            'stdout',
        ];

        ngrokProcess = spawn(ngrokPath, args, {
            stdio: ['ignore', 'pipe', 'pipe'],
            detached: false,
            windowsHide: true,
        });

        let url: string | null = null;

        ngrokProcess.stdout?.on('data', (data: Buffer) => {
            const output = data.toString();
            const urlMatch = output.match(/url=(https?:\/\/[^\s]+)/);
            if (urlMatch) {
                url = urlMatch[1];
            }
        });

        ngrokProcess.stderr?.on('data', (data: Buffer) => {
            const output = data.toString();
            console.log('ngrok:', output.trim());
        });

        ngrokProcess.on('error', err => {
            reject(err);
        });

        ngrokProcess.on('close', code => {
            if (code !== 0 && !url) {
                reject(new Error(`ngrok exited with code ${code}`));
            }
        });

        setTimeout(() => {
            if (url) {
                ngrokStarted = true;
                console.log(
                    chalk.green('✓') +
                        chalk.bold(' Ngrok túnel establecido en: ') +
                        chalk.blue.underline(url),
                );
                resolve(url);
            } else {
                reject(new Error('No se pudo obtener la URL de ngrok'));
            }
        }, 5000);
    });
}

export async function stopNgrok(): Promise<void> {
    if (!ngrokStarted) {
        return;
    }

    try {
        if (ngrokProcess) {
            ngrokProcess.kill();
            ngrokProcess = null;
        }

        await killNgrokProcess();

        ngrokStarted = false;
        console.log(chalk.green('✓') + ' Ngrok túnel cerrado correctamente');
    } catch (error) {
        console.error(chalk.red('✖ Error al detener ngrok:'), error);
    }
}

export function isNgrokStarted(): boolean {
    return ngrokStarted;
}
