const tablaBody = document.getElementById("tablaFacturacionBody");
const resumen = document.getElementById("resumen");
const buscarVenta = document.getElementById("buscarVenta");
const estadoVenta = document.getElementById("estadoVenta");
const btnRecargar = document.getElementById("btnRecargar");

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

let ventas = [];
let facturasByVenta = {};

function getHeaders() {
    return {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    };
}

function formatMoney(value) {
    return new Intl.NumberFormat("es-MX", {
        style: "currency",
        currency: "MXN"
    }).format(Number(value || 0));
}

function normalizarTexto(value) {
    return String(value || "").trim().toLowerCase();
}

function escapeHtml(value) {
    return String(value || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function normalizarVenta(item) {
    return {
        id: Number(item.id_venta),
        folio: item.folio || "-",
        fecha: item.fecha_venta ? String(item.fecha_venta).slice(0, 10) : "-",
        cliente: item.cliente || "Publico general",
        metodo: item.metodo_pago || "-",
        total: Number(item.total || 0),
        estado: item.estado || "pendiente",
        factura: item.factura || null
    };
}

async function cargarDatos() {
    tablaBody.innerHTML = '<tr><td class="estado" colspan="7">Cargando ventas...</td></tr>';

    try {
        const [ventasResponse, facturasResponse] = await Promise.all([
            fetch(`${API_BASE}/ventas`, { method: "GET", headers: getHeaders() }),
            fetch(`${API_BASE}/facturas`, { method: "GET", headers: getHeaders() })
        ]);

        if (ventasResponse.status === 401 || facturasResponse.status === 401) {
            localStorage.removeItem("token");
            window.location.href = "login.html";
            return;
        }

        if (!ventasResponse.ok || !facturasResponse.ok) {
            throw new Error("No se pudieron cargar ventas/facturas");
        }

        const ventasData = await ventasResponse.json();
        const facturasData = await facturasResponse.json();

        ventas = (ventasData || []).map(normalizarVenta);
        facturasByVenta = {};

        (facturasData || []).forEach((factura) => {
            facturasByVenta[Number(factura.id_venta)] = factura;
        });

        renderTabla();
    } catch (error) {
        console.error(error);
        tablaBody.innerHTML = '<tr><td class="estado" colspan="7">Error al cargar informacion de facturacion.</td></tr>';
        resumen.textContent = "No se pudo cargar la informacion.";
    }
}

function obtenerFiltradas() {
    const texto = normalizarTexto(buscarVenta.value);
    const estado = normalizarTexto(estadoVenta.value);

    return ventas.filter((venta) => {
        const coincideTexto = !texto
            || normalizarTexto(venta.folio).includes(texto)
            || normalizarTexto(venta.cliente).includes(texto);

        const coincideEstado = !estado || normalizarTexto(venta.estado) === estado;
        return coincideTexto && coincideEstado;
    });
}

function renderTabla() {
    const lista = obtenerFiltradas();

    if (!lista.length) {
        tablaBody.innerHTML = '<tr><td class="estado" colspan="7">No hay ventas para mostrar.</td></tr>';
        resumen.textContent = "0 ventas disponibles para facturacion.";
        return;
    }

    tablaBody.innerHTML = lista.map((venta) => {
        const factura = facturasByVenta[venta.id] || venta.factura;
        const etiquetaBoton = factura ? "Editar factura" : "Facturar";

        return `
            <tr>
                <td>${escapeHtml(venta.folio)}</td>
                <td>${escapeHtml(venta.fecha)}</td>
                <td>${escapeHtml(venta.cliente)}</td>
                <td>${escapeHtml(venta.metodo)}</td>
                <td>${formatMoney(venta.total)}</td>
                <td><span class="badge ${escapeHtml(venta.estado)}">${escapeHtml(venta.estado)}</span></td>
                <td>
                    <div class="acciones">
                        <button class="btn-facturar" type="button" data-action="facturar" data-venta-id="${venta.id}">
                            <i class="fa-solid fa-file-invoice"></i> ${etiquetaBoton}
                        </button>
                        ${factura ? `
                            <button class="btn-secondary-action" type="button" data-action="descargar" data-factura-id="${factura.id_factura}" data-folio="${escapeHtml(factura.folio_factura || "factura")}">
                                <i class="fa-solid fa-file-pdf"></i> PDF
                            </button>
                            <button class="btn-secondary-action" type="button" data-action="reenviar" data-factura-id="${factura.id_factura}">
                                <i class="fa-solid fa-paper-plane"></i> Reenviar
                            </button>
                        ` : ""}
                    </div>
                </td>
            </tr>
        `;
    }).join("");

    resumen.textContent = `${lista.length} venta(s) disponible(s) para facturacion.`;
}

function irAFormulario(idVenta) {
    const venta = ventas.find((item) => Number(item.id) === Number(idVenta));

    if (!venta) {
        return;
    }

    localStorage.setItem("facturacionVentaSeleccionada", JSON.stringify(venta));
    window.location.href = `facturacion-form.html?ventaId=${encodeURIComponent(venta.id)}`;
}

async function descargarFactura(idFactura, folio = "factura") {
    try {
        const response = await fetch(`${API_BASE}/facturas/${idFactura}/pdf`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error("No se pudo descargar el PDF");
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${folio}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error(error);
        alert("No fue posible descargar el PDF de la factura.");
    }
}

async function reenviarFactura(idFactura) {
    try {
        const response = await fetch(`${API_BASE}/facturas/${idFactura}/reenviar`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify({})
        });

        if (!response.ok) {
            throw new Error("No se pudo reenviar la factura");
        }

        const data = await response.json();
        alert(`${data.message} Destino: ${data.email}`);
        await cargarDatos();
    } catch (error) {
        console.error(error);
        alert("No fue posible reenviar la factura.");
    }
}

buscarVenta.addEventListener("input", renderTabla);
estadoVenta.addEventListener("change", renderTabla);
btnRecargar.addEventListener("click", cargarDatos);

tablaBody.addEventListener("click", (event) => {
    const button = event.target.closest("button");

    if (!button) {
        return;
    }

    const action = button.dataset.action;

    if (action === "facturar") {
        irAFormulario(button.dataset.ventaId);
        return;
    }

    if (action === "descargar") {
        descargarFactura(button.dataset.facturaId, button.dataset.folio);
        return;
    }

    if (action === "reenviar") {
        reenviarFactura(button.dataset.facturaId);
    }
});

cargarDatos();
