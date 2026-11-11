# Sitio web: Minería con Datos

Sitio estático (HTML, CSS y JavaScript, sin dependencias ni instalación). Se puede publicar gratis en GitHub Pages o Netlify.

## Archivos

- `index.html`: la página, con estas secciones: inicio, panel de Veladero, casos de uso, proyectos, reels y carruseles, para empresas y proveedores, y contacto.
- `estilos.css`: colores, tipografía y diseño. Versión clara de la marca de los carruseles (lavanda cuadriculado, violeta y oro); `.clave` es la palabra clave de cada título (violeta con subrayado fino dorado) y `.subra` el subrayado dorado a mano del texto.
- `app.js`: dibuja los gráficos y las cifras del panel a partir de `datos/veladero.js`.
- `datos/veladero.js` y `datos/veladero_trimestral_barrick.csv`: **se generan solos, no editarlos a mano.**
- `img/vibracion_camiones.webp` y `.png`: gráfico del ejemplo de mantenimiento predictivo (datos simulados). El navegador usa el WebP, que pesa menos de la mitad.
- `guias/*.pdf`: las guías descargables. **Se copian solas desde `recursos/`** al correr el script.
- `404.html`: la página que aparece si alguien entra a una dirección que no existe.
- `privacidad.html`: política de privacidad (sin cookies ni estadísticas; GitHub Pages y Google Fonts). Si se suma un formulario o estadísticas, actualizarla.
- Preguntas frecuentes (sección `#preguntas`): las mismas cinco van en el `FAQPage` del `<head>`. Si se cambia una, cambiar las dos.
- Contacto: "Respondo en menos de 48 horas hábiles". Cambiarlo si el plazo es otro.
- Botón fijo de contacto en el celular (`#barra-movil`): aparece al salir de la portada y se esconde en Contacto.
- `robots.txt` y `sitemap.xml`: para buscadores. El `sitemap.xml` lo escribe `actualizar_web.py` con la fecha del día.
- `img/compartir.png`: imagen que aparece cuando se comparte el enlace en LinkedIn o WhatsApp. Se genera con `herramientas/imagen_compartir.html` (el comando está en ese archivo).

## Actualizar el panel cuando Barrick publica un trimestre

1. Agregar la fila nueva en `datos/data/veladero_trimestral_barrick.csv` (desde la carpeta del proyecto).
2. Correr:

   ```
   python herramientas/actualizar_web.py
   ```

   El script revisa el CSV (columnas, números, orden de los trimestres, que la parte de Barrick sea la mitad de la mina completa) y regenera los datos del sitio. Si en la columna `fuente` aparece "contrastar", "confirmar" o "verificar", el trimestre se muestra con línea punteada como pendiente.
3. Revisar en `index.html` la nota "Cómo leerlo" del panel.
4. Cuando cambie la guía anual o la fecha del próximo informe, actualizar `GUIA` y `PROXIMO` al principio de `app.js`.
5. Si editaste una guía de `recursos/`, regenerá su PDF antes de correr el script (el script avisa si el markdown es más nuevo que el PDF).

## Detalles útiles

- El gráfico de producción se puede compartir ya filtrado: `?base=barrick` abre la vista de la parte de Barrick (50%).
- Portada de noche: la palabra grande rota entre "Oro", "Dólares", "Empleo" y "Proyectos" y marca la columna de la franja de cifras que le corresponde. La cifra de oro sale sola del CSV; las otras tres (exportaciones 2025, puestos de junio de 2026 y proyectos del SIACAM) están escritas en `index.html` y se actualizan a mano cuando salga un dato nuevo. La sierra del fondo se dibuja con código; para usar una foto propia, ver "Portada de noche" en `estilos.css`.
- Mapa de la portada: los proyectos metalíferos de San Juan del SIACAM sobre un plano inclinado, en su latitud y longitud reales. Recorre los 9 más avanzados cada 3,8 s y cada punto muestra su ficha al pasar el mouse. Los datos los genera `actualizar_web.py` en `datos/proyectos.js` desde `datos/data/cartera_proyectos_metaliferos_san_juan_siacam.csv`. Vicuña figura "en desarrollo" (el SIACAM dice "construcción", sin decisión final de inversión). La lista de destacados está en `app.js` (DESTACADOS).
- Las curvas de nivel de la portada se dibujan al cargar solo si la persona no pidió movimiento reducido en su sistema. Lo mismo con la animación de las barras.
- Movimiento del panel (en `app.js`, sección "Movimiento"): cada gráfico se arma una vez cuando se ve el 35%, en orden cronológico, y después queda en bucle (ola en las barras, pulso en las líneas, reflejo en la guía, veta que fluye en la portada). No hay botón de pausa (se sacó a pedido el 9/11/2026). Fuera de pantalla o con la pestaña en segundo plano, el bucle se frena solo. Con movimiento reducido, todo queda quieto.
- Los datos estructurados (schema.org `WebSite` y `Dataset`) están en el `<head>` de `index.html`. El de `Dataset` permite que la tabla de Veladero aparezca en Google Dataset Search; actualizar `temporalCoverage` cuando se sumen trimestres.

## Publicaciones (óvalo 3D)

- La sección "Vista previa de nuestro Instagram" muestra todas las publicaciones girando en un óvalo. La de adelante reproduce su avance sin sonido y abajo aparece su ficha (tipo, estado, tema, gancho, palabra clave y link).
- La lista está en `comunidad/publicaciones.csv` (fuera de esta carpeta). Una fila por publicación: `tipo` (`reel` o `carrusel`), archivo de video (para los carruseles, el `01.mp4`), segundo de la miniatura (`portada_seg`; en los carruseles, 0), estado (`publicado`, `proximo` u `oculto`), fecha, título, gancho, tema, palabra clave y link de Instagram. El orden del archivo es el orden del óvalo.
- Cuando subas algo: cambiá su estado a `publicado`, poné la fecha (AAAA-MM-DD) y pegá el link del posteo en `url`. Sin link, la ficha lleva al perfil.
- `python herramientas/actualizar_web.py` recorta solo el avance (6 s, sin sonido, 540 px) y la miniatura de cada una en `reels/`, y genera `datos/publicaciones.js`. Necesita ffmpeg. Solo rehace un avance si el video original cambió.
- El óvalo gira solo (una vuelta cada 70 s) y se frena con el mouse encima, al arrastrar, con foco adentro, fuera de pantalla y con movimiento reducido. Se gira arrastrando, con las flechas o tocando una tarjeta.

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
