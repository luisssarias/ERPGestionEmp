import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView, View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function HomeScreen(){

return(

<SafeAreaView style={styles.container}>

<ScrollView showsVerticalScrollIndicator={false}>

<View style={styles.header}>

<Text style={styles.headerTitle}>Inicio</Text>
<Text style={styles.headerSubtitle}>Gestiona tu negocio de manera eficiente</Text>

</View>

<View style={styles.cards}>

<View style={styles.card}>
<Ionicons name="cash-outline" size={24} color="green"/>
<Text style={styles.cardTitle}>Ventas del día</Text>
<Text style={styles.green}>45</Text>
<Text>transacciones</Text>
</View>

<View style={styles.card}>
<Ionicons name="trending-up-outline" size={24} color="blue"/>
<Text style={styles.cardTitle}>Ingresos del día</Text>
<Text style={styles.blue}>$24,580</Text>
<Text>+12% vs ayer</Text>
</View>

</View>

<View style={styles.quick}>

<Text style={styles.section}>Accesos rápidos</Text>

<View style={styles.quickRow}>

<View style={styles.quickCard}>
<Ionicons name="cash-outline" size={26} color="#2c4da7"/>
<Text>Nueva Venta</Text>
</View>

<View style={styles.quickCard}>
<Ionicons name="cube-outline" size={26} color="#2c4da7"/>
<Text>Ver Productos</Text>
</View>

</View>

</View>

</ScrollView>

</SafeAreaView>

)

}

const styles=StyleSheet.create({

container:{flex:1,backgroundColor:"#f1f5f9"},

header:{
backgroundColor:"#2c4da7",
padding:20,
borderBottomLeftRadius:20,
borderBottomRightRadius:20
},

headerTitle:{color:"white",fontSize:20,fontWeight:"bold"},

headerSubtitle:{color:"#dbeafe",marginTop:4},

cards:{
flexDirection:"row",
justifyContent:"space-around",
marginTop:20
},

card:{
backgroundColor:"white",
width:"40%",
padding:20,
borderRadius:16,
shadowColor:"#000",
shadowOpacity:0.1,
shadowRadius:10,
elevation:5
},

cardTitle:{marginTop:10,fontWeight:"bold"},

green:{color:"green",fontSize:20},

blue:{color:"blue",fontSize:20},

quick:{marginTop:30,paddingHorizontal:20},

section:{fontSize:18,fontWeight:"bold",marginBottom:15},

quickRow:{flexDirection:"row",justifyContent:"space-between"},

quickCard:{
backgroundColor:"white",
width:"48%",
padding:20,
borderRadius:15,
alignItems:"center",
shadowColor:"#000",
shadowOpacity:0.1,
shadowRadius:10,
elevation:4
}

})