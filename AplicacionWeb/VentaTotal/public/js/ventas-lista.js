const getApiBaseUrl = () => {
    const protocol = window.location.protocol;
    const host = window.location.host.split(":")[0];
    return `${protocol}//${host}:8000/api`;
};

const API_BASE = getApiBaseUrl();
const STORAGE_KEY = "ventas_pendientes";

const token = localStorage.getItem("token");
if (!token) {
    window.location.href = "login.html";
}

const state = {
    ventas: [],
    page: 1,
    rowsPerPage: 10,
    ventaDetalleActual: null
};

const DEBUG_LOGS = true;

function debugLog(...args) {
    if (DEBUG_LOGS) {
        console.log("[VENTAS-LISTA]", ...args);
    }
}

const els = {
    buscarVenta: document.getElementById("buscarVenta"),
    estadoVenta: document.getElementById("estadoVenta"),
    tablaVentasBody: document.getElementById("tablaVentasBody"),
    resumenVentas: document.getElementById("resumenVentas"),
    filasPorPagina: document.getElementById("filasPorPagina"),
    paginacionInfo: document.getElementById("paginacionInfo"),
    paginacionNumeros: document.getElementById("paginacionNumeros"),
    btnPrevPage: document.getElementById("btnPrevPage"),
    btnNextPage: document.getElementById("btnNextPage"),
    modalDetalleVenta: document.getElementById("modalDetalleVenta"),
    detalleVentaContent: document.getElementById("detalleVentaContent"),
    modalEditarVenta: document.getElementById("modalEditarVenta"),
    formEditarVenta: document.getElementById("formEditarVenta"),
    editVentaId: document.getElementById("editVentaId"),
    editCliente: document.getElementById("editCliente"),
    editMetodoPago: document.getElementById("editMetodoPago"),
    editEstado: document.getElementById("editEstado"),
    editObservaciones: document.getElementById("editObservaciones"),
    editDetalleVenta: document.getElementById("editDetalleVenta"),
    mensajeEdicion: document.getElementById("mensajeEdicion"),
    topbarUsuarioNombre: document.getElementById("topbarUsuarioNombre"),
    topbarUsuarioRol: document.getElementById("topbarUsuarioRol")
};

state.rowsPerPage = Number(els.filasPorPagina.value || 10);

function getHeaders() {
    return {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
    };
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function formatMoney(value) {
    return new Intl.NumberFormat("es-MX", {
        style: "currency",
        currency: "MXN"
    }).format(Number(value || 0));
}

function formatDate(value) {
    const date = value ? new Date(value) : null;
    if (!date || Number.isNaN(date.getTime())) {
        return "-";
    }

    return new Intl.DateTimeFormat("es-MX", {
        dateStyle: "short",
        timeStyle: "short"
    }).format(date);
}

function normalizeVenta(raw, index, origen) {
    const detalle = Array.isArray(raw.detalle)
        ? raw.detalle
        : (Array.isArray(raw.detalles) ? raw.detalles : []);

    return {
        id: String(raw.id_venta || raw.id || raw.id_local || `local-${index + 1}`),
        folio: raw.folio || raw.folio_local || `VTA-${String(index + 1).padStart(4, "0")}`,
        fecha: raw.fecha_venta || raw.fecha_local || raw.created_at || new Date().toISOString(),
        cliente: raw.cliente || raw.nombre_cliente || "Publico general",
        metodo_pago: String(raw.metodo_pago || "efectivo").toLowerCase(),
        estado: String(raw.estado || "pendiente").toLowerCase(),
        subtotal: Number(raw.subtotal || 0),
        impuesto: Number(raw.impuesto || raw.iva || 0),
        total: Number(raw.total || 0),
        observaciones: raw.observaciones || "",
        detalle,
        origen
    };
}

async function requestJson(path, options = {}) {
    debugLog("Request:", path, options.method || "GET");
    const response = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: {
            ...getHeaders(),
            ...(options.headers || {})
        }
    });

    debugLog("Response:", path, response.status, response.statusText);

    if (response.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "login.html";
        throw new Error("Sesion expirada");
    }

    if (!response.ok) {
        const text = await response.text();
        debugLog("Response error body:", path, text);
        throw new Error(text || `Error HTTP ${response.status}`);
    }

    const data = await response.json();
    debugLog("Response JSON:", path, data);
    return data;
}

function getVentasLocales() {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    const local = raw.map((item, i) => normalizeVenta(item, i, "local"));
    debugLog("Ventas locales:", local.length);
    return local;
}

async function getVentasApi() {
    const data = await requestJson("/ventas", { method: "GET" });
    const api = (Array.isArray(data) ? data : []).map((item, i) => normalizeVenta(item, i, "api"));
    debugLog("Ventas API normalizadas:", api.length);
    if (api.length) {
        debugLog("Primera venta API:", api[0]);
    }
    return api;
}

async function cargarUsuarioSesion() {
    try {
        const user = await requestJson("/me", { method: "GET" });
        debugLog("Usuario en sesion:", user);
        els.topbarUsuarioNombre.textContent = user.nombre || "Usuario";
        els.topbarUsuarioRol.textContent = "Administrador";
    } catch {
        debugLog("No se pudo obtener sesion");
        els.topbarUsuarioNombre.textContent = "Sin sesion";
        els.topbarUsuarioRol.textContent = "Administrador";
    }
}

async function cargarVentas() {
    els.tablaVentasBody.innerHTML = '<tr><td colspan="7" class="estado">Cargando ventas...</td></tr>';

    try {
        const [apiVentas, localVentas] = await Promise.all([getVentasApi(), Promise.resolve(getVentasLocales())]);
        state.ventas = [...apiVentas, ...localVentas];
        debugLog("Total ventas combinadas:", state.ventas.length);
    } catch (error) {
        console.warn("No fue posible leer API de ventas:", error.message);
        state.ventas = getVentasLocales();
        debugLog("Fallback solo ventas locales:", state.ventas.length);
    }

    state.ventas.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
    renderVentas();
}

function getVentasFiltradas() {
    const q = (els.buscarVenta.value || "").trim().toLowerCase();
    const estado = els.estadoVenta.value;

    return state.ventas.filter((venta) => {
        const textOk = !q
            || venta.folio.toLowerCase().includes(q)
            || venta.cliente.toLowerCase().includes(q)
            || venta.metodo_pago.toLowerCase().includes(q);
        const estadoOk = !estado || venta.estado === estado;
        return textOk && estadoOk;
    });
}

function renderPaginacion(totalPages) {
    els.paginacionNumeros.innerHTML = "";

    const start = Math.max(1, state.page - 2);
    const end = Math.min(totalPages, state.page + 2);

    for (let p = start; p <= end; p += 1) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = `pagina-numero ${p === state.page ? "active" : ""}`;
        button.textContent = String(p);
        button.dataset.page = String(p);
        els.paginacionNumeros.appendChild(button);
    }

    els.btnPrevPage.disabled = state.page <= 1;
    els.btnNextPage.disabled = state.page >= totalPages;
}

function renderVentas() {
    const filtradas = getVentasFiltradas();
    debugLog("Render ventas filtradas:", filtradas.length, "pagina:", state.page);
    els.resumenVentas.textContent = `${filtradas.length} registros`;

    if (!filtradas.length) {
        els.tablaVentasBody.innerHTML = '<tr><td colspan="7" class="estado">No hay ventas para mostrar.</td></tr>';
        els.paginacionInfo.textContent = "Mostrando 0 - 0 de 0";
        els.paginacionNumeros.innerHTML = "";
        els.btnPrevPage.disabled = true;
        els.btnNextPage.disabled = true;
        return;
    }

    const totalPages = Math.max(1, Math.ceil(filtradas.length / state.rowsPerPage));
    if (state.page > totalPages) {
        state.page = totalPages;
    }

    const startIndex = (state.page - 1) * state.rowsPerPage;
    const endIndex = startIndex + state.rowsPerPage;
    const pageData = filtradas.slice(startIndex, endIndex);

    els.tablaVentasBody.innerHTML = pageData.map((venta) => `
        <tr>
            <td>${escapeHtml(venta.folio)}</td>
            <td>${formatDate(venta.fecha)}</td>
            <td>${escapeHtml(venta.cliente)}</td>
            <td>${escapeHtml(venta.metodo_pago)}</td>
            <td><span class="badge ${escapeHtml(venta.estado)}">${escapeHtml(venta.estado)}</span></td>
            <td>${formatMoney(venta.total)}</td>
            <td>
                <div class="acciones">
                    <button class="icon-btn ver" title="Ver detalle" data-action="ver" data-id="${escapeHtml(venta.id)}"><i class="fa-solid fa-eye"></i></button>
                    <button class="icon-btn editar" title="Editar" data-action="editar" data-id="${escapeHtml(venta.id)}"><i class="fa-solid fa-pen"></i></button>
                    <button class="icon-btn eliminar" title="Eliminar" data-action="eliminar" data-id="${escapeHtml(venta.id)}"><i class="fa-solid fa-trash"></i></button>
                </div>
            </td>
        </tr>
    `).join("");

    els.paginacionInfo.textContent = `Mostrando ${startIndex + 1} - ${Math.min(endIndex, filtradas.length)} de ${filtradas.length}`;
    renderPaginacion(totalPages);
}

function abrirModal(modal) {
    modal.style.display = "flex";
}

function cerrarModal(modal) {
    modal.style.display = "none";
}

function renderDetalleVenta(venta) {
    state.ventaDetalleActual = venta;
    const detalle = Array.isArray(venta.detalle) ? venta.detalle : [];

    const rows = detalle.length
        ? detalle.map((item) => {
            const nombre = item.nombre || item.producto || item.codigo || "Producto";
            const cantidad = Number(item.cantidad || 0);
            const precio = Number(item.precio_unitario || item.precio || 0);
            const subtotal = Number(item.subtotal || (cantidad * precio));

            return `
                <tr>
                    <td>${escapeHtml(nombre)}</td>
                    <td>${cantidad}</td>
                    <td>${formatMoney(precio)}</td>
                    <td>${formatMoney(subtotal)}</td>
                </tr>
            `;
        }).join("")
        : '<tr><td colspan="4">Sin detalle disponible</td></tr>';

    els.detalleVentaContent.innerHTML = `
        <div class="detalle-grid">
            <div class="detalle-card"><span>Folio</span><strong>${escapeHtml(venta.folio)}</strong></div>
            <div class="detalle-card"><span>Fecha</span><strong>${formatDate(venta.fecha)}</strong></div>
            <div class="detalle-card"><span>Cliente</span><strong>${escapeHtml(venta.cliente)}</strong></div>
            <div class="detalle-card"><span>Metodo</span><strong>${escapeHtml(venta.metodo_pago)}</strong></div>
            <div class="detalle-card"><span>Estado</span><strong>${escapeHtml(venta.estado)}</strong></div>
            <div class="detalle-card"><span>Total</span><strong>${formatMoney(venta.total)}</strong></div>
        </div>

        <table class="detalle-tabla">
            <thead>
                <tr>
                    <th>Producto</th>
                    <th>Cantidad</th>
                    <th>Precio unitario</th>
                    <th>Subtotal</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>
    `;

    abrirModal(els.modalDetalleVenta);
}

function getMetodoPagoLabel(value) {
    const key = String(value || "").toLowerCase();
    if (key === "tarjeta") return "Tarjeta";
    if (key === "transferencia") return "Transferencia";
    return "Efectivo";
}

function getDetalleExportable(venta) {
    const detalle = Array.isArray(venta.detalle) ? venta.detalle : [];

    return detalle.map((item) => {
        const nombre = item.nombre || item.producto || item.codigo || "Producto";
        const descripcion = item.descripcion || item.detalle || "";
        const cantidad = Number(item.cantidad || 0);
        const precioUnitario = Number(item.precio_unitario || item.precio || 0);
        const subtotal = Number(item.subtotal || (cantidad * precioUnitario));

        return {
            Folio: venta.folio,
            Fecha: formatDate(venta.fecha),
            Cliente: venta.cliente,
            Producto: nombre,
            Descripcion: descripcion,
            Cantidad: cantidad,
            PrecioUnitario: precioUnitario,
            SubtotalLinea: subtotal,
            MetodoPago: getMetodoPagoLabel(venta.metodo_pago),
            Estado: venta.estado,
            TotalVenta: Number(venta.total || 0)
        };
    });
}

function exportarDetallePdf() {
    if (!state.ventaDetalleActual) {
        alert("Primero abre el detalle de una venta.");
        return;
    }

    const data = getDetalleExportable(state.ventaDetalleActual);
    if (!data.length) {
        alert("La venta no tiene detalle para exportar.");
        return;
    }

    if (!(window.jspdf && window.jspdf.jsPDF)) {
        alert("No fue posible cargar la libreria PDF.");
        return;
    }

    const doc = new window.jspdf.jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    const fecha = new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short" }).format(new Date());

    doc.setFontSize(14);
    doc.text(`Detalle de Venta: ${String(state.ventaDetalleActual.folio || "-")}`, 40, 36);
    doc.setFontSize(10);
    doc.text(`Generado: ${fecha}`, 40, 54);
    doc.text(`Cliente: ${String(state.ventaDetalleActual.cliente || "Publico general")}`, 40, 68);

    const body = data.map((row) => [
        row.Producto,
        row.Descripcion,
        row.Cantidad,
        formatMoney(row.PrecioUnitario),
        formatMoney(row.SubtotalLinea)
    ]);

    doc.autoTable({
        head: [["Producto", "Descripcion", "Cantidad", "Precio unitario", "Subtotal"]],
        body,
        startY: 84,
        styles: { fontSize: 9 }
    });

    const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 20 : 120;
    doc.text(`Metodo de pago: ${getMetodoPagoLabel(state.ventaDetalleActual.metodo_pago)}`, 40, finalY);
    doc.text(`Estado: ${String(state.ventaDetalleActual.estado || "-")}`, 270, finalY);
    doc.text(`Total: ${formatMoney(state.ventaDetalleActual.total)}`, 460, finalY);

    const fileName = `venta_${String(state.ventaDetalleActual.folio || "detalle").replaceAll(" ", "_")}.pdf`;
    doc.save(fileName);
}

function getVentaById(id) {
    return state.ventas.find((venta) => String(venta.id) === String(id));
}

function abrirEdicionVenta(venta) {
    els.editVentaId.value = String(venta.id);
    els.editCliente.value = venta.cliente;
    els.editMetodoPago.value = venta.metodo_pago;
    els.editEstado.value = venta.estado;
    els.editObservaciones.value = venta.observaciones || "";

    const detalle = Array.isArray(venta.detalle) ? venta.detalle : [];
    if (!detalle.length) {
        els.editDetalleVenta.innerHTML = '<tr><td colspan="4">Sin productos para mostrar.</td></tr>';
    } else {
        els.editDetalleVenta.innerHTML = detalle.map((item) => {
            const nombre = item.nombre || item.producto || item.codigo || "Producto";
            const descripcion = item.descripcion || "Sin descripcion";
            const cantidad = Number(item.cantidad || 0);
            const precio = Number(item.precio_unitario || item.precio || 0);

            return `
                <tr>
                    <td>${escapeHtml(nombre)}</td>
                    <td>${escapeHtml(descripcion)}</td>
                    <td>${cantidad}</td>
                    <td>${formatMoney(precio)}</td>
                </tr>
            `;
        }).join("");
    }

    els.mensajeEdicion.textContent = "";
    abrirModal(els.modalEditarVenta);
}

function updateVentaLocal(id, changes) {
    const local = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    let updated = false;

    const next = local.map((item, index) => {
        const itemId = String(item.id_venta || item.id || item.id_local || `local-${index + 1}`);
        if (itemId !== String(id)) {
            return item;
        }

        updated = true;
        return { ...item, ...changes };
    });

    if (updated) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }

    return updated;
}

function deleteVentaLocal(id) {
    const local = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    const next = local.filter((item, index) => {
        const itemId = String(item.id_venta || item.id || item.id_local || `local-${index + 1}`);
        return itemId !== String(id);
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

async function guardarEdicionVenta(event) {
    event.preventDefault();

    const id = els.editVentaId.value;
    const payload = {
        cliente: els.editCliente.value.trim() || "Publico general",
        metodo_pago: els.editMetodoPago.value,
        estado: els.editEstado.value,
        observaciones: els.editObservaciones.value.trim() || null
    };

    try {
        const venta = getVentaById(id);
        if (!venta) {
            throw new Error("No se encontro la venta");
        }

        if (venta.origen === "api") {
            await requestJson(`/ventas/${id}`, {
                method: "PUT",
                body: JSON.stringify(payload)
            });
        } else if (!updateVentaLocal(id, payload)) {
            throw new Error("No se pudo actualizar la venta local");
        }

        els.mensajeEdicion.textContent = "Venta actualizada correctamente.";
        els.mensajeEdicion.style.color = "#0f766e";
        await cargarVentas();
        setTimeout(() => cerrarModal(els.modalEditarVenta), 400);
    } catch (error) {
        els.mensajeEdicion.textContent = error.message;
        els.mensajeEdicion.style.color = "#dc2626";
    }
}

async function eliminarVenta(id) {
    if (!confirm("Estas seguro de eliminar esta venta?")) {
        return;
    }

    try {
        const venta = getVentaById(id);
        if (!venta) {
            throw new Error("Venta no encontrada");
        }

        if (venta.origen === "api") {
            await requestJson(`/ventas/${id}`, { method: "DELETE" });
        } else {
            deleteVentaLocal(id);
        }

        await cargarVentas();
    } catch (error) {
        alert(error.message || "No se pudo eliminar la venta");
    }
}

function bindEventos() {
    els.buscarVenta.addEventListener("input", () => {
        state.page = 1;
        renderVentas();
    });

    els.estadoVenta.addEventListener("change", () => {
        state.page = 1;
        renderVentas();
    });

    els.filasPorPagina.addEventListener("change", () => {
        state.rowsPerPage = Number(els.filasPorPagina.value || 10);
        state.page = 1;
        renderVentas();
    });

    els.btnPrevPage.addEventListener("click", () => {
        if (state.page > 1) {
            state.page -= 1;
            renderVentas();
        }
    });

    els.btnNextPage.addEventListener("click", () => {
        const totalPages = Math.max(1, Math.ceil(getVentasFiltradas().length / state.rowsPerPage));
        if (state.page < totalPages) {
            state.page += 1;
            renderVentas();
        }
    });

    els.paginacionNumeros.addEventListener("click", (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) {
            return;
        }

        const page = Number(target.dataset.page || 0);
        if (page) {
            state.page = page;
            renderVentas();
        }
    });

    els.tablaVentasBody.addEventListener("click", (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) {
            return;
        }

        const button = target.closest("button[data-action]");
        if (!button) {
            return;
        }

        const action = button.dataset.action;
        const id = button.dataset.id;
        if (!action || !id) {
            return;
        }

        const venta = getVentaById(id);
        if (!venta) {
            return;
        }

        if (action === "ver") {
            renderDetalleVenta(venta);
        }

        if (action === "editar") {
            abrirEdicionVenta(venta);
        }

        if (action === "eliminar") {
            eliminarVenta(id);
        }
    });

    els.formEditarVenta.addEventListener("submit", guardarEdicionVenta);

    window.addEventListener("click", (event) => {
        if (event.target === els.modalDetalleVenta) {
            cerrarModal(els.modalDetalleVenta);
        }

        if (event.target === els.modalEditarVenta) {
            cerrarModal(els.modalEditarVenta);
        }
    });

    document.querySelectorAll("[data-close='detalle']").forEach((btn) => {
        btn.addEventListener("click", () => cerrarModal(els.modalDetalleVenta));
    });

    document.querySelectorAll("[data-close='editar']").forEach((btn) => {
        btn.addEventListener("click", () => cerrarModal(els.modalEditarVenta));
    });

    const btnPdf = document.getElementById("btnDetalleExportPdf");

    if (btnPdf) {
        btnPdf.addEventListener("click", exportarDetallePdf);
    }
}

(async function init() {
    bindEventos();
    await cargarUsuarioSesion();
    await cargarVentas();
})();
