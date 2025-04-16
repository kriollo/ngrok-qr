# ngrok-qr

Una herramienta de línea de comandos que genera automáticamente un código QR para tu túnel de ngrok, facilitando compartir tu servidor local con otros dispositivos.

![Demo de ngrok-qr](./ngrok_qr.png)

## ✨ Características

- 🚇 Generación automática de túneles ngrok
- 📱 Generación de códigos QR en la terminal
- 🎨 Interfaz colorida y amigable en la terminal
- 🔄 Cierre automático y limpio del túnel
- ⚙️ Puerto configurable mediante argumentos

## 📋 Requisitos previos

- Node.js (versión 16 o superior)
- npm o yarn
- Una cuenta de ngrok (gratuita o de pago)
- Token de autenticación de ngrok

## 🚀 Instalación

1. Clona este repositorio:

```bash
git clone https://github.com/tuusuario/ngrok-qr.git
cd ngrok-qr
```

2. Instala las dependencias:

```bash
npm install
```

3. Configura tu token de autenticación de ngrok (necesario solo la primera vez):

```bash
npx ngrok authtoken TU_TOKEN_AQUI
```

Para obtener tu token de autenticación:

1. Crea una cuenta en [ngrok.com](https://ngrok.com)
2. Inicia sesión en tu cuenta
3. Ve a [dashboard.ngrok.com/get-started/your-authtoken](https://dashboard.ngrok.com/get-started/your-authtoken)
4. Copia tu token de autenticación
5. Ejecuta el comando anterior reemplazando `TU_TOKEN_AQUI` con tu token

Este paso es necesario solo una vez por dispositivo y el token se guardará automáticamente.

## 💻 Uso

### Comando básico:

```bash
npm start
```

Esto iniciará el túnel en el puerto predeterminado (3000).

### Especificar un puerto personalizado:

```bash
npm start -- -p 8080
```

o

```bash
npm start -- --port 8080
```

### Modo desarrollo:

```bash
npm run dev
```

## 🛠️ Scripts disponibles

- `npm run build` - Compila el proyecto TypeScript a JavaScript
- `npm start` - Ejecuta la aplicación
- `npm run dev` - Inicia la aplicación en modo desarrollo con recarga automática
- `npm run format` - Formatea el código usando Prettier
- `npm run format:check` - Verifica el formato del código

## 🔧 Tecnologías utilizadas

- [TypeScript](https://www.typescriptlang.org/) - Lenguaje de programación
- [ngrok](https://ngrok.com/) - Túneles seguros
- [qrcode](https://www.npmjs.com/package/qrcode) - Generación de códigos QR
- [chalk](https://www.npmjs.com/package/chalk) - Estilos en la terminal
- [yargs](https://www.npmjs.com/package/yargs) - Análisis de argumentos CLI
- [ts-node](https://www.npmjs.com/package/ts-node) - Ejecución de TypeScript

## 📝 Licencia

Este proyecto está bajo la licencia ISC.

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor, asegúrate de actualizar las pruebas según corresponda.

## ⚠️ Solución de problemas

Si encuentras el error "Tunnel session failed", asegúrate de:

1. Tener configurado correctamente tu token de autenticación de ngrok
2. Que el puerto que intentas exponer esté disponible
3. Que no haya otro túnel de ngrok activo
