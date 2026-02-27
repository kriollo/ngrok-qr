# ngrok-qr-cli

CLI para exponer tu servidor local con ngrok y mostrar la URL pública como código QR en la terminal.

> **Requisito:** Necesitas un authtoken de ngrok (gratuito). [¿Cómo obtenerlo?](#1-configurar-el-authtoken-de-ngrok)

---

## Instalación global (recomendado)

```bash
npm install -g ngrok-qr-cli
```

Una vez instalado, ejecuta:

```bash
ngrok-qr-cli --port 3000
```

- `-p` / `--port`: Puerto local a exponer (por defecto: `3000`)

---

## Primeros pasos

### 1. Configurar el authtoken de ngrok

Crea una cuenta gratuita en [ngrok.com](https://ngrok.com), obtén tu token desde el
[dashboard](https://dashboard.ngrok.com/get-started/your-authtoken) y ejecútalo una vez:

```bash
ngrok-qr-cli   # la primera vez te pedirá el token interactivamente
```

O bien configúralo manualmente con el CLI de ngrok:

```bash
npx ngrok authtoken TU_TOKEN
```

El token se guarda en `~/.config/ngrok/ngrok.yml` y no necesitas repetirlo.

---

## Uso

```bash
# Puerto por defecto (3000)
ngrok-qr-cli

# Puerto personalizado
ngrok-qr-cli --port 8080
ngrok-qr-cli -p 8080
```

---

## Desarrollo local

**Requisitos:** Node.js ≥ 18, pnpm

```bash
git clone https://github.com/tuusuario/ngrok-qr-cli.git
cd ngrok-qr-cli
pnpm install
pnpm start -- --port 3000
```

### Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `pnpm start` | Ejecuta sin compilar (tsx) |
| `pnpm run dev` | Modo watch (recarga automática) |
| `pnpm run build` | Compila TypeScript → `dist/` |
| `pnpm run lint` | Linting con oxlint |
| `pnpm run format` | Formatea el código con Prettier |

---

## Publicar en npm

```bash
# Compilar y empaquetar
pnpm run build
pnpm pack           # genera ngrok-qr-cli-x.x.x.tgz

# Publicar al registro de npm
pnpm publish
```

> Requiere cuenta en [npmjs.com](https://npmjs.com) y `npm login`.

---

## Instalar desde tarball (sin npm registry)

Para distribuir sin publicar en npm:

```bash
# En la máquina de desarrollo
pnpm run build
pnpm pack

# Transferir ngrok-qr-cli-2.0.0.tgz a la otra máquina y ejecutar:
npm install -g ngrok-qr-cli-2.0.0.tgz
```

---

## Tecnologías

- [TypeScript](https://www.typescriptlang.org/) — lenguaje tipado
- [tsup](https://tsup.egoist.dev/) — bundler / compilador
- [ngrok](https://ngrok.com/) — túneles seguros
- [qrcode](https://www.npmjs.com/package/qrcode) — generación de QR
- [chalk](https://www.npmjs.com/package/chalk) — estilos en terminal

---

## Solución de problemas

**"invalid tunnel configuration" / "tunnel already exists"**
El binario ngrok v3 tiene un bug de timing al arrancar. Esta herramienta lo resuelve
automáticamente con un reintento tras detectar la sesión activa.

**"Your account is limited to 1 simultaneous ngrok agent sessions" (ERR_NGROK_108)**
Asegúrate de que no haya otra sesión de ngrok activa. Las cuentas gratuitas permiten
solo 1 agente a la vez.

**El binario de ngrok no se descargó (usuarios pnpm)**
Ejecuta `pnpm approve-builds` para permitir los scripts de instalación del paquete ngrok.

---

## Licencia

ISC
