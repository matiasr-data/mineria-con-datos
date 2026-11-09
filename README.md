# Sitio web: Minería con Datos

Sitio estático (HTML, CSS y JavaScript, sin dependencias ni instalación). Se puede publicar gratis en GitHub Pages o Netlify.

## Archivos

- `index.html`: la página, con estas secciones: inicio, panel de Veladero, casos de uso, proyectos, para empresas y proveedores, y registro de correcciones.
- `estilos.css`: colores, tipografía y diseño. Versión clara de la marca de los carruseles (lavanda cuadriculado, violeta y oro); `.clave` es la palabra clave de cada título (violeta con subrayado fino dorado) y `.subra` el subrayado dorado a mano del texto.
- `app.js`: dibuja los gráficos y las cifras del panel a partir de `datos/veladero.js`.
- `datos/veladero.js` y `datos/veladero_trimestral_barrick.csv`: **se generan solos, no editarlos a mano.**
- `img/vibracion_camiones.webp` y `.png`: gráfico del ejemplo de mantenimiento predictivo (datos simulados). El navegador usa el WebP, que pesa menos de la mitad.
- `guias/*.pdf`: las guías descargables. **Se copian solas desde `recursos/`** al correr el script.
- `404.html`: la página que aparece si alguien entra a una dirección que no existe.
- `robots.txt` y `sitemap.xml`: para buscadores.
- `img/compartir.png`: imagen que aparece cuando se comparte el enlace en LinkedIn o WhatsApp. Se genera con `herramientas/imagen_compartir.html` (el comando está en ese archivo).

## Actualizar el panel cuando Barrick publica un trimestre

1. Agregar la fila nueva en `datos/data/veladero_trimestral_barrick.csv` (desde la carpeta del proyecto).
2. Correr:

   ```
   python herramientas/actualizar_web.py
   ```

   El script revisa el CSV (columnas, números, orden de los trimestres, que la parte de Barrick sea la mitad de la mina completa) y regenera los datos del sitio. Si en la columna `fuente` aparece "contrastar", "confirmar" o "verificar", el trimestre se muestra con línea punteada como pendiente.
3. Revisar en `index.html` la nota "Cómo leerlo" y, si cambió algo, sumar una línea al registro de correcciones.
4. Cuando cambie la guía anual o la fecha del próximo informe, actualizar `GUIA` y `PROXIMO` al principio de `app.js`.
5. Si editaste una guía de `recursos/`, regenerá su PDF antes de correr el script (el script avisa si el markdown es más nuevo que el PDF).

## Detalles útiles

- El gráfico de producción se puede compartir ya filtrado: `?base=barrick` abre la vista de la parte de Barrick (50%).
- Portada de noche: la palabra grande rota entre "Oro", "Dólares", "Empleo" y "Proyectos" y marca la columna de la franja de cifras que le corresponde. La cifra de oro sale sola del CSV; las otras tres (exportaciones 2025, puestos de junio de 2026 y proyectos del SIACAM) están escritas en `index.html` y se actualizan a mano cuando salga un dato nuevo. La sierra del fondo se dibuja con código; para usar una foto propia, ver "Portada de noche" en `estilos.css`.
- Las curvas de nivel de la portada se dibujan al cargar solo si la persona no pidió movimiento reducido en su sistema. Lo mismo con la animación de las barras.
- Movimiento del panel (en `app.js`, sección "Movimiento"): cada gráfico se arma una vez cuando se ve el 35%, en orden cronológico, y después queda en bucle (ola en las barras, pulso en las líneas, reflejo en la guía, veta que fluye en la portada). No hay botón de pausa (se sacó a pedido el 9/11/2026). Fuera de pantalla o con la pestaña en segundo plano, el bucle se frena solo. Con movimiento reducido, todo queda quieto.
- Los datos estructurados (schema.org `WebSite` y `Dataset`) están en el `<head>` de `index.html`. El de `Dataset` permite que la tabla de Veladero aparezca en Google Dataset Search; actualizar `temporalCoverage` cuando se sumen trimestres.

## Vitrina de reels

- La lista está en `comunidad/publicaciones.csv` (fuera de esta carpeta). Una fila por reel: archivo de video, segundo de la miniatura (`portada_seg`), estado (`publicado`, `proximo` u `oculto`), fecha, título, gancho, tema, palabra clave y link de Instagram.
- Cuando subas un reel: cambiá su estado a `publicado`, poné la fecha (AAAA-MM-DD) y pegá el link del posteo en `url`. Sin link, el botón lleva al perfil. Los próximos no llevan link: para seguir la cuenta está el botón de abajo de la vitrina.
- `python herramientas/actualizar_web.py` recorta solo el avance (6 s, sin sonido, 540 px) y la miniatura de cada reel en `reels/`, y genera `datos/publicaciones.js`. Necesita ffmpeg. Solo rehace un avance si el video original cambió.
- En la página se reproduce un solo avance a la vez: el de la tarjeta bajo el mouse, o la primera que está entera a la vista. No se reproduce solo con movimiento reducido ni fuera de pantalla.

## Verlo en la computadora

Con doble clic en `index.html` ya funciona. Para verlo igual que publicado:

```
python -m http.server 8765 --directory web
```

y abrir http://localhost:8765.

## Publicado

- Dirección: https://matiasr-data.github.io/mineria-con-datos/
- Repositorio: https://github.com/matiasr-data/mineria-con-datos (esta carpeta `web/` es el repositorio).
- Para publicar un cambio, desde la carpeta `web/`:

  ```
  git add -A
  git commit -m "Qué cambió"
  git push
  ```

  GitHub Pages lo actualiza en uno o dos minutos.
- `actualizar_web.py` sella las versiones: agrega `?v=<huella>` a `estilos.css`, `app.js` y `datos/veladero.js` en `index.html` y `404.html`. Así el navegador no mezcla una página nueva con un estilo viejo. Correrlo siempre antes de publicar.
- Si más adelante se usa un dominio propio, cambiar la dirección en `index.html` (canonical, og:url y og:image), `robots.txt` y `sitemap.xml`.

## Pendiente

- Decidir si se usa dominio propio.
- Instagram ya está (@mineriacondatos, en la sección Contacto y en el pie). Agregar TikTok y LinkedIn cuando estén los usuarios definitivos.
- El correo de contacto que figura es `matiasrico21ps@gmail.com`; cambiarlo si preferís uno exclusivo para el proyecto.
- Confirmar a mano los números del T3 2025 contra el PDF de Barrick.
- Cargar el T3 2026 cuando Barrick lo publique (9 de noviembre de 2026).
