import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, StyleSheet, ScrollView, Dimensions } from "react-native";
import { BarChart, LineChart, PieChart } from "react-native-chart-kit";

const screenWidth = Dimensions.get("window").width;

export default function ReportesScreen(){

const pieData = [
{
name: "Tecnología",
population: 45,
color: "#1d4ed8",
legendFontColor: "#374151",
legendFontSize: 14
},
{
name: "Accesorios",
population: 30,
color: "#10b981",
legendFontColor: "#374151",
legendFontSize: 14
},
{
name: "Muebles",
population: 25,
color: "#f59e0b",
legendFontColor: "#374151",
legendFontSize: 14
}
];

return(

<SafeAreaView style={styles.container}>

<ScrollView showsVerticalScrollIndicator={false}>

<View style={styles.header}>
<Text style={styles.headerTitle}>Reportes</Text>
<Text style={styles.headerSubtitle}>Analiza ventas, tendencias y categorias</Text>
</View>

{/* Card verde */}

<View style={styles.greenCard}>
<Text style={styles.white}>Total de ventas</Text>
<Text style={styles.big}>$125,450</Text>
<Text style={styles.white}>+18% vs mes anterior</Text>
</View>

{/* Cards secundarias */}

<View style={styles.row}>

<View style={styles.blueCard}>
<Text style={styles.white}>Ingresos del mes</Text>
<Text style={styles.big}>$603,000</Text>
</View>

<View style={styles.purpleCard}>
<Text style={styles.white}>Más vendido</Text>
<Text style={styles.big}>Laptop Dell</Text>
</View>

</View>

{/* BAR CHART */}

<View style={styles.chartCard}>

<Text style={styles.chartTitle}>Productos más vendidos</Text>

<BarChart
data={{
labels:["Laptop","Mouse","Teclado","Monitor","Webcam"],
datasets:[{data:[45,38,30,27,20]}]
}}
width={screenWidth-40}
height={220}
chartConfig={{
backgroundGradientFrom:"#fff",
backgroundGradientTo:"#fff",
color:(opacity=1)=>`rgba(44,77,167,${opacity})`
}}
style={{borderRadius:16}}
/>

</View>

{/* LINE CHART */}

<View style={styles.chartCard}>

<Text style={styles.chartTitle}>Ventas mensuales</Text>

<LineChart
data={{
labels:["Ene","Feb","Mar","Abr","May","Jun"],
datasets:[
{data:[80000,90000,70000,105000,120000,130000]}
]
}}
width={screenWidth-40}
height={220}
chartConfig={{
backgroundGradientFrom:"#fff",
backgroundGradientTo:"#fff",
color:(opacity=1)=>`rgba(16,185,129,${opacity})`
}}
style={{borderRadius:16}}
/>

</View>

{/* PIE CHART */}

<View style={styles.chartCard}>

<Text style={styles.chartTitle}>Ventas por categoría</Text>

<PieChart
data={pieData}
width={screenWidth-40}
height={220}
chartConfig={{
color:(opacity=1)=>`rgba(0,0,0,${opacity})`
}}
accessor={"population"}
backgroundColor={"transparent"}
paddingLeft={"15"}
center={[0,0]}
/>

</View>

{/* RESUMEN */}

<View style={styles.chartCard}>

<Text style={styles.chartTitle}>Resumen estadístico</Text>

<View style={styles.statRow}>
<Text>Promedio de venta</Text>
<Text style={styles.bold}>$4,180</Text>
</View>

<View style={styles.divider}/>

<View style={styles.statRow}>
<Text>Total de transacciones</Text>
<Text style={styles.bold}>30 ventas</Text>
</View>

<View style={styles.divider}/>

<View style={styles.statRow}>
<Text>Tasa de crecimiento</Text>
<Text style={{color:"#10b981",fontWeight:"bold"}}>+18.5%</Text>
</View>

</View>

</ScrollView>

</SafeAreaView>

)

}

const styles = StyleSheet.create({

container:{
flex:1,
backgroundColor:"#f1f5f9"
},

header:{
backgroundColor:"#2c4da7",
padding:20,
borderBottomLeftRadius:20,
borderBottomRightRadius:20
},

headerTitle:{
color:"white",
fontSize:20,
fontWeight:"bold"
},

headerSubtitle:{
color:"#dbeafe",
marginTop:4
},

greenCard:{
backgroundColor:"#10b981",
margin:20,
padding:20,
borderRadius:15
},

row:{
flexDirection:"row",
justifyContent:"space-around"
},

blueCard:{
backgroundColor:"#3b82f6",
padding:20,
borderRadius:15,
width:"40%"
},

purpleCard:{
backgroundColor:"#9333ea",
padding:20,
borderRadius:15,
width:"40%"
},

white:{
color:"white"
},

big:{
fontSize:20,
fontWeight:"bold",
color:"white"
},

chartCard:{
backgroundColor:"white",
marginHorizontal:20,
marginTop:20,
padding:15,
borderRadius:15,
shadowColor:"#000",
shadowOpacity:0.08,
shadowRadius:8,
elevation:4
},

chartTitle:{
fontSize:16,
fontWeight:"bold",
marginBottom:10
},

statRow:{
flexDirection:"row",
justifyContent:"space-between",
paddingVertical:10
},

divider:{
height:1,
backgroundColor:"#e5e7eb"
},

bold:{
fontWeight:"bold"
}

});