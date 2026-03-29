const API_BASE = "http://127.0.0.1:8000/api";
const token = localStorage.getItem("token");

const formProveedor = document.getElementById("formProveedor");
const idProveedor = document.getElementById("idProveedor");
const proveedorNombre = document.getElementById("proveedorNombre");
const proveedorEmpresa = document.getElementById("proveedorEmpresa");
const proveedorTelefono = document.getElementById("proveedorTelefono");
const proveedorCorreo = document.getElementById("proveedorCorreo");
const proveedorRfc = document.getElementById("proveedorRfc");
const proveedorEstado = document.getElementById("proveedorEstado");
const proveedorDireccion = document.getElementById("proveedorDireccion");
const proveedorNotas = document.getElementById("proveedorNotas");
const mensajeProveedor = document.getElementById("mensajeProveedor");
const listaProveedores = document.getElementById("listaProveedores");
const contadorProveedores = document.getElementById("contadorProveedores");
const selectProveedorEntrada = document.getElementById("proveedorEntrada");
const kpiProveedores = document.getElementById("kpiProveedores");
const btnGuardarProveedor = document.getElementById("btnGuardarProveedor");
const checkProductos = document.getElementById("checkProductos");
const buscarProducto = document.getElementById("buscarProducto");
const resultadosProducto = document.getElementById("resultadosProducto");
const infoNombre = document.getElementById("infoNombre");
const infoCodigo = document.getElementById("infoCodigo");
const infoPrecioCompra = document.getElementById("infoPrecioCompra");
const infoStockActual = document.getElementById("infoStockActual");
const infoAlertaStock = document.getElementById("infoAlertaStock");
const cantidadEntrada = document.getElementById("cantidadEntrada");
const proveedorEntrada = document.getElementById("proveedorEntrada");
const productoEntrada = document.getElementById("productoEntrada");
const totalEntrada = document.getElementById("totalEntrada");
const observacionEntrada = document.getElementById("observacionEntrada");
const mensajeEntrada = document.getElementById("mensajeEntrada");
const btnRegistrarEntrada = document.getElementById("btnRegistrarEntrada");
const tablaHistorialBody = document.getElementById("tablaHistorialBody");
const badgeHistorial = document.getElementById("badgeHistorial");
const kpiEntradas = document.getElementById("kpiEntradas");
const kpiCobertura = document.getElementById("kpiCobertura");
const kpiCoberturaTexto = document.getElementById("kpiCoberturaTexto");
const filtroDesde = document.getElementById("filtroDesde");
const filtroHasta = document.getElementById("filtroHasta");
const filtroProveedorHistorial = document.getElementById("filtroProveedorHistorial");
const filtroProductoHistorial = document.getElementById("filtroProductoHistorial");
const topbarUsuarioNombre = document.getElementById("topbarUsuarioNombre");
const topbarUsuarioRol = document.getElementById("topbarUsuarioRol");

let proveedores = [];
let catalogoProductos = [];
let selectedProducto = null;
let selectedPrecioCompra = 0;
const productosProveedorPorId = new Map();
let historialEntradas = [];

if (!token) {
    window.location.href = "login.html";
}

function getHeaders(json = false) {
    const headers = {
        Authorization: `Bearer ${token}`,
    };

    if (json) {
        headers["Content-Type"] = "application/json";
    }

    return headers;
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

function getEstadoClass(estado) {
    if ((estado || "").toLowerCase() === "activo") return "estado activo";
    return "estado";
}

function formatMoney(value) {
    const n = Number(value || 0);
    return Number.isFinite(n) ? n.toFixed(2) : "0.00";
}

function formatDateTime(value) {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    return date.toLocaleString("es-MX", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function parseDateValue(value) {
    if (!value) return null;

    if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? null : value;
    }

    const raw = String(value).trim();

    const mysqlMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/);

    if (mysqlMatch) {
        const year = Number(mysqlMatch[1]);
        const month = Number(mysqlMatch[2]) - 1;
        const day = Number(mysqlMatch[3]);
        const hour = Number(mysqlMatch[4] || "0");
        const minute = Number(mysqlMatch[5] || "0");
        const second = Number(mysqlMatch[6] || "0");
        const parsed = new Date(year, month, day, hour, minute, second);

        return Number.isNaN(parsed.getTime()) ? null : parsed;
    }

    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getHistorialFiltrado() {
    const desdeValue = filtroDesde ? filtroDesde.value : "";
    const hastaValue = filtroHasta ? filtroHasta.value : "";
    const proveedorValue = filtroProveedorHistorial ? filtroProveedorHistorial.value : "";
    const productoValue = filtroProductoHistorial ? filtroProductoHistorial.value : "";

    const desde = desdeValue ? new Date(`${desdeValue}T00:00:00`) : null;
    const hasta = hastaValue ? new Date(`${hastaValue}T23:59:59`) : null;

    return historialEntradas.filter((item) => {
        const fechaItem = parseDateValue(item.fecha);

        if (desde && (!fechaItem || fechaItem < desde)) {
            return false;
        }

        if (hasta && (!fechaItem || fechaItem > hasta)) {
            return false;
        }

        if (proveedorValue && String(item.id_proveedor || "") !== proveedorValue) {
            return false;
        }

        if (productoValue && String(item.id_producto || "") !== productoValue) {
            return false;
        }

        return true;
    });
}

function renderHistorialFiltros() {
    if (filtroProveedorHistorial) {
        const proveedorOptions = [
            '<option value="">Todos los proveedores</option>',
            ...proveedores.map((p) => `<option value="${p.id_proveedor}">${escapeHtml(p.nombre)} - ${escapeHtml(p.empresa || "Sin empresa")}</option>`),
        ];

        const selectedProveedor = filtroProveedorHistorial.value;
        filtroProveedorHistorial.innerHTML = proveedorOptions.join("");
        filtroProveedorHistorial.value = selectedProveedor;
    }

    if (filtroProductoHistorial) {
        const productoOptions = [
            '<option value="">Todos los productos</option>',
            ...catalogoProductos.map((p) => `<option value="${p.id_producto}">${escapeHtml(p.nombre)}</option>`),
        ];

        const selectedProducto = filtroProductoHistorial.value;
        filtroProductoHistorial.innerHTML = productoOptions.join("");
        filtroProductoHistorial.value = selectedProducto;
    }
}

function getStockAlertText(stock) {
    const n = Number(stock || 0);

    if (n <= 5) return { text: "Stock bajo", ok: false };
    return { text: "Stock estable", ok: true };
}

function actualizarTotalEntrada() {
    if (!totalEntrada) return;

    const cantidad = cantidadEntrada ? Number(cantidadEntrada.value || 0) : 0;
    const total = Number.isFinite(cantidad) && cantidad > 0 ? cantidad * Number(selectedPrecioCompra || 0) : 0;

    totalEntrada.textContent = `$${formatMoney(total)}`;
}

function getProductosDelProveedorSeleccionado() {
    const proveedorId = proveedorEntrada ? Number(proveedorEntrada.value || 0) : 0;

    if (!proveedorId) return [];

    return productosProveedorPorId.get(proveedorId) || [];
}

function renderProductosProveedorEntrada() {
    if (!productoEntrada) return;

    const proveedorId = proveedorEntrada ? Number(proveedorEntrada.value || 0) : 0;

    if (!proveedorId) {
        productoEntrada.disabled = true;
        productoEntrada.innerHTML = '<option value="">Selecciona un proveedor primero</option>';
        selectedProducto = null;
        selectedPrecioCompra = 0;
        renderProductoSeleccionado();
        actualizarTotalEntrada();
        return;
    }

    const lista = getProductosDelProveedorSeleccionado();

    if (!lista.length) {
        productoEntrada.disabled = true;
        productoEntrada.innerHTML = '<option value="">Este proveedor no tiene productos asignados</option>';
        selectedProducto = null;
        selectedPrecioCompra = 0;
        renderProductoSeleccionado();
        actualizarTotalEntrada();
        return;
    }

    productoEntrada.disabled = false;
    productoEntrada.innerHTML = [
        '<option value="">Selecciona un producto</option>',
        ...lista.map((item) => {
            const nombre = item.nombre || "Producto";
            const precio = formatMoney(item.precio_compra);
            const idProducto = Number(item.id_producto || 0);

            return `<option value="${idProducto}">${escapeHtml(nombre)} | $${escapeHtml(precio)}</option>`;
        }),
    ].join("");
}

function sincronizarProductoSeleccionadoDesdeSelect() {
    if (!productoEntrada) return;

    const idProducto = Number(productoEntrada.value || 0);

    if (!idProducto) {
        selectedProducto = null;
        selectedPrecioCompra = 0;
        renderProductoSeleccionado();
        actualizarTotalEntrada();
        return;
    }

    const lista = getProductosDelProveedorSeleccionado();
    const item = lista.find((p) => Number(p.id_producto) === idProducto);
    const productoCatalogo = catalogoProductos.find((p) => Number(p.id_producto) === idProducto);

    if (!item || !productoCatalogo) {
        selectedProducto = null;
        selectedPrecioCompra = 0;
        renderProductoSeleccionado();
        actualizarTotalEntrada();
        return;
    }

    selectedProducto = productoCatalogo;
    selectedPrecioCompra = Number(item.precio_compra || 0);
    renderProductoSeleccionado();
    actualizarTotalEntrada();
}

function mostrarMensaje(texto, ok = false) {
    if (!mensajeProveedor) return;

    mensajeProveedor.textContent = texto;
    mensajeProveedor.style.color = ok ? "#1e7e34" : "#b42318";
}

function isProveedorFormCompleto() {
    const nombreOk = proveedorNombre && proveedorNombre.value.trim().length > 0;
    const empresaOk = proveedorEmpresa && proveedorEmpresa.value.trim().length > 0;
    const seleccion = obtenerProductosSeleccionados();

    return Boolean(nombreOk && empresaOk && !seleccion.error && seleccion.productos.length > 0);
}

function actualizarEstadoBotonProveedor() {
    if (!btnGuardarProveedor) return;

    const ready = isProveedorFormCompleto();
    btnGuardarProveedor.classList.toggle("is-ready", ready);
}

function resetFormProveedor() {
    if (!formProveedor) return;

    formProveedor.reset();
    if (idProveedor) idProveedor.value = "";
    if (proveedorEstado) proveedorEstado.value = "Activo";

    if (btnGuardarProveedor) {
        btnGuardarProveedor.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Registrar proveedor';
    }

    renderCheckProductos();

    actualizarEstadoBotonProveedor();
}

async function cargarProveedorEnFormulario(proveedor) {
    if (!proveedor) return;

    if (idProveedor) idProveedor.value = String(proveedor.id_proveedor);
    proveedorNombre.value = proveedor.nombre || "";
    proveedorEmpresa.value = proveedor.empresa || "";
    proveedorTelefono.value = proveedor.telefono || "";
    proveedorCorreo.value = proveedor.correo || "";
    if (proveedorRfc) proveedorRfc.value = proveedor.rfc || "";
    if (proveedorEstado) proveedorEstado.value = proveedor.estado || "Activo";
    if (proveedorDireccion) proveedorDireccion.value = proveedor.direccion || "";
    proveedorNotas.value = proveedor.notas || "";

    if (btnGuardarProveedor) {
        btnGuardarProveedor.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar cambios';
    }

    try {
        const productos = await cargarProductosProveedor(proveedor.id_proveedor);
        const seleccion = new Map();

        productos.forEach((item) => {
            if (item.id_producto) {
                seleccion.set(Number(item.id_producto), formatMoney(item.precio_compra));
            }
        });

        renderCheckProductos(seleccion);
    } catch (error) {
        console.error(error);
        mostrarMensaje("No se pudieron cargar los productos del proveedor.");
    }

    actualizarEstadoBotonProveedor();

    proveedorNombre.focus();
}

function renderCheckProductos(seleccion = new Map()) {
    if (!checkProductos) return;

    if (!catalogoProductos.length) {
        checkProductos.innerHTML = '<p class="vacio">No hay productos disponibles en el catalogo.</p>';
        return;
    }

    checkProductos.innerHTML = catalogoProductos
        .map((producto) => {
            const productoId = Number(producto.id_producto);
            const checked = seleccion.has(productoId);
            const precio = checked ? seleccion.get(productoId) : "";

            return `
                <div class="check-item check-item-producto">
                    <label class="check-label-producto">
                        <input type="checkbox" data-id="${productoId}" ${checked ? "checked" : ""}>
                        <span>${escapeHtml(producto.nombre)}</span>
                    </label>
                    <small class="check-meta">${escapeHtml(producto.codigo || "")}</small>
                    <input
                        type="number"
                        class="input-precio-compra"
                        data-id="${productoId}"
                        min="0"
                        step="0.01"
                        placeholder="Precio compra"
                        value="${escapeHtml(precio)}"
                        ${checked ? "" : "disabled"}
                    >
                </div>
            `;
        })
        .join("");
}

function obtenerProductosSeleccionados() {
    if (!checkProductos) return { productos: [], error: null };

    const checkboxes = Array.from(checkProductos.querySelectorAll('input[type="checkbox"][data-id]'));
    const productos = [];

    for (const checkbox of checkboxes) {
        if (!checkbox.checked) continue;

        const idProducto = Number(checkbox.dataset.id);
        const precioInput = checkProductos.querySelector(`.input-precio-compra[data-id="${idProducto}"]`);
        const precio = precioInput ? Number(precioInput.value) : NaN;

        if (!Number.isFinite(precio) || precio <= 0) {
            return {
                productos: [],
                error: "Cada producto seleccionado debe tener precio de compra mayor a 0.",
            };
        }

        productos.push({
            id_producto: idProducto,
            precio_compra: Number(precio.toFixed(2)),
        });
    }

    return { productos, error: null };
}

function renderProveedorEntradaOptions() {
    if (!selectProveedorEntrada) return;

    const options = [
        '<option value="">Selecciona un proveedor</option>',
        ...proveedores.map((p) => `
            <option value="${p.id_proveedor}">${escapeHtml(p.nombre)} - ${escapeHtml(p.empresa || "Sin empresa")}</option>
        `),
    ];

    selectProveedorEntrada.innerHTML = options.join("");
}

function renderResultadosProducto(lista) {
    if (!resultadosProducto) return;

    if (!lista.length) {
        resultadosProducto.innerHTML = '<p class="vacio">No se encontraron productos.</p>';
        return;
    }

    resultadosProducto.innerHTML = lista
        .map((producto) => `
            <button type="button" class="item-resultado" data-id="${producto.id_producto}">
                <span>${escapeHtml(producto.nombre)}</span>
                <span class="meta">${escapeHtml(producto.codigo || "Sin codigo")} | Stock ${escapeHtml(producto.stock || 0)}</span>
            </button>
        `)
        .join("");
}

function renderProductoSeleccionado() {
    if (!selectedProducto) {
        if (infoNombre) infoNombre.textContent = "Ningun producto seleccionado";
        if (infoCodigo) infoCodigo.textContent = "Codigo: -";
        if (infoPrecioCompra) infoPrecioCompra.textContent = "Precio proveedor: -";
        if (infoStockActual) infoStockActual.textContent = "0";
        if (infoAlertaStock) {
            infoAlertaStock.classList.remove("ok");
            infoAlertaStock.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Selecciona un producto para ver estado de stock';
        }
        return;
    }

    if (infoNombre) infoNombre.textContent = selectedProducto.nombre || "-";
    if (infoCodigo) infoCodigo.textContent = `Codigo: ${selectedProducto.codigo || "-"}`;
    if (infoPrecioCompra) infoPrecioCompra.textContent = `Precio proveedor: $${formatMoney(selectedPrecioCompra)}`;
    if (infoStockActual) infoStockActual.textContent = String(selectedProducto.stock || 0);

    if (infoAlertaStock) {
        const stockAlert = getStockAlertText(selectedProducto.stock || 0);
        infoAlertaStock.classList.toggle("ok", stockAlert.ok);
        infoAlertaStock.innerHTML = `<i class="fa-solid ${stockAlert.ok ? "fa-circle-check" : "fa-triangle-exclamation"}"></i> ${escapeHtml(stockAlert.text)}`;
    }
}

function filtrarProductosBusqueda() {
    const term = (buscarProducto ? buscarProducto.value : "").trim().toLowerCase();
    const proveedorId = proveedorEntrada ? Number(proveedorEntrada.value || 0) : 0;
    const permitidos = proveedorId ? productosProveedorPorId.get(proveedorId) || [] : null;
    const permitidosSet = permitidos ? new Set(permitidos.map((item) => Number(item.id_producto))) : null;

    const filtrados = catalogoProductos.filter((producto) => {
        const coincideProveedor = !permitidosSet || permitidosSet.has(Number(producto.id_producto));
        const coincideTexto = !term
            || String(producto.nombre || "").toLowerCase().includes(term)
            || String(producto.codigo || "").toLowerCase().includes(term);

        return coincideProveedor && coincideTexto;
    });

    renderResultadosProducto(filtrados.slice(0, 25));
}

function updateCoberturaKpi() {
    if (!kpiCobertura || !kpiCoberturaTexto) return;

    const totalProductos = catalogoProductos.length;
    const cubiertos = new Set();

    for (const lista of productosProveedorPorId.values()) {
        lista.forEach((item) => cubiertos.add(Number(item.id_producto)));
    }

    const totalCubiertos = cubiertos.size;
    const porcentaje = totalProductos > 0 ? Math.round((totalCubiertos * 100) / totalProductos) : 0;

    kpiCobertura.textContent = `${porcentaje}%`;
    kpiCoberturaTexto.textContent = `${totalCubiertos} de ${totalProductos} productos cubiertos`;
}

function renderHistorial() {
    if (!tablaHistorialBody || !badgeHistorial || !kpiEntradas) return;

    const historialFiltrado = getHistorialFiltrado();

    if (!historialFiltrado.length) {
        tablaHistorialBody.innerHTML = '<tr><td colspan="8" class="vacio">Sin entradas registradas para los filtros aplicados.</td></tr>';
    } else {
        tablaHistorialBody.innerHTML = historialFiltrado
            .map((item) => `
                <tr>
                    <td>${escapeHtml(formatDateTime(item.fecha))}</td>
                    <td>${escapeHtml(item.producto || "-")}</td>
                    <td>${escapeHtml(item.proveedor || item.proveedor_nombre || "-")}</td>
                    <td><span class="cantidad">${escapeHtml(item.cantidad || "-")}</span></td>
                    <td>$${escapeHtml(formatMoney(item.precio_compra || item.precio_unitario || 0))}</td>
                    <td>$${escapeHtml(formatMoney(item.total || 0))}</td>
                    <td>${escapeHtml(item.usuario || "Admin")}</td>
                    <td>${escapeHtml(item.observacion || "-")}</td>
                </tr>
            `)
            .join("");
    }

    badgeHistorial.textContent = `${historialFiltrado.length} registros`;
    kpiEntradas.textContent = String(historialFiltrado.length);
}

function renderProveedores() {
    if (!listaProveedores) return;

    if (!proveedores.length) {
        listaProveedores.innerHTML = '<p class="vacio">Aun no hay proveedores registrados.</p>';
    } else {
        listaProveedores.innerHTML = proveedores
            .map((proveedor) => `
                <article class="proveedor-item">
                    <h5>${escapeHtml(proveedor.nombre)}</h5>
                    <p><strong>Empresa:</strong> ${escapeHtml(proveedor.empresa || "-")}</p>
                    <p><strong>Telefono:</strong> ${escapeHtml(proveedor.telefono || "-")}</p>
                    <p><strong>Correo:</strong> ${escapeHtml(proveedor.correo || "-")}</p>
                    <p><strong>Direccion:</strong> ${escapeHtml(proveedor.direccion || "-")}</p>
                    <p><strong>RFC:</strong> ${escapeHtml(proveedor.rfc || "-")}</p>
                    <p><strong>Productos asignados:</strong> ${escapeHtml(proveedor.productos_proveedor_count || 0)}</p>
                    <span class="${getEstadoClass(proveedor.estado)}">${escapeHtml(proveedor.estado || "Activo")}</span>
                    <div class="acciones-proveedor">
                        <button type="button" class="btn-edit-proveedor" data-action="editar" data-id="${proveedor.id_proveedor}">Editar</button>
                        <button type="button" class="btn-delete-proveedor" data-action="eliminar" data-id="${proveedor.id_proveedor}">Eliminar</button>
                    </div>
                </article>
            `)
            .join("");
    }

    const total = String(proveedores.length);

    if (contadorProveedores) {
        contadorProveedores.textContent = total;
    }

    if (kpiProveedores) {
        const activos = proveedores.filter((p) => String(p.estado || "").toLowerCase() === "activo").length;
        kpiProveedores.textContent = String(activos);
    }

    renderProveedorEntradaOptions();
}

function getErrorMessage(errorData) {
    if (!errorData) return "Error al guardar proveedor.";

    if (errorData.errors) {
        const firstKey = Object.keys(errorData.errors)[0];

        if (firstKey && errorData.errors[firstKey] && errorData.errors[firstKey][0]) {
            return errorData.errors[firstKey][0];
        }
    }

    return errorData.message || "No se pudo guardar el proveedor.";
}

async function cargarProveedores() {
    try {
        const response = await fetch(`${API_BASE}/proveedores`, {
            method: "GET",
            headers: getHeaders(),
        });

        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem("token");
                window.location.href = "login.html";
                return;
            }

            throw new Error("No se pudieron cargar proveedores");
        }

        proveedores = await response.json();
        renderProveedores();
        renderHistorialFiltros();

        const cargasProductos = proveedores.map(async (proveedor) => {
            try {
                const lista = await cargarProductosProveedor(proveedor.id_proveedor);
                productosProveedorPorId.set(Number(proveedor.id_proveedor), lista);
            } catch (error) {
                console.error(error);
                productosProveedorPorId.set(Number(proveedor.id_proveedor), []);
            }
        });

        await Promise.all(cargasProductos);
        updateCoberturaKpi();
        renderProductosProveedorEntrada();
        filtrarProductosBusqueda();
    } catch (error) {
        console.error(error);
        if (listaProveedores) {
            listaProveedores.innerHTML = '<p class="vacio">Error al cargar proveedores.</p>';
        }
    }
}

async function cargarCatalogoProductos() {
    try {
        const response = await fetch(`${API_BASE}/productos`, {
            method: "GET",
            headers: getHeaders(),
        });

        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem("token");
                window.location.href = "login.html";
                return;
            }

            throw new Error("No se pudieron cargar productos de catalogo");
        }

        catalogoProductos = await response.json();
        renderCheckProductos();
        renderHistorialFiltros();
        actualizarEstadoBotonProveedor();
    } catch (error) {
        console.error(error);
        if (checkProductos) {
            checkProductos.innerHTML = '<p class="vacio">Error al cargar productos del catalogo.</p>';
        }
    }
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
            const rol = usuario.rol && usuario.rol.nombre ? usuario.rol.nombre : "Administrador";
            topbarUsuarioRol.textContent = rol;
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

async function crearProveedor(payload) {
    const response = await fetch(`${API_BASE}/proveedores`, {
        method: "POST",
        headers: getHeaders(true),
        body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
        throw data;
    }

    return data;
}

async function actualizarProveedor(id, payload) {
    const response = await fetch(`${API_BASE}/proveedores/${id}`, {
        method: "PUT",
        headers: getHeaders(true),
        body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
        throw data;
    }

    return data;
}

async function eliminarProveedor(id) {
    const response = await fetch(`${API_BASE}/proveedores/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
        throw data;
    }

    return data;
}

async function cargarEntradas() {
    try {
        const response = await fetch(`${API_BASE}/entradas`, {
            method: "GET",
            headers: getHeaders(),
        });

        if (!response.ok) {
            throw new Error("No se pudo cargar historial de entradas");
        }

        const data = await response.json();
        historialEntradas = data.map((item) => ({
            ...item,
            proveedor: item.proveedor || `${item.proveedor_nombre || ""}${item.proveedor_empresa ? ` - ${item.proveedor_empresa}` : ""}`.trim(),
            producto: item.producto || "-",
            id_producto: item.id_producto || null,
            cantidad: item.cantidad ?? "-",
            observacion: item.observacion || "-",
            usuario: "Admin",
        }));
        renderHistorialFiltros();
        renderHistorial();
    } catch (error) {
        console.error(error);
    }
}

async function registrarEntrada(payload) {
    const response = await fetch(`${API_BASE}/entradas`, {
        method: "POST",
        headers: getHeaders(true),
        body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
        throw data;
    }

    return data;
}

async function cargarProductosProveedor(idProveedorActual) {
    const response = await fetch(`${API_BASE}/proveedores/${idProveedorActual}/productos`, {
        method: "GET",
        headers: getHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
        throw data;
    }

    return data;
}

async function syncProductosProveedor(idProveedorActual, productos) {
    const response = await fetch(`${API_BASE}/proveedores/${idProveedorActual}/productos`, {
        method: "POST",
        headers: getHeaders(true),
        body: JSON.stringify({ productos }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw data;
    }

    return data;
}

if (formProveedor) {
    [proveedorNombre, proveedorEmpresa].forEach((input) => {
        if (!input) return;

        input.addEventListener("input", actualizarEstadoBotonProveedor);
    });

    if (checkProductos) {
        checkProductos.addEventListener("change", (event) => {
            const checkbox = event.target.closest('input[type="checkbox"][data-id]');

            if (checkbox) {
                const idProducto = Number(checkbox.dataset.id);
                const precioInput = checkProductos.querySelector(`.input-precio-compra[data-id="${idProducto}"]`);

                if (precioInput) {
                    precioInput.disabled = !checkbox.checked;
                    if (!checkbox.checked) {
                        precioInput.value = "";
                    } else if (!precioInput.value) {
                        precioInput.value = "0.01";
                    }
                }
            }

            actualizarEstadoBotonProveedor();
        });

        checkProductos.addEventListener("input", (event) => {
            if (event.target.closest(".input-precio-compra")) {
                actualizarEstadoBotonProveedor();
            }
        });
    }

    formProveedor.addEventListener("submit", async (event) => {
        event.preventDefault();

        const proveedorId = idProveedor ? idProveedor.value.trim() : "";

        const payload = {
            nombre: proveedorNombre.value.trim(),
            empresa: proveedorEmpresa.value.trim(),
            telefono: proveedorTelefono.value.trim() || null,
            correo: proveedorCorreo.value.trim() || null,
            direccion: proveedorDireccion ? proveedorDireccion.value.trim() || null : null,
            rfc: proveedorRfc ? proveedorRfc.value.trim() || null : null,
            estado: proveedorEstado ? proveedorEstado.value : "Activo",
        };

        if (!payload.nombre || !payload.empresa) {
            mostrarMensaje("Nombre y empresa son obligatorios.");
            return;
        }

        const seleccion = obtenerProductosSeleccionados();

        if (seleccion.error) {
            mostrarMensaje(seleccion.error);
            return;
        }

        if (!seleccion.productos.length) {
            mostrarMensaje("Selecciona al menos un producto del catalogo para el proveedor.");
            return;
        }

        try {
            mostrarMensaje(proveedorId ? "Actualizando proveedor..." : "Guardando proveedor...");

            let proveedorGuardadoId = Number(proveedorId);

            if (proveedorId) {
                await actualizarProveedor(proveedorId, payload);
            } else {
                const nuevoProveedor = await crearProveedor(payload);
                proveedorGuardadoId = Number(nuevoProveedor.id_proveedor);
            }

            await syncProductosProveedor(proveedorGuardadoId, seleccion.productos);
            mostrarMensaje(proveedorId ? "Proveedor actualizado correctamente." : "Proveedor registrado correctamente.", true);

            resetFormProveedor();
            await cargarProveedores();
        } catch (errorData) {
            mostrarMensaje(getErrorMessage(errorData));
        }
    });
}

if (listaProveedores) {
    listaProveedores.addEventListener("click", async (event) => {
        const button = event.target.closest("button[data-action]");

        if (!button) return;

        const action = button.dataset.action;
        const id = Number(button.dataset.id);
        const proveedor = proveedores.find((item) => Number(item.id_proveedor) === id);

        if (!proveedor) {
            mostrarMensaje("No se encontro el proveedor seleccionado.");
            return;
        }

        if (action === "editar") {
            await cargarProveedorEnFormulario(proveedor);
            mostrarMensaje("Edita los datos y guarda cambios.", true);
            return;
        }

        if (action === "eliminar") {
            const confirmar = confirm(`¿Eliminar proveedor ${proveedor.nombre}?`);

            if (!confirmar) return;

            try {
                await eliminarProveedor(id);
                mostrarMensaje("Proveedor eliminado correctamente.", true);
                resetFormProveedor();
                await cargarProveedores();
            } catch (errorData) {
                mostrarMensaje(getErrorMessage(errorData));
            }
        }
    });
}

if (buscarProducto) {
    buscarProducto.addEventListener("input", filtrarProductosBusqueda);
}

if (proveedorEntrada) {
    proveedorEntrada.addEventListener("change", async () => {
        const proveedorId = Number(proveedorEntrada.value || 0);

        if (proveedorId && !productosProveedorPorId.has(proveedorId)) {
            try {
                const lista = await cargarProductosProveedor(proveedorId);
                productosProveedorPorId.set(proveedorId, lista);
                updateCoberturaKpi();
            } catch (error) {
                console.error(error);
            }
        }

        if (selectedProducto && proveedorId) {
            const lista = productosProveedorPorId.get(proveedorId) || [];
            const existe = lista.some((item) => Number(item.id_producto) === Number(selectedProducto.id_producto));

            if (!existe) {
                selectedProducto = null;
                renderProductoSeleccionado();
            }
        }

        renderProductosProveedorEntrada();
        sincronizarProductoSeleccionadoDesdeSelect();
        filtrarProductosBusqueda();
    });
}

if (productoEntrada) {
    productoEntrada.addEventListener("change", () => {
        sincronizarProductoSeleccionadoDesdeSelect();
    });
}

if (cantidadEntrada) {
    cantidadEntrada.addEventListener("input", () => {
        actualizarTotalEntrada();
    });
}

if (resultadosProducto) {
    resultadosProducto.addEventListener("click", (event) => {
        const button = event.target.closest("button.item-resultado[data-id]");

        if (!button) return;

        const id = Number(button.dataset.id);
        const producto = catalogoProductos.find((item) => Number(item.id_producto) === id);

        if (!producto) return;

        selectedProducto = producto;
        if (productoEntrada) {
            productoEntrada.value = String(id);
        }
        sincronizarProductoSeleccionadoDesdeSelect();
        renderProductoSeleccionado();
    });
}

if (btnRegistrarEntrada) {
    btnRegistrarEntrada.addEventListener("click", async () => {
        if (!mensajeEntrada) return;

        const proveedorId = proveedorEntrada ? Number(proveedorEntrada.value || 0) : 0;
        const cantidad = cantidadEntrada ? Number(cantidadEntrada.value || 0) : 0;
        const observacion = observacionEntrada ? observacionEntrada.value.trim() : "";

        if (!selectedProducto) {
            mensajeEntrada.textContent = "Selecciona un producto para registrar la entrada.";
            return;
        }

        if (!proveedorId) {
            mensajeEntrada.textContent = "Selecciona un proveedor.";
            return;
        }

        if (!Number.isFinite(cantidad) || cantidad <= 0) {
            mensajeEntrada.textContent = "Ingresa una cantidad valida mayor a 0.";
            return;
        }

        try {
            mensajeEntrada.textContent = "Registrando entrada...";

            const entrada = await registrarEntrada({
                id_proveedor: proveedorId,
                id_producto: selectedProducto.id_producto,
                cantidad,
                observacion: observacion || null,
            });

            selectedProducto.stock = entrada.stock_nuevo;
            renderProductoSeleccionado();
            mensajeEntrada.textContent = "Entrada registrada correctamente.";
            mensajeEntrada.style.color = "#1e7e34";

            historialEntradas.unshift({
                ...entrada,
                usuario: "Admin",
            });
            renderHistorialFiltros();
            renderHistorial();
            filtrarProductosBusqueda();
            actualizarTotalEntrada();
        } catch (errorData) {
            mensajeEntrada.style.color = "#b42318";
            mensajeEntrada.textContent = getErrorMessage(errorData);
        }
    });
}

[filtroDesde, filtroHasta, filtroProveedorHistorial, filtroProductoHistorial].forEach((input) => {
    if (!input) return;

    input.addEventListener("change", () => {
        renderHistorial();
    });
});

void Promise.all([cargarUsuarioSesion(), cargarCatalogoProductos(), cargarProveedores(), cargarEntradas()]).then(() => {
    renderProductosProveedorEntrada();
    sincronizarProductoSeleccionadoDesdeSelect();
    actualizarTotalEntrada();
    filtrarProductosBusqueda();
    renderProductoSeleccionado();
    renderHistorial();
});
actualizarEstadoBotonProveedor();
