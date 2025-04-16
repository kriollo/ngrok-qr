# ngrok-qr

Aplicación que muestra la URL de ngrok en código QR. Esta herramienta es útil para compartir fácilmente túneles de ngrok escaneando un código QR.

## Características

- Genera túneles de ngrok
- Convierte automáticamente la URL del túnel en un código QR
- Visualización del código QR en la terminal

## Requisitos previos

- Node.js (versión 16 o superior)
- npm o yarn
- Una cuenta de ngrok (gratuita o de pago)

## Instalación

1. Clona este repositorio:
```bash
git clone https://github.com/tuusuario/ngrok-qr.git
cd ngrok-qr
```

2. Instala las dependencias:
```bash
npm install
```

## Configuración

Antes de usar la aplicación, asegúrate de tener configurado tu token de autenticación de ngrok. Puedes encontrar tu token en [dashboard de ngrok](https://dashboard.ngrok.com/get-started/your-authtoken).

## Uso

Para iniciar la aplicación en modo desarrollo:
```bash
npm run dev
```

Para construir y ejecutar en producción:
```bash
npm run build
npm start
```

## Scripts disponibles

- `npm run build` - Compila el proyecto TypeScript
- `npm start` - Ejecuta la aplicación
- `npm run dev` - Ejecuta la aplicación en modo desarrollo con recarga automática

## Tecnologías utilizadas

- TypeScript
- ngrok
- qrcode
- ts-node

## Licencia

ISC
