import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { apiRequest } from "../config/api";
import { getStoredToken } from "../utils/authStorage";

export default function VentasScreen(){

const [busqueda, setBusqueda] = useState("");
const [metodoPago, setMetodoPago] = useState("Efectivo");
const [cliente, setCliente] = useState("");
const [observaciones, setObservaciones] = useState("");
const [carrito, setCarrito] = useState([]);
const [productos, setProductos] = useState([]);
const [loadingProductos, setLoadingProductos] = useState(true);
const [guardandoVenta, setGuardandoVenta] = useState(false);
const [mensaje, setMensaje] = useState("");

useEffect(() => {
	cargarProductos();
}, []);

async function cargarProductos() {
	setLoadingProductos(true);
	setMensaje("");

	try {
		const token = await getStoredToken();
		const response = await apiRequest("/api/productos", {
			method: "GET",
			headers: {
				"Accept": "application/json",
				"Authorization": `Bearer ${token}`
			}
		});

		if (!response.ok) {
			throw new Error("No se pudo cargar productos");
		}

		const data = await response.json();
		const normalizados = (data || []).map((item) => ({
			id: Number(item.id_producto),
			codigo: item.codigo || "",
			nombre: item.nombre || "Producto",
			descripcion: item.descripcion || "",
			categoria: item.categoria || "Sin categoria",
			precio: Number(item.precio || 0),
			stock: Number(item.stock || 0)
		}));

		setProductos(normalizados);
	} catch (error) {
		setMensaje("No se pudieron cargar productos del servidor.");
	} finally {
		setLoadingProductos(false);
	}
}

const productosFiltrados = useMemo(() => {
return productos.filter((p) =>
p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
p.categoria.toLowerCase().includes(busqueda.toLowerCase()) ||
p.codigo.toLowerCase().includes(busqueda.toLowerCase())
);
}, [busqueda, productos]);

const subtotal = useMemo(() => carrito.reduce((acc, i) => acc + i.precio * i.cantidad, 0), [carrito]);
const iva = subtotal * 0.16;
const total = subtotal + iva;

function agregarAlCarrito(producto) {
setCarrito((actual) => {
const existe = actual.find((item) => item.id === producto.id);
if (existe) {
if (existe.cantidad >= producto.stock) {
setMensaje("No hay mas stock disponible para este producto.");
return actual;
}
return actual.map((item) =>
item.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item
);
}

if (producto.stock <= 0) {
setMensaje("Producto sin stock.");
return actual;
}

setMensaje("Producto agregado al carrito.");
return [...actual, { ...producto, cantidad: 1 }];
});
}

function cambiarCantidad(id, delta) {
setCarrito((actual) =>
actual
.map((item) =>
item.id === id ? { ...item, cantidad: Math.max(0, item.cantidad + delta) } : item
)
.filter((item) => item.cantidad > 0)
);
}

function limpiarVenta() {
setCarrito([]);
setCliente("");
setObservaciones("");
setMetodoPago("Efectivo");
setMensaje("");
}

function metodoPagoApi(valor) {
	if (valor === "Tarjeta") {
		return "tarjeta";
	}

	if (valor === "Transferencia") {
		return "transferencia";
	}

	return "efectivo";
}

async function confirmarVenta() {
	if (!carrito.length) {
		setMensaje("Debes agregar al menos un producto.");
		return;
	}

	setGuardandoVenta(true);
	setMensaje("Procesando venta...");

	try {
		const token = await getStoredToken();
		const payload = {
			cliente: cliente.trim() || null,
			metodo_pago: metodoPagoApi(metodoPago),
			observaciones: observaciones.trim() || null,
			detalle: carrito.map((item) => ({
				id_producto: item.id,
				codigo: item.codigo || null,
				nombre: item.nombre,
				descripcion: item.descripcion || item.categoria || null,
				cantidad: item.cantidad,
				precio_unitario: Number(item.precio.toFixed(2)),
				subtotal: Number((item.cantidad * item.precio).toFixed(2))
			}))
		};

		const response = await apiRequest("/api/ventas", {
			method: "POST",
			headers: {
				"Accept": "application/json",
				"Content-Type": "application/json",
				"Authorization": `Bearer ${token}`
			},
			body: JSON.stringify(payload)
		});

		if (!response.ok) {
			const data = await response.json().catch(() => null);
			const errorMsg = data?.message || "No se pudo registrar la venta.";
			throw new Error(errorMsg);
		}

		const venta = await response.json();
		const detalleGuardado = Array.isArray(venta?.detalle) ? venta.detalle : [];

		setProductos((actual) =>
			actual.map((producto) => {
				const item = detalleGuardado.find((d) => Number(d.id_producto) === producto.id);
				if (!item) {
					return producto;
				}

				return {
					...producto,
					stock: Math.max(0, producto.stock - Number(item.cantidad || 0))
				};
			})
		);

		limpiarVenta();
		Alert.alert("Venta registrada", `Folio: ${venta?.folio || "Generado"}`);
	} catch (error) {
		setMensaje(error.message || "Error de conexion al guardar la venta.");
	} finally {
		setGuardandoVenta(false);
	}
}

return(

<SafeAreaView style={styles.container}>

<View style={styles.topbar}>
<Text style={styles.topbarTitle}>VentaTotal</Text>
<View style={styles.avatar}>
<Ionicons name="person-outline" size={18} color="#ffffff" />
</View>
</View>

<ScrollView contentContainerStyle={styles.content}>
<View style={styles.pageHeader}>
<Text style={styles.title}>Punto de Venta</Text>
<Text style={styles.subtitle}>Registra tus ventas de forma rapida y eficiente</Text>
</View>

<View style={styles.cardSection}>
<View style={styles.search}>
<Ionicons name="search-outline" size={18} color="#64748b" />
<TextInput
placeholder="Buscar producto por nombre o categoria..."
style={styles.searchInput}
value={busqueda}
onChangeText={setBusqueda}
placeholderTextColor="#94a3b8"
/>
</View>

<Text style={styles.sectionTitle}>Productos</Text>

{loadingProductos ? (
<View style={styles.loadingWrap}>
<ActivityIndicator size="small" color="#2563eb" />
<Text style={styles.estado}>Cargando productos...</Text>
</View>
) : (
<>
{productosFiltrados.length === 0 ? (
<Text style={styles.estado}>No hay productos para mostrar.</Text>
) : (
productosFiltrados.map((item) => (
<View key={item.id} style={styles.card}>
<View style={styles.cardInfo}>
<Text style={styles.name}>{item.nombre}</Text>
<Text style={styles.category}>{item.categoria}</Text>
<Text style={styles.stock}>Stock: {item.stock}</Text>
<Text style={styles.price}>${item.precio.toFixed(2)}</Text>
</View>

<TouchableOpacity
style={[styles.addBtn, item.stock <= 0 && styles.addBtnDisabled]}
onPress={() => agregarAlCarrito(item)}
disabled={item.stock <= 0}
>
<Ionicons name="add" size={16} color="#ffffff" />
<Text style={styles.addText}>{item.stock > 0 ? "Agregar" : "Sin stock"}</Text>
</TouchableOpacity>
</View>
))
)}
</>
)}
</View>

<View style={styles.cardSection}>
<View style={styles.cartHeader}>
<Text style={styles.sectionTitle}>Carrito de Compra</Text>
<View style={styles.badge}>
<Text style={styles.badgeText}>{carrito.reduce((acc, item) => acc + item.cantidad, 0)}</Text>
</View>
</View>

{carrito.length === 0 ? (
<Text style={styles.estado}>El carrito esta vacio.</Text>
) : (
carrito.map((item) => (
<View key={item.id} style={styles.cartItem}>
<View>
<Text style={styles.itemName}>{item.nombre}</Text>
<Text style={styles.itemPrice}>${item.precio.toFixed(2)} c/u</Text>
</View>

<View style={styles.qtyControls}>
<TouchableOpacity style={styles.qtyButton} onPress={() => cambiarCantidad(item.id, -1)}>
<Ionicons name="remove" size={14} color="#0f172a" />
</TouchableOpacity>
<Text style={styles.qtyText}>{item.cantidad}</Text>
<TouchableOpacity style={styles.qtyButton} onPress={() => cambiarCantidad(item.id, 1)}>
<Ionicons name="add" size={14} color="#0f172a" />
</TouchableOpacity>
</View>
</View>
))
)}

<View style={styles.totales}>
<View style={styles.totalRow}>
<Text style={styles.totalLabel}>Subtotal</Text>
<Text style={styles.totalValue}>${subtotal.toFixed(2)}</Text>
</View>
<View style={styles.totalRow}>
<Text style={styles.totalLabel}>IVA (16%)</Text>
<Text style={styles.totalValue}>${iva.toFixed(2)}</Text>
</View>
<View style={styles.totalDivider} />
<View style={styles.totalRow}>
<Text style={styles.totalFinalLabel}>Total</Text>
<Text style={styles.totalFinalValue}>${total.toFixed(2)}</Text>
</View>
</View>

<Text style={styles.fieldLabel}>Metodo de pago</Text>
<View style={styles.metodoRow}>
{["Efectivo", "Tarjeta", "Transferencia"].map((metodo) => (
<TouchableOpacity
key={metodo}
style={[styles.metodoButton, metodoPago === metodo && styles.metodoButtonActive]}
onPress={() => setMetodoPago(metodo)}
>
<Text style={[styles.metodoText, metodoPago === metodo && styles.metodoTextActive]}>{metodo}</Text>
</TouchableOpacity>
))}
</View>

<Text style={styles.fieldLabel}>Cliente (opcional)</Text>
<TextInput
style={styles.fieldInput}
value={cliente}
onChangeText={setCliente}
placeholder="Nombre del cliente"
placeholderTextColor="#94a3b8"
/>

<Text style={styles.fieldLabel}>Observaciones</Text>
<TextInput
style={[styles.fieldInput, styles.textArea]}
value={observaciones}
onChangeText={setObservaciones}
placeholder="Notas de la venta"
placeholderTextColor="#94a3b8"
multiline
textAlignVertical="top"
/>

<TouchableOpacity style={styles.confirmBtn} onPress={confirmarVenta} disabled={guardandoVenta}>
<Ionicons name="cash-outline" size={16} color="#ffffff" />
<Text style={styles.confirmText}>{guardandoVenta ? "Guardando..." : "Confirmar Venta"}</Text>
</TouchableOpacity>

<TouchableOpacity style={styles.cancelBtn} onPress={limpiarVenta}>
<Text style={styles.cancelText}>Cancelar</Text>
</TouchableOpacity>

{mensaje ? <Text style={styles.mensaje}>{mensaje}</Text> : null}
</View>

</ScrollView>

</SafeAreaView>

)

}

const styles=StyleSheet.create({

container:{flex:1,backgroundColor:"#f1f5f9"},

topbar:{
backgroundColor:"#ffffff",
paddingHorizontal:20,
paddingVertical:16,
borderBottomWidth:1,
borderBottomColor:"#e2e8f0",
flexDirection:"row",
justifyContent:"space-between",
alignItems:"center"
},

topbarTitle:{fontSize:20,fontWeight:"700",color:"#0f172a"},

avatar:{
width:36,
height:36,
borderRadius:18,
backgroundColor:"#3b82f6",
alignItems:"center",
justifyContent:"center"
},

content:{padding:20,paddingBottom:30},

pageHeader:{marginBottom:16},

title:{fontSize:30,fontWeight:"700",color:"#0f172a"},

subtitle:{fontSize:14,color:"#64748b",marginTop:4,marginBottom:8},

cardSection:{
backgroundColor:"#ffffff",
padding:16,
borderRadius:16,
marginBottom:16,
shadowColor:"#0f172a",
shadowOpacity:0.06,
shadowRadius:14,
elevation:3
},

search:{
backgroundColor:"#f1f5f9",
paddingHorizontal:12,
paddingVertical:10,
borderRadius:12,
flexDirection:"row",
alignItems:"center"
},

searchInput:{flex:1,marginLeft:8,color:"#0f172a"},

sectionTitle:{fontSize:18,fontWeight:"700",color:"#0f172a",marginTop:14,marginBottom:10},

estado:{color:"#64748b",paddingVertical:8},

card:{
backgroundColor:"#f8fafc",
padding:14,
borderRadius:14,
marginBottom:10,
flexDirection:"row",
justifyContent:"space-between",
alignItems:"center",
borderWidth:1,
borderColor:"#e2e8f0"
},

cardInfo:{flex:1,paddingRight:10},

name:{fontWeight:"700",color:"#0f172a"},

category:{fontSize:12,color:"#64748b",marginTop:2},

stock:{fontSize:12,color:"#64748b",marginTop:2},

price:{color:"#2563eb",fontWeight:"700",marginTop:5},

addBtn:{
backgroundColor:"#2563eb",
paddingHorizontal:12,
paddingVertical:8,
borderRadius:10,
flexDirection:"row",
alignItems:"center"
},

addText:{color:"#ffffff",marginLeft:5,fontWeight:"600"},

addBtnDisabled:{backgroundColor:"#94a3b8"},

cartHeader:{flexDirection:"row",justifyContent:"space-between",alignItems:"center"},

badge:{
backgroundColor:"#2563eb",
minWidth:24,
height:24,
borderRadius:12,
alignItems:"center",
justifyContent:"center",
paddingHorizontal:6
},

badgeText:{color:"#ffffff",fontWeight:"700",fontSize:12},

cartItem:{
backgroundColor:"#f8fafc",
borderWidth:1,
borderColor:"#e2e8f0",
borderRadius:12,
padding:10,
marginBottom:8,
flexDirection:"row",
justifyContent:"space-between",
alignItems:"center"
},

itemName:{fontWeight:"700",color:"#0f172a",maxWidth:170},

itemPrice:{fontSize:12,color:"#64748b",marginTop:4},

qtyControls:{flexDirection:"row",alignItems:"center",gap:8},

qtyButton:{
width:28,
height:28,
borderRadius:14,
backgroundColor:"#e2e8f0",
alignItems:"center",
justifyContent:"center"
},

qtyText:{fontWeight:"700",minWidth:18,textAlign:"center",color:"#0f172a"},

totales:{marginTop:10,marginBottom:8},

totalRow:{flexDirection:"row",justifyContent:"space-between",paddingVertical:4},

totalLabel:{color:"#475569"},

totalValue:{color:"#0f172a",fontWeight:"600"},

totalDivider:{height:1,backgroundColor:"#e2e8f0",marginVertical:8},

totalFinalLabel:{fontWeight:"700",color:"#0f172a",fontSize:16},

totalFinalValue:{fontWeight:"700",color:"#2563eb",fontSize:18},

fieldLabel:{fontSize:13,color:"#475569",marginTop:10,marginBottom:6,fontWeight:"600"},

metodoRow:{flexDirection:"row",gap:8,marginBottom:6},

metodoButton:{
flex:1,
borderRadius:10,
borderWidth:1,
borderColor:"#cbd5e1",
paddingVertical:9,
alignItems:"center",
backgroundColor:"#ffffff"
},

metodoButtonActive:{backgroundColor:"#2563eb",borderColor:"#2563eb"},

metodoText:{fontSize:12,color:"#334155",fontWeight:"600"},

metodoTextActive:{color:"#ffffff"},

fieldInput:{
borderWidth:1,
borderColor:"#e2e8f0",
borderRadius:12,
backgroundColor:"#f8fafc",
paddingHorizontal:12,
paddingVertical:10,
color:"#0f172a"
},

textArea:{height:85,marginBottom:10},

confirmBtn:{
marginTop:8,
backgroundColor:"#2563eb",
borderRadius:12,
paddingVertical:12,
alignItems:"center",
justifyContent:"center",
flexDirection:"row"
},

confirmText:{color:"#ffffff",fontWeight:"700",marginLeft:8},

cancelBtn:{
marginTop:10,
borderRadius:12,
paddingVertical:11,
alignItems:"center",
borderWidth:1,
borderColor:"#e2e8f0",
backgroundColor:"#ffffff"
},

cancelText:{color:"#0f172a",fontWeight:"600"}

,mensaje:{marginTop:10,color:"#0f766e",fontWeight:"600"}

,loadingWrap:{flexDirection:"row",alignItems:"center",gap:8,paddingVertical:10}

})