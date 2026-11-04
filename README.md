# Sitio web: Minería con Datos

Sitio estático (HTML, CSS y JavaScript, sin dependencias ni instalación). Se puede publicar gratis en GitHub Pages o Netlify.

## Archivos

- `index.html`: la página, con estas secciones: inicio, panel de Veladero, casos de uso, proyectos, para empresas y proveedores, y registro de correcciones.
- `estilos.css`: colores, tipografía y diseño, con modo claro y oscuro automático.
- `app.js`: dibuja los gráficos y las cifras del panel a partir de `datos/veladero.js`.
- `datos/veladero.js` y `datos/veladero_trimestral_barrick.csv`: **se generan solos, no editarlos a mano.**
- `img/vibracion_camiones.png`: gráfico del ejemplo de mantenimiento predictivo (datos simulados).
- `img/compartir.png`: imagen que aparece cuando se comparte el enlace en LinkedIn o WhatsApp.

## Actualizar el panel cuando Barrick publica un trimestre

1. Agregar la fila nueva en `datos/data/veladero_trimestral_barrick.csv` (desde la carpeta del proyecto).
2. Correr:

   ```
   python herramientas/actualizar_web.py
   ```

   El script revisa el CSV (columnas, números, orden de los trimestres, que la parte de Barrick sea la mitad de la mina completa) y regenera los datos del sitio. Si en la columna `fuente` aparece "contrastar", "confirmar" o "verificar", el trimestre se muestra con línea punteada como pendiente.
3. Revisar en `index.html` la nota "Cómo leerlo" y, si cambió algo, sumar una línea al registro de correcciones.
4. Cuando cambie la guía anual o la fecha del próximo informe, actualizar `GUIA` y `PROXIMO` al principio de `app.js`.

## Verlo en la computadora

Con doble clic en `index.html` ya funciona. Para verlo igual que publicado:

```
python -m http.server 8765 --directory web
```

y abrir http://localhost:8765.

## Publicarlo

Opción simple, **Netlify Drop**: entrar a app.netlify.com/drop y arrastrar la carpeta `web`. Da un enlace público al instante.

Opción con historial, **GitHub Pages**: subir el proyecto a un repositorio, ir a Settings > Pages y elegir la carpeta `/web` (o subir solo el contenido de `web`).

Cuando el sitio tenga dirección definitiva:

- En `index.html`, cambiar `img/compartir.png` en las etiquetas `og:image` por la dirección completa (por ejemplo `https://tu-dominio/img/compartir.png`) y agregar `<link rel="canonical" href="https://tu-dominio/">`.
- Sumar un `sitemap.xml` y un `robots.txt` con esa dirección.

## Pendiente

- Decidir dónde se publica y si se usa dominio propio.
- Agregar los enlaces a Instagram, TikTok y LinkedIn cuando estén los usuarios definitivos.
- El correo de contacto que figura es `matiasrico21ps@gmail.com`; cambiarlo si preferís uno exclusivo para el proyecto.
- Confirmar a mano los números del T3 2025 contra el PDF de Barrick.
- Cargar el T3 2026 cuando Barrick lo publique (9 de noviembre de 2026).
