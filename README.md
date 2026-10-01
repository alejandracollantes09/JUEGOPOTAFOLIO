# 🏥 Hospital Olvidado — Portafolio Interactivo de Terror

Un portafolio de diseño gráfico presentado como un juego de terror en primera persona ambientado en un hospital abandonado.

## 🎮 Cómo jugar

| Control | Acción |
|---------|--------|
| `WASD` | Moverse por el hospital |
| `Mouse` | Rotar la cámara |
| `E` | Interactuar con objetos |
| `ESC` | Pausar / desbloquear cursor |
| `🔊` | Silenciar música |

**Objetivo:** Explora el hospital, encuentra los 8 puntos interactivos, resuelve los acertijos y recoge las llaves 🗝 para desbloquear los trabajos del portafolio.

## 📁 Estructura del proyecto

```
JUEGOPOTAFOLIO/
├── index.html              # Entrada principal
├── css/
│   └── style.css           # Estilos del juego
├── js/
│   ├── main.js             # Punto de entrada
│   ├── engine.js           # Motor 3D (Three.js)
│   ├── ui.js               # Interfaz y modales
│   ├── audio.js            # Sistema de audio
│   └── data.js             # ✏️ EDITAR AQUÍ: trabajos y acertijos
├── assets/
│   ├── models/
│   │   └── hospital.glb    # 🏥 Modelo 3D del hospital (agregar aquí)
│   ├── audio/              # 🔊 Archivos de audio (ver abajo)
│   ├── images/             # 🖼 Imágenes de los trabajos
│   └── textures/           # Texturas adicionales
```

## ✏️ Cómo agregar tu contenido

### 1. Trabajos del portafolio
Edita `js/data.js` → sección `PORTFOLIO_ITEMS`:
```js
{
  id: 'work-1',
  title: 'Nombre de tu trabajo',
  description: 'Descripción del proyecto...',
  images: ['assets/images/mi-imagen.jpg'],
  link: 'https://tulink.com', // opcional
  tools: ['Illustrator', 'Photoshop'],
}
```

### 2. Acertijos
Edita `js/data.js` → sección `RIDDLES`. Cambia las preguntas y respuestas según tu portafolio.

### 3. Modelo 3D del hospital
Coloca el archivo en: `assets/models/hospital.glb`

> El modelo usado es [Abandoned Hospital: part one](https://sketchfab.com/3d-models/abandoned-hospital-part-one-8461ff4cbf23429ebbc49388305a8b9d) por **Veterock (@windofglass)**, licencia CC Attribution.

### 4. Audio
Coloca los archivos en `assets/audio/`:

| Archivo | Descripción |
|---------|-------------|
| `ambient.mp3` | Música de fondo (loop) |
| `footstep1.mp3` | Paso izquierdo |
| `footstep2.mp3` | Paso derecho |
| `key_pickup.mp3` | Recoger llave |
| `door_unlock.mp3` | Puerta abriéndose |
| `correct.mp3` | Acertijo correcto |
| `wrong.mp3` | Acertijo incorrecto |
| `jumpscare.mp3` | Jumpscare (opcional) |

**Fuentes de audio gratuitas:**
- [freesound.org](https://freesound.org) (CC0)
- [mixkit.co](https://mixkit.co/free-sound-effects/)
- [pixabay.com](https://pixabay.com/sound-effects/)

### 5. Posiciones de los objetos interactivos
Si el modelo 3D del hospital tiene posiciones diferentes, ajusta las coordenadas en `js/data.js` → sección `INTERACTION_POINTS`.

## 🚀 Correr localmente

Necesitas un servidor local (los módulos ES y los archivos GLB no funcionan con `file://`):

```bash
# Opción 1: Python
python -m http.server 8080

# Opción 2: Node.js
npx serve .

# Opción 3: VS Code → extensión "Live Server"
```

Luego abre: `http://localhost:8080`

## 🤝 Colaboración

Este proyecto usa **Git LFS** para manejar archivos grandes (GLB, audio, imágenes).

Para que tu compañera pueda trabajar:
```bash
git lfs install
git clone https://github.com/alejandracollantes09/JUEGOPOTAFOLIO.git
```

## 📄 Licencia del modelo 3D

El modelo 3D del hospital está bajo licencia **Creative Commons Attribution (CC BY 4.0)**.  
Crédito: *Veterock (@windofglass)* — The Evil Within, Unreal Engine assets.
