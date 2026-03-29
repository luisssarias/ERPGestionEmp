const ventaFolio = document.getElementById("ventaFolio");
const ventaFecha = document.getElementById("ventaFecha");
const ventaCliente = document.getElementById("ventaCliente");
const ventaMetodo = document.getElementById("ventaMetodo");
const ventaTotal = document.getElementById("ventaTotal");
const infoWarning = document.getElementById("infoWarning");

const form = document.getElementById("facturacionForm");
const mensajeForm = document.getElementById("mensajeForm");
const previewPayload = document.getElementById("previewPayload");
const btnLimpiar = document.getElementById("btnLimpiar");

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

function getVentaIdDesdeUrl() {
    const params = new URLSearchParams(window.location.search);
    return Number(params.get("ventaId") || 0);
}

function normalizarVenta(data) {
    return {
        id: Number(data.id_venta),
        folio: data.folio,
        fecha: data.fecha_venta,
        cliente: data.cliente,
        metodo: data.metodo_pago,
        total: Number(data.total || 0)
    };
}

async function cargarVenta(ventaId) {
    const response = await fetch(`${API_BASE}/ventas/${ventaId}`, {
        method: "GET",
        headers: getHeaders()
    });

    if (response.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "login.html";
        return null;
    }

    if (!response.ok) {
        return null;
    }

    const data = await response.json();
    return normalizarVenta(data);
}

async function cargarFacturaExistente(ventaId) {
    const response = await fetch(`${API_BASE}/facturas/venta/${ventaId}`, {
        method: "GET",
        headers: getHeaders()
    });

    if (response.status === 404) {
        return null;
    }

    if (!response.ok) {
        console.error("No se pudo obtener factura existente");
        return null;
    }

    return response.json();
}

function pintarVenta(venta) {
    if (!venta) {
        ventaFolio.textContent = "No encontrada";
        ventaFecha.textContent = "-";
        ventaCliente.textContent = "-";
        ventaMetodo.textContent = "-";
        ventaTotal.textContent = "-";
        infoWarning.textContent = "No hay una venta seleccionada. Regresa a la lista y elige una venta para facturar.";
        return;
    }

    ventaFolio.textContent = venta.folio;
    ventaFecha.textContent = venta.fecha;
    ventaCliente.textContent = venta.cliente;
    ventaMetodo.textContent = venta.metodo;
    ventaTotal.textContent = formatMoney(venta.total);
    infoWarning.textContent = "";
}

function validarRFC(rfc) {
    return /^([A-Z&]{3,4})(\d{6})([A-Z0-9]{3})$/.test(String(rfc || "").toUpperCase());
}

function validarCodigoPostal(cp) {
    return /^\d{5}$/.test(String(cp || ""));
}

function setMensaje(texto, isError = false) {
    mensajeForm.textContent = texto;
    mensajeForm.className = `mensaje ${isError ? "error" : "ok"}`;
}

function construirPayload(venta) {
    const data = new FormData(form);

    return {
        id_venta: venta?.id || null,
        rfc: String(data.get("rfc") || "").toUpperCase().trim(),
        razon_social: String(data.get("razonSocial") || "").trim(),
        regimen_fiscal: String(data.get("regimenFiscal") || "").trim(),
        uso_cfdi: String(data.get("usoCfdi") || "").trim(),
        email_envio: String(data.get("email") || "").trim(),
        codigo_postal: String(data.get("codigoPostal") || "").trim(),
        comentarios: String(data.get("comentarios") || "").trim()
    };
}

function validarPayload(payload) {
    if (!payload.id_venta) {
        return "Selecciona una venta antes de guardar datos de facturacion.";
    }

    if (!validarRFC(payload.rfc)) {
        return "RFC invalido. Formato esperado: ABC123456XYZ.";
    }

    if (!payload.razon_social) {
        return "La razon social es obligatoria.";
    }

    if (!payload.regimen_fiscal) {
        return "Selecciona un regimen fiscal.";
    }

    if (!payload.uso_cfdi) {
        return "Selecciona un uso CFDI.";
    }

    if (!payload.email_envio || !payload.email_envio.includes("@")) {
        return "Ingresa un email valido para envio de factura.";
    }

    if (!validarCodigoPostal(payload.codigo_postal)) {
        return "Codigo postal invalido. Debe tener 5 digitos.";
    }

    return "";
}

function llenarFormularioDesdeFactura(factura) {
    if (!factura) {
        return;
    }

    document.getElementById("rfc").value = factura.rfc || "";
    document.getElementById("razonSocial").value = factura.razon_social || "";
    document.getElementById("regimenFiscal").value = factura.regimen_fiscal || "";
    document.getElementById("usoCfdi").value = factura.uso_cfdi || "";
    document.getElementById("email").value = factura.email_envio || "";
    document.getElementById("codigoPostal").value = factura.codigo_postal || "";
    document.getElementById("comentarios").value = factura.comentarios || "";
}

function mostrarResultadoFactura(factura) {
    previewPayload.hidden = false;
    const cacheBuster = `t=${Date.now()}`;
    const pdfUrl = `${factura.pdf_url}${factura.pdf_url.includes("?") ? "&" : "?"}${cacheBuster}`;
    const xmlUrl = `${factura.xml_url}${factura.xml_url.includes("?") ? "&" : "?"}${cacheBuster}`;
    previewPayload.innerHTML = [
        `Factura guardada: ${factura.folio_factura}`,
        `Subtotal: ${formatMoney(factura.subtotal)}`,
        `IVA: ${formatMoney(factura.iva)}`,
        `Total: ${formatMoney(factura.total)}`,
        `<a href="${pdfUrl}" target="_blank" rel="noopener noreferrer">Abrir PDF en nueva pestana</a>`,
        `<a href="${xmlUrl}" target="_blank" rel="noopener noreferrer">Abrir XML simulado</a>`
    ].join("<br>");
}

let ventaActiva = null;

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const payload = construirPayload(ventaActiva);
    const error = validarPayload(payload);

    if (error) {
        previewPayload.hidden = true;
        setMensaje(error, true);
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/facturas`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify(payload)
        });

        if (response.status === 401) {
            localStorage.removeItem("token");
            window.location.href = "login.html";
            return;
        }

        const data = await response.json();
        if (!response.ok) {
            const msg = data?.message || "No se pudo generar la factura.";
            setMensaje(msg, true);
            previewPayload.hidden = true;
            return;
        }

        setMensaje("Factura generada correctamente (XML simulado y PDF).", false);
        mostrarResultadoFactura(data);
    } catch (submitError) {
        console.error(submitError);
        setMensaje("Error de conexion al guardar factura.", true);
        previewPayload.hidden = true;
    }
});

btnLimpiar.addEventListener("click", () => {
    form.reset();
    setMensaje("");
    previewPayload.hidden = true;
    previewPayload.innerHTML = "";
});

async function init() {
    const ventaId = getVentaIdDesdeUrl();

    if (!ventaId) {
        pintarVenta(null);
        return;
    }

    ventaActiva = await cargarVenta(ventaId);
    pintarVenta(ventaActiva);

    if (!ventaActiva) {
        return;
    }

    const facturaExistente = await cargarFacturaExistente(ventaId);
    if (facturaExistente) {
        llenarFormularioDesdeFactura(facturaExistente);
        setMensaje("Esta venta ya tiene factura. Puedes editar datos y regenerar XML/PDF.");
        mostrarResultadoFactura(facturaExistente);
    }
}

init();
