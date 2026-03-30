const API_BASE = "http://127.0.0.1:8000/api";
const API_ORIGIN = new URL(API_BASE).origin;
const token = localStorage.getItem("token");

const inputBuscar = document.getElementById("buscarProductoVenta");
const selectCategoria = document.getElementById("filtroCategoriaVenta");
const contenedorGrid = document.getElementById("productosGridVenta");
const estadoProductos = document.getElementById("estadoProductosVenta");
const badgeCarrito = document.getElementById("badgeCarrito");
const carritoVacio = document.getElementById("carritoVacio");
const carritoItems = document.getElementById("carritoItems");
const subtotalVenta = document.getElementById("subtotalVenta");
const ivaVenta = document.getElementById("ivaVenta");
const totalVenta = document.getElementById("totalVenta");
const metodoPagoVenta = document.getElementById("metodoPagoVenta");
const btnConfirmarVenta = document.getElementById("btnConfirmarVenta");
const btnCancelarVenta = document.getElementById("btnCancelarVenta");
const topbarUsuarioNombre = document.getElementById("topbarUsuarioNombre");
const topbarUsuarioRol = document.getElementById("topbarUsuarioRol");
const detalleVentasBody = document.getElementById("detalleVentasBody");
const estadoDetalleVentas = document.getElementById("estadoDetalleVentas");
const btnRecargarDetalleVentas = document.getElementById("btnRecargarDetalleVentas");
const modalDetalleVenta = document.getElementById("modalDetalleVenta");
const btnCerrarModalDetalleVenta = document.getElementById("btnCerrarModalDetalleVenta");
const detalleVentaTitulo = document.getElementById("detalleVentaTitulo");
const detalleVentaMeta = document.getElementById("detalleVentaMeta");
const detalleVentaBody = document.getElementById("detalleVentaBody");
const detalleVentaTotal = document.getElementById("detalleVentaTotal");
const modalFacturacion = document.getElementById("modalFacturacion");
const modalFacturacionTitulo = document.getElementById("modalFacturacionTitulo");
const modalFacturacionSubtitulo = document.getElementById("modalFacturacionSubtitulo");
const btnCerrarModalFacturacion = document.getElementById("btnCerrarModalFacturacion");
const btnCancelarModalFacturacion = document.getElementById("btnCancelarModalFacturacion");
const formFacturacion = document.getElementById("formFacturacion");
const factIdVenta = document.getElementById("factIdVenta");
const factNombreCliente = document.getElementById("factNombreCliente");
const factCorreo = document.getElementById("factCorreo");
const factTelefono = document.getElementById("factTelefono");
const factRfc = document.getElementById("factRfc");
const factRazonSocial = document.getElementById("factRazonSocial");
const factUsoCfdi = document.getElementById("factUsoCfdi");
const factEmisorNombre = document.getElementById("factEmisorNombre");
const factEmisorRfc = document.getElementById("factEmisorRfc");
const factEmisorCp = document.getElementById("factEmisorCp");
const factRegimenFiscal = document.getElementById("factRegimenFiscal");
const factFormaPago = document.getElementById("factFormaPago");
const factMetodoPagoCfdi = document.getElementById("factMetodoPagoCfdi");
const factMoneda = document.getElementById("factMoneda");
const factLugarExpedicion = document.getElementById("factLugarExpedicion");
const factClaveProducto = document.getElementById("factClaveProducto");
const factClaveUnidad = document.getElementById("factClaveUnidad");
const btnGuardarFacturacion = document.getElementById("btnGuardarFacturacion");
const mensajeFacturacion = document.getElementById("mensajeFacturacion");

let productos = [];
let carrito = {};
let ultimaVentaRegistradaId = null;
let ultimaFacturaGenerada = null;

const IVA_TASA = 0.16;

if (!token) {
    window.location.href = "login.html";
}

function getHeaders() {
    return {
        "Accept": "application/json",
        "Authorization": `Bearer ${token}`,
    };
}

async function cargarUsuarioSesion() {
    try {
        const response = await fetch(`${API_BASE}/me`, {
            method: "GET",
            headers: getHeaders(),
        });

        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem("token");
                window.location.href = "login.html";
                return;
            }

            throw new Error("No se pudo obtener la sesion");
        }

        const usuario = await response.json();

        if (topbarUsuarioNombre) {
            topbarUsuarioNombre.textContent = usuario.nombre || "Usuario";
        }

        if (topbarUsuarioRol) {
            topbarUsuarioRol.textContent = "Administrador";
        }
    } catch (error) {
        console.error(error);

        if (topbarUsuarioNombre) {
            topbarUsuarioNombre.textContent = "Sin sesion";
        }

        if (topbarUsuarioRol) {
            topbarUsuarioRol.textContent = "Administrador";
        }
    }
}

function escapeHtml(value) {
    if (value === null || value === undefined) return "";

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function resolverImagen(producto) {
    if (producto.imagen) {
        const limpia = String(producto.imagen).replace(/^\/+/, "");
        return `${API_ORIGIN}/storage/${limpia}`;
    }

    if (producto.imagen_url) {
        const imagenUrl = String(producto.imagen_url);

        if (imagenUrl.startsWith("http://") || imagenUrl.startsWith("https://")) {
            const marcadorStorage = "/storage/";
            const indiceStorage = imagenUrl.indexOf(marcadorStorage);

            if (indiceStorage !== -1) {
                const rutaStorage = imagenUrl.substring(indiceStorage);
                return `${API_ORIGIN}${rutaStorage}`;
            }

            return imagenUrl;
        }

        return `${API_ORIGIN}${imagenUrl.startsWith("/") ? "" : "/"}${imagenUrl}`;
    }

    return "https://via.placeholder.com/320x190?text=Sin+Imagen";
}

function llenarCategorias(lista) {
    const mapa = new Map();

    lista.forEach((producto) => {
        if (producto.categoria && producto.categoria.id_categoria) {
            mapa.set(String(producto.categoria.id_categoria), producto.categoria.nombre || "Sin categoria");
        }
    });

    const opciones = ['<option value="">Todas las Categorias</option>'];

    Array.from(mapa.entries())
        .sort((a, b) => String(a[1]).localeCompare(String(b[1]), "es"))
        .forEach(([idCategoria, nombre]) => {
            opciones.push(`<option value="${escapeHtml(idCategoria)}">${escapeHtml(nombre)}</option>`);
        });

    selectCategoria.innerHTML = opciones.join("");
}

function getProductosFiltrados() {
    const texto = inputBuscar.value.trim().toLowerCase();
    const categoria = selectCategoria.value;

    return productos.filter((producto) => {
        const stock = Number(producto.stock || 0);
        const coincideStock = stock > 0;

        const nombre = String(producto.nombre || "").toLowerCase();
        const codigo = String(producto.codigo || "").toLowerCase();
        const coincideTexto = !texto || nombre.includes(texto) || codigo.includes(texto);

        const idCategoria = String(producto.id_categoria || "");
        const coincideCategoria = !categoria || idCategoria === categoria;

        return coincideStock && coincideTexto && coincideCategoria;
    });
}

function formatearMoneda(valor) {
    return `$${Number(valor || 0).toFixed(2)}`;
}

function formatearFecha(fechaIso) {
    if (!fechaIso) return "-";

    const fecha = new Date(fechaIso);
    if (Number.isNaN(fecha.getTime())) return String(fechaIso);

    return fecha.toLocaleString("es-MX", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function actualizarEstadoBotonFacturar() {
    // Sin boton de facturacion en carrito; se conserva el estado interno de venta.
}

function actualizarEstadoBotonPdf() {
    // El PDF se descarga automaticamente tras facturar.
}

async function abrirModalDetalleVenta(idVenta) {
    const id = Number(idVenta || 0);
    if (!id) {
        alert("ID de venta invalido.");
        return;
    }

    if (detalleVentaTitulo) {
        detalleVentaTitulo.innerHTML = `<i class="fa-solid fa-receipt"></i> Detalle de venta #${escapeHtml(id)}`;
    }

    if (detalleVentaMeta) {
        detalleVentaMeta.textContent = "Cargando detalle completo...";
    }

    if (detalleVentaBody) {
        detalleVentaBody.innerHTML = "";
    }

    if (detalleVentaTotal) {
        detalleVentaTotal.textContent = "";
    }

    modalDetalleVenta?.classList.add("active");

    try {
        const response = await fetch(`${API_BASE}/ventas/${id}/detalle`, {
            method: "GET",
            headers: getHeaders(),
        });

        if (response.status === 401) {
            localStorage.removeItem("token");
            window.location.href = "login.html";
            return;
        }

        let data = null;
        try {
            data = await response.json();
        } catch {
            data = null;
        }

        if (!response.ok) {
            throw new Error(data?.message || "No se pudo cargar el detalle de la venta.");
        }

        if (detalleVentaMeta) {
            detalleVentaMeta.textContent = `${formatearFecha(data?.fecha)} | Cliente: ${data?.cliente || "Publico General"} | Metodo: ${data?.metodo_pago || "-"}`;
        }

        const items = Array.isArray(data?.items) ? data.items : [];

        if (detalleVentaBody) {
            detalleVentaBody.innerHTML = items.map((item) => `
                <tr>
                    <td>${escapeHtml(item.producto || "-")}</td>
                    <td>${escapeHtml(item.cantidad || 0)}</td>
                    <td>${escapeHtml(formatearMoneda(item.precio_unitario || 0))}</td>
                    <td>${escapeHtml(formatearMoneda(item.subtotal || 0))}</td>
                </tr>
            `).join("");
        }

        if (detalleVentaTotal) {
            detalleVentaTotal.textContent = `Total: ${formatearMoneda(data?.total || 0)}`;
        }
    } catch (error) {
        console.error(error);

        if (detalleVentaMeta) {
            detalleVentaMeta.textContent = "No se pudo cargar el detalle completo de la venta.";
        }
    }
}

function cerrarModalDetalleVenta() {
    modalDetalleVenta?.classList.remove("active");
}

function abrirModalFacturacion(idVentaForzada = null, desdeVentaExitosa = false) {
    if (!modalFacturacion) return;

    const idVenta = Number(idVentaForzada || ultimaVentaRegistradaId || 0);
    if (idVenta <= 0) {
        alert("Aun no hay ventas registradas para facturar.");
        return;
    }

    factIdVenta.value = String(idVenta);
    factNombreCliente.value = "Publico General";
    factCorreo.value = "";
    factTelefono.value = "";
    factRfc.value = "XAXX010101000";
    factRazonSocial.value = "Publico General";
    factUsoCfdi.value = "G03";
    factEmisorNombre.value = "VentaTotal SA de CV";
    factEmisorRfc.value = "AAA010101AAA";
    factEmisorCp.value = "64000";
    factRegimenFiscal.value = "601 General de Ley Personas Morales";
    factFormaPago.value = "01 Efectivo";
    factMetodoPagoCfdi.value = "PUE Pago en una sola exhibicion";
    factMoneda.value = "MXN";
    factLugarExpedicion.value = "Monterrey, Nuevo Leon";
    factClaveProducto.value = "01010101";
    factClaveUnidad.value = "H87";
    mensajeFacturacion.textContent = "";

    if (modalFacturacionTitulo) {
        modalFacturacionTitulo.innerHTML = desdeVentaExitosa
            ? '<i class="fa-solid fa-circle-check"></i> Venta exitosa'
            : '<i class="fa-solid fa-file-invoice"></i> Generar Facturacion';
    }

    if (modalFacturacionSubtitulo) {
        modalFacturacionSubtitulo.textContent = desdeVentaExitosa
            ? "Deseas generar la factura de esta venta? Completa los datos para continuar."
            : "Completa los datos para generar la factura.";
    }

    modalFacturacion.classList.add("active");
}

function cerrarModalFacturacion() {
    if (!modalFacturacion) return;
    modalFacturacion.classList.remove("active");
}

async function guardarFacturacionDesdeModal(event) {
    event.preventDefault();

    const ventaObjetivo = Number(factIdVenta.value || 0);
    const payload = {
        nombre_cliente: String(factNombreCliente.value || "").trim(),
        correo: String(factCorreo.value || "").trim() || null,
        telefono: String(factTelefono.value || "").trim() || null,
        rfc: String(factRfc.value || "").trim().toUpperCase(),
        razon_social: String(factRazonSocial.value || "").trim(),
        uso_cfdi: String(factUsoCfdi.value || "").trim().toUpperCase(),
        emisor_nombre: String(factEmisorNombre.value || "").trim(),
        emisor_rfc: String(factEmisorRfc.value || "").trim().toUpperCase(),
        emisor_codigo_postal: String(factEmisorCp.value || "").trim(),
        emisor_regimen_fiscal: String(factRegimenFiscal.value || "").trim(),
        forma_pago: String(factFormaPago.value || "").trim(),
        metodo_pago_cfdi: String(factMetodoPagoCfdi.value || "").trim(),
        moneda: String(factMoneda.value || "").trim().toUpperCase(),
        lugar_expedicion: String(factLugarExpedicion.value || "").trim(),
        clave_producto: String(factClaveProducto.value || "").trim().toUpperCase(),
        clave_unidad: String(factClaveUnidad.value || "").trim().toUpperCase(),
    };

    if (!ventaObjetivo) {
        mensajeFacturacion.textContent = "Ingresa un ID de venta valido.";
        return;
    }

    if (
        !payload.nombre_cliente
        || !payload.rfc
        || !payload.razon_social
        || !payload.uso_cfdi
        || !payload.emisor_nombre
        || !payload.emisor_rfc
        || !payload.emisor_codigo_postal
        || !payload.emisor_regimen_fiscal
        || !payload.forma_pago
        || !payload.metodo_pago_cfdi
        || !payload.moneda
        || !payload.lugar_expedicion
        || !payload.clave_producto
        || !payload.clave_unidad
    ) {
        mensajeFacturacion.textContent = "Completa los campos obligatorios para facturar.";
        return;
    }

    btnGuardarFacturacion.disabled = true;
    mensajeFacturacion.textContent = "Generando facturacion...";

    try {
        const response = await fetch(`${API_BASE}/ventas/${ventaObjetivo}/facturar`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...getHeaders(),
            },
            body: JSON.stringify(payload),
        });

        if (response.status === 401) {
            localStorage.removeItem("token");
            window.location.href = "login.html";
            return;
        }

        let data = null;
        try {
            data = await response.json();
        } catch {
            data = null;
        }

        if (!response.ok) {
            mensajeFacturacion.textContent = data?.message || "No se pudo generar la facturacion.";
            return;
        }

        ultimaVentaRegistradaId = Number(data?.id_venta || ventaObjetivo);
        ultimaFacturaGenerada = data;
        actualizarEstadoBotonPdf();
        alert(`Facturacion generada. Folio: ${data?.folio || "N/A"}`);
        cerrarModalFacturacion();
        descargarFacturaPdf();
        await cargarDetalleVentas();
    } catch (error) {
        console.error(error);
        mensajeFacturacion.textContent = "Error de conexion al generar la facturacion.";
    } finally {
        btnGuardarFacturacion.disabled = false;
        actualizarEstadoBotonFacturar();
    }
}

function descargarFacturaPdf() {
    if (!ultimaFacturaGenerada) {
        alert("Primero debes generar una facturacion.");
        return;
    }

    const jsPdfGlobal = window.jspdf;
    if (!jsPdfGlobal || !jsPdfGlobal.jsPDF) {
        alert("No se pudo inicializar la libreria PDF.");
        return;
    }

    const { jsPDF } = jsPdfGlobal;
    const doc = new jsPDF();
    const factura = ultimaFacturaGenerada;
    const detalle = Array.isArray(factura.detalle) ? factura.detalle : [];

    const subtotal = detalle.reduce((sum, item) => sum + Number(item?.subtotal || 0), 0);
    const total = Number(factura?.total || 0);
    const iva = total - subtotal;

    let y = 16;

    doc.setFontSize(18);
    doc.text("Factura", 14, y);
    y += 8;

    doc.setFontSize(11);
    doc.text(`Folio: ${factura?.folio || "N/A"}`, 14, y);
    y += 6;
    doc.text(`Fecha: ${formatearFecha(factura?.fecha)}`, 14, y);
    y += 6;
    doc.text(`Venta: #${factura?.id_venta || "-"}`, 14, y);
    y += 8;

    doc.setFontSize(12);
    doc.text("Emisor", 14, y);
    y += 6;
    doc.setFontSize(10);
    doc.text(`Nombre: ${factura?.emisor?.nombre || "-"}`, 14, y);
    y += 5;
    doc.text(`RFC: ${factura?.emisor?.rfc || "-"}`, 14, y);
    y += 5;
    doc.text(`C.P.: ${factura?.emisor?.codigo_postal || "-"}`, 14, y);
    y += 5;
    doc.text(`Regimen fiscal: ${factura?.emisor?.regimen_fiscal || "-"}`, 14, y);
    y += 7;

    doc.setFontSize(12);
    doc.text("Comprobante", 14, y);
    y += 6;
    doc.setFontSize(10);
    doc.text(`Forma de pago: ${factura?.comprobante?.forma_pago || "-"}`, 14, y);
    y += 5;
    doc.text(`Metodo de pago: ${factura?.comprobante?.metodo_pago || "-"}`, 14, y);
    y += 5;
    doc.text(`Moneda: ${factura?.comprobante?.moneda || "MXN"}`, 14, y);
    y += 5;
    doc.text(`Lugar de expedicion: ${factura?.comprobante?.lugar_expedicion || "-"}`, 14, y);
    y += 7;

    doc.setFontSize(12);
    doc.text("Cliente", 14, y);
    y += 6;
    doc.setFontSize(10);
    doc.text(`Nombre: ${factura?.cliente?.nombre || "-"}`, 14, y);
    y += 5;
    doc.text(`Correo: ${factura?.cliente?.correo || "-"}`, 14, y);
    y += 5;
    doc.text(`Telefono: ${factura?.cliente?.telefono || "-"}`, 14, y);
    y += 7;

    doc.setFontSize(12);
    doc.text("Datos fiscales", 14, y);
    y += 6;
    doc.setFontSize(10);
    doc.text(`RFC: ${factura?.datos_fiscales?.rfc || "-"}`, 14, y);
    y += 5;
    doc.text(`Razon social: ${factura?.datos_fiscales?.razon_social || "-"}`, 14, y);
    y += 5;
    doc.text(`Uso CFDI: ${factura?.datos_fiscales?.uso_cfdi || "-"}`, 14, y);
    y += 8;

    doc.setFontSize(11);
    doc.text("Detalle", 14, y);
    y += 6;
    doc.setFontSize(8);

    const colProductoX = 14;
    const colClaveProdX = 92;
    const colClaveUndX = 118;
    const colCantX = 143;
    const colPUnitX = 165;
    const colSubtotalX = 196;

    doc.text("Producto", colProductoX, y);
    doc.text("Clave Prod", colClaveProdX, y);
    doc.text("Clave Und", colClaveUndX, y);
    doc.text("Cant", colCantX, y);
    doc.text("P.Unit", colPUnitX, y, { align: "right" });
    doc.text("Subtotal", colSubtotalX, y, { align: "right" });
    y += 4;
    doc.line(14, y, 196, y);
    y += 5;

    detalle.forEach((item) => {
        if (y > 275) {
            doc.addPage();
            y = 16;
        }

        const nombre = String(item?.producto || "Producto").slice(0, 28);
        doc.text(nombre, colProductoX, y);
        doc.text(String(item?.clave_producto || "-").slice(0, 10), colClaveProdX, y);
        doc.text(String(item?.clave_unidad || "-").slice(0, 8), colClaveUndX, y);
        doc.text(String(item?.cantidad || 0), colCantX, y);
        doc.text(formatearMoneda(item?.precio_unitario || 0), colPUnitX, y, { align: "right" });
        doc.text(formatearMoneda(item?.subtotal || 0), colSubtotalX, y, { align: "right" });
        y += 6;
    });

    y += 4;
    doc.line(120, y, 196, y);
    y += 7;
    doc.setFontSize(10);
    doc.text(`Subtotal: ${formatearMoneda(subtotal)}`, 196, y, { align: "right" });
    y += 6;
    doc.text(`IVA (16%): ${formatearMoneda(iva)}`, 196, y, { align: "right" });
    y += 6;
    doc.setFontSize(12);
    doc.text(`Total: ${formatearMoneda(total)}`, 196, y, { align: "right" });

    const nombreArchivo = `${factura?.folio || `FAC-${factura?.id_venta || "venta"}`}.pdf`;
    doc.save(nombreArchivo);
}

function getProductoById(idProducto) {
    return productos.find((item) => Number(item.id_producto) === Number(idProducto)) || null;
}

function getCantidadEnCarrito(idProducto) {
    return Number(carrito[String(idProducto)] || 0);
}

function agregarProductoAlCarrito(idProducto) {
    const producto = getProductoById(idProducto);
    if (!producto) return;

    const stock = Number(producto.stock || 0);
    const cantidadActual = getCantidadEnCarrito(idProducto);

    if (cantidadActual >= stock) {
        alert("No puedes agregar mas unidades que el stock disponible.");
        return;
    }

    carrito = {
        ...carrito,
        [String(idProducto)]: cantidadActual + 1,
    };

    renderCarrito();
    renderProductos();
}

function quitarProductoDelCarrito(idProducto) {
    const key = String(idProducto);
    if (!carrito[key]) return;

    const next = { ...carrito };
    delete next[key];
    carrito = next;

    renderCarrito();
    renderProductos();
}

function actualizarCantidadCarrito(idProducto, cantidadTexto) {
    const producto = getProductoById(idProducto);
    if (!producto) return;

    const stock = Number(producto.stock || 0);
    const cantidad = Number(cantidadTexto || 0);

    if (!Number.isFinite(cantidad) || cantidad <= 0) {
        quitarProductoDelCarrito(idProducto);
        return;
    }

    const cantidadNormalizada = Math.min(Math.floor(cantidad), stock);

    carrito = {
        ...carrito,
        [String(idProducto)]: cantidadNormalizada,
    };

    renderCarrito();
    renderProductos();
}

function calcularTotalesCarrito() {
    const items = Object.entries(carrito)
        .map(([idProducto, cantidad]) => {
            const producto = getProductoById(idProducto);
            if (!producto) return null;

            const precio = Number(producto.precio || 0);
            const cantidadNum = Number(cantidad || 0);
            const subtotalItem = cantidadNum * precio;

            return {
                id_producto: Number(idProducto),
                nombre: producto.nombre || "Producto",
                stock: Number(producto.stock || 0),
                precio,
                cantidad: cantidadNum,
                subtotal: subtotalItem,
            };
        })
        .filter(Boolean);

    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const iva = subtotal * IVA_TASA;
    const total = subtotal + iva;

    return { items, subtotal, iva, total };
}

async function descargarFacturaExistente(idVenta) {
    const id = Number(idVenta || 0);
    if (!id) {
        alert("ID de venta invalido para descargar factura.");
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/ventas/${id}/factura`, {
            method: "GET",
            headers: getHeaders(),
        });

        if (response.status === 401) {
            localStorage.removeItem("token");
            window.location.href = "login.html";
            return;
        }

        let data = null;
        try {
            data = await response.json();
        } catch {
            data = null;
        }

        if (!response.ok) {
            alert(data?.message || "No se pudo recuperar la factura de esta venta.");
            return;
        }

        ultimaFacturaGenerada = data;
        descargarFacturaPdf();
    } catch (error) {
        console.error(error);
        alert("Error de conexion al descargar la factura.");
    }
}

async function cargarDetalleVentas() {
    if (!estadoDetalleVentas || !detalleVentasBody) return;

    estadoDetalleVentas.textContent = "Cargando detalle de ventas...";
    estadoDetalleVentas.style.display = "block";
    detalleVentasBody.innerHTML = "";

    try {
        const response = await fetch(`${API_BASE}/ventas`, {
            method: "GET",
            headers: getHeaders(),
        });

        if (response.status === 401) {
            localStorage.removeItem("token");
            window.location.href = "login.html";
            return;
        }

        if (!response.ok) {
            throw new Error("No se pudo cargar detalle de ventas");
        }

        const data = await response.json();
        const lista = Array.isArray(data) ? data : [];

        const maxVentaId = lista.reduce((maxId, item) => {
            const idVenta = Number(item?.id_venta || 0);
            return idVenta > maxId ? idVenta : maxId;
        }, 0);

        if (maxVentaId > 0) {
            ultimaVentaRegistradaId = maxVentaId;
        }

        actualizarEstadoBotonFacturar();

        if (!lista.length) {
            estadoDetalleVentas.textContent = "No hay ventas registradas todavía.";
            estadoDetalleVentas.style.display = "block";
            return;
        }

        estadoDetalleVentas.style.display = "none";

        const ventasAgrupadas = new Map();

        lista.forEach((item) => {
            const idVenta = Number(item?.id_venta || 0);
            if (!idVenta) return;

            if (!ventasAgrupadas.has(idVenta)) {
                ventasAgrupadas.set(idVenta, {
                    id_venta: idVenta,
                    fecha: item?.fecha || null,
                    cliente: item?.cliente || "Publico General",
                    metodo_pago: item?.metodo_pago || "-",
                    total: Number(item?.total || 0),
                    totalArticulos: 0,
                    esta_facturada: Number(item?.esta_facturada || 0) === 1 || Number(item?.id_dato_fiscal || 0) > 0,
                });
            }

            const venta = ventasAgrupadas.get(idVenta);
            venta.totalArticulos += Number(item?.cantidad || 0);
            venta.esta_facturada = venta.esta_facturada
                || Number(item?.esta_facturada || 0) === 1
                || Number(item?.id_dato_fiscal || 0) > 0;
        });

        const resumenVentas = Array.from(ventasAgrupadas.values())
            .sort((a, b) => Number(b.id_venta) - Number(a.id_venta));

        detalleVentasBody.innerHTML = resumenVentas.map((venta) => {
            const btnDetalle = `<button type="button" class="btn-ver-detalle-fila" data-action="ver-detalle-venta" data-id-venta="${venta.id_venta}">Ver</button>`;
            const accionFactura = venta.esta_facturada
                ? `<button type="button" class="btn-descargar-factura-fila" data-action="descargar-factura" data-id-venta="${venta.id_venta}">Descargar PDF</button>`
                : `<button type="button" class="btn-facturar-fila" data-action="facturar-detalle" data-id-venta="${venta.id_venta}">Facturar</button>`;

            return `
                <tr>
                    <td>#${escapeHtml(venta.id_venta)}</td>
                    <td>${escapeHtml(formatearFecha(venta.fecha))}</td>
                    <td>${escapeHtml(venta.cliente || "Publico General")}</td>
                    <td>${escapeHtml(venta.totalArticulos || 0)}</td>
                    <td>${escapeHtml(formatearMoneda(venta.total || 0))}</td>
                    <td>${escapeHtml(venta.metodo_pago || "-")}</td>
                    <td>${btnDetalle}</td>
                    <td>${accionFactura}</td>
                </tr>
            `;
        }).join("");
    } catch (error) {
        console.error(error);
        estadoDetalleVentas.textContent = "No se pudo cargar el detalle de ventas.";
        estadoDetalleVentas.style.display = "block";
    }
}

async function confirmarVenta() {
    const { items, subtotal, iva, total } = calcularTotalesCarrito();

    if (!items.length) {
        alert("Agrega al menos un producto al carrito antes de confirmar la venta.");
        return;
    }

    const payload = {
        metodo_pago: metodoPagoVenta?.value || "Efectivo",
        items: items.map((item) => ({
            id_producto: item.id_producto,
            cantidad: item.cantidad,
            precio_compra: item.precio,
        })),
    };

    btnConfirmarVenta.disabled = true;

    try {
        const response = await fetch(`${API_BASE}/ventas`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...getHeaders(),
            },
            body: JSON.stringify(payload),
        });

        if (response.status === 401) {
            localStorage.removeItem("token");
            window.location.href = "login.html";
            return;
        }

        let data = null;
        try {
            data = await response.json();
        } catch {
            data = null;
        }

        if (!response.ok) {
            const mensaje = data?.message || "No se pudo registrar la venta.";
            alert(mensaje);
            return;
        }

        ultimaVentaRegistradaId = Number(data?.id_venta || 0) || null;
        actualizarEstadoBotonFacturar();

        carrito = {};
        renderCarrito();
        await cargarProductos();
        await cargarDetalleVentas();
        abrirModalFacturacion(ultimaVentaRegistradaId, true);
    } catch (error) {
        console.error(error);
        alert("Error de conexion al registrar la venta.");
    } finally {
        btnConfirmarVenta.disabled = false;
    }
}

function renderCarrito() {
    const { items, subtotal, iva, total } = calcularTotalesCarrito();

    badgeCarrito.textContent = String(items.length);
    carritoVacio.style.display = items.length ? "none" : "block";

    if (!items.length) {
        carritoItems.innerHTML = "";
    } else {
        carritoItems.innerHTML = items.map((item) => `
            <div class="carrito-item" data-id="${item.id_producto}">
                <div class="carrito-item-info">
                    <p class="carrito-item-nombre">${escapeHtml(item.nombre)}</p>
                    <p class="carrito-item-precio">${formatearMoneda(item.precio)} c/u</p>
                </div>
                <div class="carrito-item-controles">
                    <button type="button" class="qty-btn" data-action="decrease" data-id="${item.id_producto}">-</button>
                    <input
                        type="number"
                        min="1"
                        max="${item.stock}"
                        value="${item.cantidad}"
                        class="qty-input"
                        data-action="qty"
                        data-id="${item.id_producto}"
                    >
                    <button type="button" class="qty-btn" data-action="increase" data-id="${item.id_producto}">+</button>
                    <button type="button" class="btn-eliminar-item" data-action="remove" data-id="${item.id_producto}">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
                <div class="carrito-item-subtotal">${formatearMoneda(item.subtotal)}</div>
            </div>
        `).join("");
    }

    subtotalVenta.textContent = formatearMoneda(subtotal);
    ivaVenta.textContent = formatearMoneda(iva);
    totalVenta.textContent = formatearMoneda(total);
}

function renderProductos() {
    const lista = getProductosFiltrados();

    if (!lista.length) {
        contenedorGrid.innerHTML = "";
        estadoProductos.textContent = "No hay productos de inventario para mostrar con esos filtros.";
        estadoProductos.style.display = "block";
        return;
    }

    estadoProductos.style.display = "none";

    contenedorGrid.innerHTML = lista.map((producto) => {
        const precio = Number(producto.precio || 0).toFixed(2);
        const stock = Number(producto.stock || 0);
        const categoria = producto.categoria?.nombre || "Sin categoria";
        const imagen = resolverImagen(producto);
        const cantidadEnCarrito = getCantidadEnCarrito(producto.id_producto);
        const llegoAlStock = cantidadEnCarrito >= stock;
        const textoBoton = cantidadEnCarrito > 0
            ? `Agregar (${cantidadEnCarrito})`
            : "Agregar";

        return `
            <div class="producto-card" data-id="${producto.id_producto}">
                <img src="${escapeHtml(imagen)}" alt="${escapeHtml(producto.nombre)}">
                <h4>${escapeHtml(producto.nombre || "Producto")}</h4>
                <span class="categoria">${escapeHtml(categoria)}</span>
                <div class="precio-stock">
                    <span class="precio">$${escapeHtml(precio)}</span>
                    <span class="stock">Stock: ${escapeHtml(stock)}</span>
                </div>
                <button class="btn-agregar" type="button" data-id="${producto.id_producto}" ${llegoAlStock ? "disabled" : ""}>
                    <i class="fa-solid fa-cart-plus"></i>
                    ${escapeHtml(textoBoton)}
                </button>
            </div>
        `;
    }).join("");
}

async function cargarProductos() {
    estadoProductos.textContent = "Cargando inventario...";
    estadoProductos.style.display = "block";

    try {
        const response = await fetch(`${API_BASE}/productos`, {
            method: "GET",
            headers: getHeaders(),
        });

        if (response.status === 401) {
            localStorage.removeItem("token");
            window.location.href = "login.html";
            return;
        }

        if (!response.ok) {
            throw new Error("No se pudo consultar inventario");
        }

        const data = await response.json();
        productos = Array.isArray(data) ? data : [];

        llenarCategorias(productos);
        renderProductos();
    } catch (error) {
        console.error(error);
        contenedorGrid.innerHTML = "";
        estadoProductos.textContent = "No se pudo cargar el inventario de productos.";
        estadoProductos.style.display = "block";
    }
}

inputBuscar?.addEventListener("input", renderProductos);
selectCategoria?.addEventListener("change", renderProductos);

contenedorGrid?.addEventListener("click", (event) => {
    const botonAgregar = event.target.closest(".btn-agregar");
    if (!botonAgregar) return;

    const idProducto = Number(botonAgregar.dataset.id || 0);
    if (!idProducto) return;

    agregarProductoAlCarrito(idProducto);
});

carritoItems?.addEventListener("click", (event) => {
    const target = event.target.closest("[data-action]");
    if (!target) return;

    const action = target.dataset.action;
    const idProducto = Number(target.dataset.id || 0);
    if (!idProducto) return;

    const cantidadActual = getCantidadEnCarrito(idProducto);
    const producto = getProductoById(idProducto);
    const stock = Number(producto?.stock || 0);

    if (action === "remove") {
        quitarProductoDelCarrito(idProducto);
        return;
    }

    if (action === "decrease") {
        actualizarCantidadCarrito(idProducto, cantidadActual - 1);
        return;
    }

    if (action === "increase") {
        actualizarCantidadCarrito(idProducto, Math.min(cantidadActual + 1, stock));
    }
});

carritoItems?.addEventListener("input", (event) => {
    if (!event.target.classList.contains("qty-input")) return;

    const idProducto = Number(event.target.dataset.id || 0);
    if (!idProducto) return;

    actualizarCantidadCarrito(idProducto, event.target.value);
});

btnCancelarVenta?.addEventListener("click", () => {
    carrito = {};
    renderCarrito();
    renderProductos();
});

btnConfirmarVenta?.addEventListener("click", () => {
    void confirmarVenta();
});

btnRecargarDetalleVentas?.addEventListener("click", () => {
    void cargarDetalleVentas();
});

detalleVentasBody?.addEventListener("click", (event) => {
    const boton = event.target.closest("[data-action]");
    if (!boton) return;

    const action = boton.dataset.action;

    const idVenta = Number(boton.dataset.idVenta || 0);
    if (!idVenta) return;

    if (action === "facturar-detalle") {
        abrirModalFacturacion(idVenta);
        return;
    }

    if (action === "ver-detalle-venta") {
        void abrirModalDetalleVenta(idVenta);
        return;
    }

    if (action === "descargar-factura") {
        void descargarFacturaExistente(idVenta);
    }
});

btnCerrarModalDetalleVenta?.addEventListener("click", () => {
    cerrarModalDetalleVenta();
});

modalDetalleVenta?.addEventListener("click", (event) => {
    if (event.target === modalDetalleVenta) {
        cerrarModalDetalleVenta();
    }
});

btnCerrarModalFacturacion?.addEventListener("click", () => {
    cerrarModalFacturacion();
});

btnCancelarModalFacturacion?.addEventListener("click", () => {
    cerrarModalFacturacion();
});

modalFacturacion?.addEventListener("click", (event) => {
    if (event.target === modalFacturacion) {
        cerrarModalFacturacion();
    }
});

formFacturacion?.addEventListener("submit", (event) => {
    void guardarFacturacionDesdeModal(event);
});

renderCarrito();
actualizarEstadoBotonFacturar();
actualizarEstadoBotonPdf();
void cargarUsuarioSesion();
void cargarProductos();
void cargarDetalleVentas();
