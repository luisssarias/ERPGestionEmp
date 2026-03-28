const getApiBaseUrl = () => {
    const protocol = window.location.protocol;
    const host = window.location.host.split(":")[0];
    return `${protocol}//${host}:8000/api`;
};

const API_BASE = getApiBaseUrl();
const token = localStorage.getItem("token");

if (!token) {
    window.location.href = "login.html";
}

const state = {
    productos: []
};

const DEBUG_LOGS = true;

function debugLog(...args) {
    if (DEBUG_LOGS) {
        console.log("[PRODUCTOS]", ...args);
    }
}

const els = {
    buscar: document.getElementById("buscarProducto"),
    filtroCategoria: document.getElementById("filtroCategoria"),
    filtroEstado: document.getElementById("filtroEstado"),
    tablaBody: document.getElementById("tablaProductosBody"),
    totalProductos: document.getElementById("statTotalProductos"),
    stockBajo: document.getElementById("statStockBajo"),
    topbarUsuarioNombre: document.getElementById("topbarUsuarioNombre"),
    topbarUsuarioRol: document.getElementById("topbarUsuarioRol"),
    btnNuevoProducto: document.getElementById("btnNuevoProducto"),
    modalProducto: document.getElementById("modalProducto"),
    cerrarModal: document.getElementById("cerrarModal"),
    btnCategoria: document.getElementById("btnCategoria"),
    modalCategoria: document.getElementById("modalCategoria"),
    cerrarCategoria: document.getElementById("cerrarCategoria")
};

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

function getEstadoProducto(stock) {
    const n = Number(stock || 0);

    if (n <= 0) {
        return { key: "sin_stock", text: "Sin stock" };
    }

    if (n <= 5) {
        return { key: "stock_bajo", text: "Stock bajo" };
    }

    return { key: "activo", text: "Activo" };
}

function normalizarProductos(data) {
    return (Array.isArray(data) ? data : []).map((item, index) => ({
        id_producto: Number(item.id_producto || index + 1),
        codigo: item.codigo || `PROD-${String(index + 1).padStart(3, "0")}`,
        nombre: item.nombre || "Producto",
        categoria: item.categoria || "Sin categoria",
        precio: Number(item.precio || 0),
        stock: Number(item.stock || 0),
        imagen: item.imagen || "https://placehold.co/96x64?text=Sin+Imagen"
    }));
}

async function cargarUsuarioSesion() {
    try {
        debugLog("Solicitando sesion:", `${API_BASE}/me`);
        const res = await fetch(`${API_BASE}/me`, { headers: getHeaders() });
        debugLog("Respuesta /me:", res.status, res.statusText);

        if (res.status === 401) {
            localStorage.removeItem("token");
            window.location.href = "login.html";
            return;
        }

        if (!res.ok) {
            throw new Error("No se pudo obtener la sesion");
        }

        const user = await res.json();
        debugLog("Usuario en sesion:", user);
        els.topbarUsuarioNombre.textContent = user.nombre || "Usuario";
        els.topbarUsuarioRol.textContent = "Administrador";
    } catch (error) {
        console.error("[PRODUCTOS] Error al cargar sesion:", error);
        els.topbarUsuarioNombre.textContent = "Sin sesion";
        els.topbarUsuarioRol.textContent = "Administrador";
    }
}

async function cargarProductos() {
    try {
        debugLog("Solicitando productos:", `${API_BASE}/productos`);
        const res = await fetch(`${API_BASE}/productos`, { headers: getHeaders() });
        debugLog("Respuesta /productos:", res.status, res.statusText);

        if (res.status === 401) {
            localStorage.removeItem("token");
            window.location.href = "login.html";
            return;
        }

        if (!res.ok) {
            throw new Error("No se pudo obtener productos");
        }

        const data = await res.json();
        debugLog("Datos crudos /productos (array):", Array.isArray(data), "cantidad:", Array.isArray(data) ? data.length : 0);
        if (Array.isArray(data) && data.length) {
            debugLog("Primer producto crudo:", data[0]);
        }
        state.productos = normalizarProductos(data);
        debugLog("Productos normalizados:", state.productos.length);
    } catch (error) {
        console.error("[PRODUCTOS] Error al cargar productos:", error);
        state.productos = [];
    }

    renderCategorias();
    renderProductos();
}

function renderCategorias() {
    const categorias = [...new Set(state.productos.map((p) => p.categoria))].sort((a, b) => a.localeCompare(b));

    els.filtroCategoria.innerHTML = '<option value="">Todas las Categorías</option>';
    categorias.forEach((categoria) => {
        const option = document.createElement("option");
        option.value = categoria;
        option.textContent = categoria;
        els.filtroCategoria.appendChild(option);
    });
}

function obtenerProductosFiltrados() {
    const texto = (els.buscar.value || "").trim().toLowerCase();
    const categoria = els.filtroCategoria.value;
    const estado = els.filtroEstado.value;

    return state.productos.filter((producto) => {
        const e = getEstadoProducto(producto.stock).key;
        const matchTexto = !texto
            || producto.nombre.toLowerCase().includes(texto)
            || producto.codigo.toLowerCase().includes(texto);
        const matchCategoria = !categoria || producto.categoria === categoria;
        const matchEstado = !estado || e === estado;

        return matchTexto && matchCategoria && matchEstado;
    });
}

function renderStats(lista) {
    els.totalProductos.textContent = String(lista.length);
    els.stockBajo.textContent = String(lista.filter((p) => Number(p.stock) > 0 && Number(p.stock) <= 5).length);
}

function renderProductos() {
    const lista = obtenerProductosFiltrados();
    debugLog("Render productos filtrados:", lista.length);
    renderStats(lista);

    if (!lista.length) {
        els.tablaBody.innerHTML = '<tr><td colspan="8">No hay productos registrados en la BD.</td></tr>';
        return;
    }

    els.tablaBody.innerHTML = lista.map((p) => {
        const estado = getEstadoProducto(p.stock);

        return `
            <tr>
                <td><img src="${escapeHtml(p.imagen)}" alt="${escapeHtml(p.nombre)}" width="56"></td>
                <td>${escapeHtml(p.codigo)}</td>
                <td>${escapeHtml(p.nombre)}</td>
                <td><span class="categoria">${escapeHtml(p.categoria)}</span></td>
                <td>${formatMoney(p.precio)}</td>
                <td><span class="stock">${p.stock}</span></td>
                <td><span class="estado ${estado.key === "activo" ? "activo" : "inactivo"}">${estado.text}</span></td>
                <td class="acciones">-</td>
            </tr>
        `;
    }).join("");
}

function bindEventos() {
    els.buscar.addEventListener("input", renderProductos);
    els.filtroCategoria.addEventListener("change", renderProductos);
    els.filtroEstado.addEventListener("change", renderProductos);

    // Mantener comportamiento de los modales existentes.
    els.btnNuevoProducto.addEventListener("click", () => {
        els.modalProducto.style.display = "flex";
    });

    els.cerrarModal.addEventListener("click", () => {
        els.modalProducto.style.display = "none";
    });

    els.btnCategoria.addEventListener("click", () => {
        els.modalCategoria.style.display = "flex";
    });

    els.cerrarCategoria.addEventListener("click", () => {
        els.modalCategoria.style.display = "none";
    });
}

(async function init() {
    bindEventos();
    await cargarUsuarioSesion();
    await cargarProductos();
})();
