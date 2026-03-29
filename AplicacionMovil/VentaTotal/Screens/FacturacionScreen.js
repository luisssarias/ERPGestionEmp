import { useEffect, useMemo, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { apiRequest } from "../config/api";
import { getStoredToken } from "../utils/authStorage";

export default function FacturacionScreen() {
  const [filtro, setFiltro] = useState("");
  const [regimenFiscal, setRegimenFiscal] = useState("601");
  const [usoCfdi, setUsoCfdi] = useState("G03");
  const [rfc, setRfc] = useState("");
  const [razonSocial, setRazonSocial] = useState("");
  const [emailEnvio, setEmailEnvio] = useState("");
  const [codigoPostal, setCodigoPostal] = useState("");
  const [comentarios, setComentarios] = useState("");

  const [ventas, setVentas] = useState([]);
  const [facturasByVenta, setFacturasByVenta] = useState({});
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    setLoading(true);
    setMensaje("");

    try {
      const token = await getStoredToken();
      const [ventasResponse, facturasResponse] = await Promise.all([
        apiRequest("/api/ventas", {
          method: "GET",
          headers: {
            "Accept": "application/json",
            "Authorization": `Bearer ${token}`
          }
        }),
        apiRequest("/api/facturas", {
          method: "GET",
          headers: {
            "Accept": "application/json",
            "Authorization": `Bearer ${token}`
          }
        })
      ]);

      if (!ventasResponse.ok || !facturasResponse.ok) {
        throw new Error("No se pudo cargar ventas o facturas");
      }

      const ventasData = await ventasResponse.json();
      const facturasData = await facturasResponse.json();

      const ventasNormalizadas = (ventasData || []).map((item) => ({
        id: Number(item.id_venta),
        folio: item.folio || "-",
        fecha: String(item.fecha_venta || "").slice(0, 10) || "-",
        cliente: item.cliente || "Publico general",
        total: Number(item.total || 0),
        estado: String(item.estado || "pendiente"),
        factura: item.factura || null
      }));

      const mapaFacturas = {};
      (facturasData || []).forEach((factura) => {
        mapaFacturas[Number(factura.id_venta)] = factura;
      });

      setVentas(ventasNormalizadas);
      setFacturasByVenta(mapaFacturas);

      if (ventasNormalizadas.length > 0) {
        setVentaSeleccionada(ventasNormalizadas[0]);
      }
    } catch (error) {
      setMensaje("No se pudo cargar informacion de facturacion.");
    } finally {
      setLoading(false);
    }
  }

  function validarFormulario() {
    const rfcOk = /^([A-Z&]{3,4})(\d{6})([A-Z0-9]{3})$/.test(String(rfc || "").toUpperCase());
    const cpOk = /^\d{5}$/.test(String(codigoPostal || ""));

    if (!ventaSeleccionada?.id) {
      return "Selecciona una venta.";
    }

    if (!rfcOk) {
      return "RFC invalido. Ejemplo: ABC123456XYZ";
    }

    if (!razonSocial.trim()) {
      return "La razon social es obligatoria.";
    }

    if (!emailEnvio.includes("@")) {
      return "Correo de envio invalido.";
    }

    if (!cpOk) {
      return "Codigo postal invalido (5 digitos).";
    }

    return "";
  }

  async function generarFactura() {
    const error = validarFormulario();
    if (error) {
      setMensaje(error);
      return;
    }

    setGuardando(true);
    setMensaje("Generando factura...");

    try {
      const token = await getStoredToken();
      const payload = {
        id_venta: ventaSeleccionada.id,
        rfc: rfc.trim().toUpperCase(),
        razon_social: razonSocial.trim(),
        regimen_fiscal: regimenFiscal,
        uso_cfdi: usoCfdi,
        codigo_postal: codigoPostal.trim(),
        email_envio: emailEnvio.trim(),
        comentarios: comentarios.trim() || null
      };

      const response = await apiRequest("/api/facturas", {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "No se pudo generar la factura.");
      }

      setFacturasByVenta((actual) => ({
        ...actual,
        [ventaSeleccionada.id]: data
      }));

      setMensaje(`Factura generada: ${data.folio_factura}`);

      if (data?.pdf_url) {
        Alert.alert(
          "Factura generada",
          `Folio: ${data.folio_factura}`,
          [
            {
              text: "Abrir PDF",
              onPress: () => Linking.openURL(data.pdf_url)
            },
            { text: "Cerrar", style: "cancel" }
          ]
        );
      }
    } catch (error) {
      setMensaje(error.message || "Error de conexion al generar factura.");
    } finally {
      setGuardando(false);
    }
  }

  const ventasFiltradas = useMemo(() => {
    return ventas.filter(
      (v) =>
        v.folio.toLowerCase().includes(filtro.toLowerCase()) ||
        v.cliente.toLowerCase().includes(filtro.toLowerCase())
    );
  }, [filtro, ventas]);

  const facturaSeleccionada = ventaSeleccionada ? facturasByVenta[ventaSeleccionada.id] || ventaSeleccionada.factura : null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topbar}>
        <Text style={styles.topbarTitle}>Facturacion</Text>
        <View style={styles.avatar}>
          <Ionicons name="document-text-outline" size={18} color="#ffffff" />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.pageHeader}>
          <Text style={styles.title}>Lista de Ventas para Facturar</Text>
          <Text style={styles.subtitle}>Selecciona una venta y genera su comprobante fiscal</Text>
        </View>

        <TouchableOpacity style={styles.refreshBtn} onPress={cargarDatos}>
          <Ionicons name="refresh-outline" size={16} color="#0f766e" />
          <Text style={styles.refreshText}>Recargar</Text>
        </TouchableOpacity>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Busqueda</Text>
          <View style={styles.search}>
            <Ionicons name="search-outline" size={18} color="#6b7280" />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por folio o cliente"
              placeholderTextColor="#9ca3af"
              value={filtro}
              onChangeText={setFiltro}
            />
          </View>

          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="small" color="#0f766e" />
              <Text style={styles.emptyText}>Cargando ventas...</Text>
            </View>
          ) : null}

          {!loading && ventasFiltradas.length === 0 ? (
            <Text style={styles.emptyText}>No hay ventas para mostrar.</Text>
          ) : (
            ventasFiltradas.map((venta) => (
              <TouchableOpacity
                key={venta.id}
                style={[styles.saleRow, ventaSeleccionada?.id === venta.id && styles.saleRowActive]}
                onPress={() => setVentaSeleccionada(venta)}
              >
                <View>
                  <Text style={styles.folio}>{venta.folio}</Text>
                  <Text style={styles.meta}>{venta.fecha} - {venta.cliente}</Text>
                </View>
                <View style={styles.saleRight}>
                  <Text style={styles.total}>${venta.total.toFixed(2)}</Text>
                  <Text style={[styles.estado, venta.estado === "completada" ? styles.ok : styles.pending]}>
                    {venta.estado}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Datos Fiscales</Text>

          <Text style={styles.label}>RFC</Text>
          <TextInput
            style={styles.input}
            value={rfc}
            onChangeText={setRfc}
            autoCapitalize="characters"
            placeholder="ABC123456XYZ"
            placeholderTextColor="#9ca3af"
          />

          <Text style={styles.label}>Razon social</Text>
          <TextInput
            style={styles.input}
            value={razonSocial}
            onChangeText={setRazonSocial}
            placeholder="Nombre o empresa"
            placeholderTextColor="#9ca3af"
          />

          <Text style={styles.label}>Regimen fiscal</Text>
          <View style={styles.rowButtons}>
            {["601", "612", "626"].map((regimen) => (
              <TouchableOpacity
                key={regimen}
                style={[styles.optionButton, regimenFiscal === regimen && styles.optionButtonActive]}
                onPress={() => setRegimenFiscal(regimen)}
              >
                <Text style={[styles.optionText, regimenFiscal === regimen && styles.optionTextActive]}>{regimen}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Uso CFDI</Text>
          <View style={styles.rowButtons}>
            {["G01", "G03", "P01"].map((u) => (
              <TouchableOpacity
                key={u}
                style={[styles.optionButton, usoCfdi === u && styles.optionButtonActive]}
                onPress={() => setUsoCfdi(u)}
              >
                <Text style={[styles.optionText, usoCfdi === u && styles.optionTextActive]}>{u}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Correo envio</Text>
          <TextInput
            style={styles.input}
            value={emailEnvio}
            onChangeText={setEmailEnvio}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="cliente@email.com"
            placeholderTextColor="#9ca3af"
          />

          <Text style={styles.label}>Codigo postal</Text>
          <TextInput
            style={styles.input}
            value={codigoPostal}
            onChangeText={setCodigoPostal}
            keyboardType="number-pad"
            maxLength={5}
            placeholder="00000"
            placeholderTextColor="#9ca3af"
          />

          <Text style={styles.label}>Comentarios</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={comentarios}
            onChangeText={setComentarios}
            placeholder="Notas adicionales"
            placeholderTextColor="#9ca3af"
            multiline
            textAlignVertical="top"
          />

          <TouchableOpacity style={styles.generateButton} onPress={generarFactura} disabled={guardando || loading}>
            <Ionicons name="receipt-outline" size={16} color="#ffffff" />
            <Text style={styles.generateText}>{guardando ? "Generando..." : "Generar Factura"}</Text>
          </TouchableOpacity>

          {facturaSeleccionada ? (
            <Text style={styles.generatedInfo}>Factura actual: {facturaSeleccionada.folio_factura}</Text>
          ) : null}

          {mensaje ? <Text style={styles.mensaje}>{mensaje}</Text> : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f6fb" },

  topbar: {
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },

  topbarTitle: { fontSize: 20, fontWeight: "700", color: "#1f2937" },

  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#0f766e",
    alignItems: "center",
    justifyContent: "center"
  },

  content: { padding: 18, paddingBottom: 30 },

  pageHeader: { marginBottom: 12 },

  title: { fontSize: 26, fontWeight: "700", color: "#1f2937" },

  subtitle: { fontSize: 14, color: "#6b7280", marginTop: 4 },

  refreshBtn: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#99f6e4",
    borderRadius: 10,
    backgroundColor: "#ecfeff",
    paddingVertical: 9,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row"
  },

  refreshText: { marginLeft: 7, color: "#0f766e", fontWeight: "700" },

  card: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 16,
    padding: 14,
    marginTop: 12,
    shadowColor: "#0f172a",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3
  },

  cardTitle: { fontSize: 16, fontWeight: "700", color: "#1f2937", marginBottom: 10 },

  search: {
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center"
  },

  searchInput: { flex: 1, marginLeft: 8, color: "#1f2937" },

  loadingWrap: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 10 },

  emptyText: { color: "#6b7280", paddingVertical: 12 },

  saleRow: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f8fafc"
  },

  saleRowActive: {
    borderColor: "#0f766e",
    backgroundColor: "#f0fdfa"
  },

  folio: { fontWeight: "700", color: "#111827" },

  meta: { marginTop: 3, fontSize: 12, color: "#6b7280" },

  saleRight: { alignItems: "flex-end" },

  total: { fontWeight: "700", color: "#0f766e" },

  estado: { marginTop: 3, fontSize: 12, fontWeight: "700" },

  ok: { color: "#166534" },

  pending: { color: "#b45309" },

  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    backgroundColor: "#f9fafb",
    paddingHorizontal: 10,
    paddingVertical: 9,
    color: "#1f2937"
  },

  textArea: { minHeight: 70 },

  label: { fontSize: 13, color: "#6b7280", fontWeight: "600", marginTop: 10, marginBottom: 6 },

  rowButtons: { flexDirection: "row", gap: 8 },

  optionButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    backgroundColor: "#ffffff",
    paddingVertical: 9,
    alignItems: "center"
  },

  optionButtonActive: {
    backgroundColor: "#0f766e",
    borderColor: "#0f766e"
  },

  optionText: { color: "#374151", fontWeight: "700", fontSize: 12 },

  optionTextActive: { color: "#ffffff" },

  generateButton: {
    marginTop: 14,
    backgroundColor: "#0f766e",
    borderRadius: 10,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center"
  },

  generateText: { marginLeft: 8, color: "#ffffff", fontWeight: "700" },

  generatedInfo: { marginTop: 10, color: "#166534", fontWeight: "700" },

  mensaje: { marginTop: 8, color: "#0f766e", fontWeight: "600" }
});
