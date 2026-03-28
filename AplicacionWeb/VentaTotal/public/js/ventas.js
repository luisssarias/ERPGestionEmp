const API_BASE = "http://127.0.0.1:8000/api";
const IVA_PORCENTAJE = 0.16;

const token = localStorage.getItem("token");

const buscarProductoInput = document.getElementById("buscarProducto");
const filtroCategoriaSelect = document.getElementById("filtroCategoria");
const productosGrid = document.getElementById("productosGrid");
const estadoProductos = document.getElementById("estadoProductos");

const carritoItems = document.getElementById("carritoItems");
const badgeCantidad = document.getElementById("badgeCantidad");
const subtotalEl = document.getElementById("subtotal");
const ivaEl = document.getElementById("iva");
const totalEl = document.getElementById("total");

const metodoPagoSelect = document.getElementById("metodoPago");
const clienteVentaInput = document.getElementById("clienteVenta");
const observacionesVentaInput = document.getElementById("observacionesVenta");
const btnConfirmarVenta = document.getElementById("btnConfirmarVenta");
const btnCancelarVenta = document.getElementById("btnCancelarVenta");
const mensajeVenta = document.getElementById("mensajeVenta");

const topbarUsuarioNombre = document.getElementById("topbarUsuarioNombre");
const topbarUsuarioRol = document.getElementById("topbarUsuarioRol");

let productos = [];
let carrito = [];

if (!token) {
    window.location.href = "login.html";
}

function getHeaders() {
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    };
}

function escapeHtml(value) {
    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
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

function showMensaje(texto, esError = false) {
    mensajeVenta.textContent = texto;
    mensajeVenta.style.color = esError ? "#dc2626" : "#0f766e";
}

async function cargarUsuarioSesion() {
    try {
        const response = await fetch(`${API_BASE}/me`, {
            method: "GET",
            headers: getHeaders()
        });

        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem("token");
                window.location.href = "login.html";
                return;
            }

            throw new Error("No se pudo obtener la sesión");
        }

        const usuario = await response.json();
        topbarUsuarioNombre.textContent = usuario.nombre || "Usuario";
        topbarUsuarioRol.textContent = "Administrador";
    } catch (error) {
        console.error(error);
        topbarUsuarioNombre.textContent = "Sin sesión";
        topbarUsuarioRol.textContent = "Administrador";
    }
}

function buildProductosDemo() {
    return [
        {
            id_producto: 1,
            codigo: "PROD-001",
            nombre: "Laptop Dell XPS 15",
            categoria: "Electrónica",
            precio: 25999.99,
            stock: 8,
            imagen: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600"
        },
        {
            id_producto: 2,
            codigo: "PROD-002",
            nombre: "Mouse Inalámbrico Logitech",
            categoria: "Accesorios",
            precio: 499.0,
            stock: 30,
            imagen: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600"
        },
        {
            id_producto: 3,
            codigo: "PROD-003",
            nombre: "Teclado Mecánico RGB",
            categoria: "Accesorios",
            precio: 1299.5,
            stock: 18,
            imagen: "https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=600"
        },
        {
            id_producto: 4,
            codigo: "PROD-004",
            nombre: "Monitor 27 Pulgadas",
            categoria: "Electrónica",
            precio: 4899.0,
            stock: 12,
            imagen: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600"
        },
        {
            id_producto: 5,
            codigo: "PROD-005",
            nombre: "Silla Ergonómica Oficina",
            categoria: "Mobiliario",
            precio: 3299.0,
            stock: 5,
            imagen: "https://images.unsplash.com/photo-1505843490701-5be5d32fc99b?w=600"
        }
    ];
}

function normalizarProductos(lista) {
    return (lista || []).map((item, index) => ({
        id_producto: Number(item.id_producto || item.id || index + 1),
        codigo: item.codigo || `PROD-${String(index + 1).padStart(3, "0")}`,
        nombre: item.nombre || "Producto",
        categoria: item.categoria || item.nombre_categoria || "Sin categoría",
        precio: Number(item.precio || 0),
        stock: Number(item.stock || 0),
        imagen: item.imagen || "https://images.unsplash.com/photo-1560393464-5c69a73c5770?w=600"
    }));
}

async function cargarProductos() {
    if (estadoProductos) {
        estadoProductos.textContent = "Cargando productos...";
    }

    try {
        const response = await fetch(`${API_BASE}/productos`, {
            method: "GET",
            headers: getHeaders()
        });

        if (!response.ok) {
            throw new Error("No se pudo cargar productos desde API");
        }

        const data = await response.json();
        productos = normalizarProductos(data);

        if (!productos.length) {
            productos = buildProductosDemo();
        }
    } catch (error) {
        console.warn("Usando catálogo de ejemplo:", error.message);
        productos = buildProductosDemo();
    }

    renderCategorias();
    renderProductos();
}

function renderCategorias() {
    const categorias = [...new Set(productos.map((item) => item.categoria))].sort();
    filtroCategoriaSelect.innerHTML = '<option value="">Todas las Categorías</option>';

    categorias.forEach((categoria) => {
        const option = document.createElement("option");
        option.value = categoria;
        option.textContent = categoria;
        filtroCategoriaSelect.appendChild(option);
    });
}

function obtenerProductosFiltrados() {
    const texto = buscarProductoInput.value.trim().toLowerCase();
    const categoria = filtroCategoriaSelect.value;

    return productos.filter((producto) => {
        const coincideTexto = !texto
            || producto.nombre.toLowerCase().includes(texto)
            || producto.codigo.toLowerCase().includes(texto);

        const coincideCategoria = !categoria || producto.categoria === categoria;
        return coincideTexto && coincideCategoria;
    });
}

function renderProductos() {
    const filtrados = obtenerProductosFiltrados();

    if (!filtrados.length) {
        productosGrid.innerHTML = '<p class="estado">No hay productos que coincidan con la búsqueda.</p>';
        return;
    }

    productosGrid.innerHTML = filtrados.map((producto) => {
        const stockDisponible = Number(producto.stock) > 0;

        return `
            <article class="producto-card">
                <img src="${escapeHtml(producto.imagen)}" alt="${escapeHtml(producto.nombre)}">
                <h4>${escapeHtml(producto.nombre)}</h4>
                <span class="categoria">${escapeHtml(producto.categoria)}</span>
                <div class="precio-stock">
                    <span class="precio">${formatMoney(producto.precio)}</span>
                    <span class="stock">Stock: ${producto.stock}</span>
                </div>
                <button class="btn-agregar" data-id="${producto.id_producto}" ${stockDisponible ? "" : "disabled"}>
                    <i class="fa-solid fa-cart-plus"></i>
                    ${stockDisponible ? "Agregar" : "Sin stock"}
                </button>
            </article>
        `;
    }).join("");
}

function calcularTotales() {
    const subtotal = carrito.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
    const iva = subtotal * IVA_PORCENTAJE;
    const total = subtotal + iva;

    return {
        subtotal,
        iva,
        total
    };
}

function renderCarrito() {
    if (!carrito.length) {
        carritoItems.innerHTML = `
            <div class="carrito-vacio">
                <i class="fa-solid fa-cart-shopping"></i>
                <p>El carrito está vacío</p>
            </div>
        `;
    } else {
        carritoItems.innerHTML = carrito.map((item) => {
            const subtotalItem = item.precio * item.cantidad;

            return `
                <div class="item-carrito">
                    <div class="item-head">
                        <div>
                            <p class="item-nombre">${escapeHtml(item.nombre)}</p>
                            <p class="item-precio">${formatMoney(item.precio)} c/u</p>
                        </div>
                        <strong>${formatMoney(subtotalItem)}</strong>
                    </div>
                    <div class="item-acciones">
                        <div class="cantidad">
                            <button type="button" data-action="restar" data-id="${item.id_producto}">-</button>
                            <span>${item.cantidad}</span>
                            <button type="button" data-action="sumar" data-id="${item.id_producto}">+</button>
                        </div>
                        <button class="eliminar-item" type="button" data-action="eliminar" data-id="${item.id_producto}">Eliminar</button>
                    </div>
                </div>
            `;
        }).join("");
    }

    const cantidadTotal = carrito.reduce((acc, item) => acc + item.cantidad, 0);
    const { subtotal, iva, total } = calcularTotales();

    badgeCantidad.textContent = String(cantidadTotal);
    subtotalEl.textContent = formatMoney(subtotal);
    ivaEl.textContent = formatMoney(iva);
    totalEl.textContent = formatMoney(total);
}

function agregarAlCarrito(idProducto) {
    const producto = productos.find((item) => Number(item.id_producto) === Number(idProducto));

    if (!producto || producto.stock <= 0) {
        return;
    }

    const existente = carrito.find((item) => Number(item.id_producto) === Number(idProducto));

    if (existente) {
        if (existente.cantidad >= producto.stock) {
            showMensaje("No hay más stock disponible para este producto.", true);
            return;
        }

        existente.cantidad += 1;
    } else {
        carrito.push({
            id_producto: producto.id_producto,
            codigo: producto.codigo,
            nombre: producto.nombre,
            precio: producto.precio,
            cantidad: 1
        });
    }

    showMensaje("Producto agregado al carrito.");
    renderCarrito();
}

function cambiarCantidad(idProducto, accion) {
    const item = carrito.find((row) => Number(row.id_producto) === Number(idProducto));
    const producto = productos.find((row) => Number(row.id_producto) === Number(idProducto));

    if (!item || !producto) {
        return;
    }

    if (accion === "sumar") {
        if (item.cantidad < producto.stock) {
            item.cantidad += 1;
        } else {
            showMensaje("Límite de stock alcanzado.", true);
        }
    }

    if (accion === "restar") {
        item.cantidad -= 1;
        if (item.cantidad <= 0) {
            carrito = carrito.filter((row) => Number(row.id_producto) !== Number(idProducto));
        }
    }

    if (accion === "eliminar") {
        carrito = carrito.filter((row) => Number(row.id_producto) !== Number(idProducto));
    }

    renderCarrito();
}

function limpiarVenta() {
    carrito = [];
    metodoPagoSelect.value = "efectivo";
    clienteVentaInput.value = "";
    observacionesVentaInput.value = "";
    showMensaje("");
    renderCarrito();
}

function buildPayloadVenta() {
    const { subtotal, iva, total } = calcularTotales();

    return {
        cliente: clienteVentaInput.value.trim() || null,
        metodo_pago: metodoPagoSelect.value,
        observaciones: observacionesVentaInput.value.trim() || null,
        subtotal: Number(subtotal.toFixed(2)),
        impuesto: Number(iva.toFixed(2)),
        total: Number(total.toFixed(2)),
        detalle: carrito.map((item) => ({
            id_producto: item.id_producto,
            codigo: item.codigo,
            cantidad: item.cantidad,
            precio_unitario: Number(item.precio.toFixed(2)),
            subtotal: Number((item.cantidad * item.precio).toFixed(2))
        }))
    };
}

function guardarVentaPendiente(payload) {
    const key = "ventas_pendientes";
    const existentes = JSON.parse(localStorage.getItem(key) || "[]");

    existentes.push({
        ...payload,
        fecha_local: new Date().toISOString()
    });

    localStorage.setItem(key, JSON.stringify(existentes));
}

async function confirmarVenta() {
    if (!carrito.length) {
        showMensaje("Debes agregar al menos un producto para confirmar la venta.", true);
        return;
    }

    btnConfirmarVenta.disabled = true;
    showMensaje("Procesando venta...");

    const payload = buildPayloadVenta();

    try {
        const response = await fetch(`${API_BASE}/ventas`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error("La API de ventas no está disponible");
        }

        showMensaje("Venta registrada correctamente.");
    } catch (error) {
        console.warn(error.message);
        guardarVentaPendiente(payload);
        showMensaje("No se pudo guardar en API. Se guardó como venta pendiente local.", true);
    } finally {
        productos.forEach((producto) => {
            const item = carrito.find((row) => Number(row.id_producto) === Number(producto.id_producto));
            if (item) {
                producto.stock = Math.max(0, producto.stock - item.cantidad);
            }
        });

        limpiarVenta();
        renderProductos();
        btnConfirmarVenta.disabled = false;
    }
}

productosGrid.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
        return;
    }

    const button = target.closest("button.btn-agregar");
    if (!button) {
        return;
    }

    agregarAlCarrito(button.dataset.id);
});

carritoItems.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
        return;
    }

    const action = target.dataset.action;
    const id = target.dataset.id;

    if (!action || !id) {
        return;
    }

    cambiarCantidad(id, action);
});

buscarProductoInput.addEventListener("input", renderProductos);
filtroCategoriaSelect.addEventListener("change", renderProductos);
btnConfirmarVenta.addEventListener("click", confirmarVenta);
btnCancelarVenta.addEventListener("click", limpiarVenta);

(async function init() {
    await cargarUsuarioSesion();
    await cargarProductos();
    renderCarrito();
})();
