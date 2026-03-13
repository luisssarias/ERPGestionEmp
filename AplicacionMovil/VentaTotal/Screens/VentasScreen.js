import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function VentasScreen(){

return(

<SafeAreaView style={styles.container}>

<View style={styles.header}>

<Text style={styles.title}>Registrar Venta</Text>

<View style={styles.search}>
<Ionicons name="search-outline" size={20}/>
<TextInput placeholder="Buscar productos..." style={{flex:1,marginLeft:10}}/>
</View>

</View>

<ScrollView style={{padding:20}}>

<Text style={styles.subtitle}>Productos disponibles</Text>

{["Laptop Dell","Mouse Logitech","Teclado Mecánico","Monitor LG","Webcam HD"].map((item,i)=>(
<View key={i} style={styles.card}>

<View>
<Text style={styles.name}>{item}</Text>
<Text style={styles.price}>$1,500</Text>
</View>

<TouchableOpacity style={styles.addBtn}>
<Ionicons name="add" size={16} color="white"/>
<Text style={{color:"white",marginLeft:5}}>Agregar</Text>
</TouchableOpacity>

</View>
))}

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

title:{color:"white",fontSize:20,fontWeight:"bold",marginBottom:10},

search:{
backgroundColor:"white",
padding:10,
borderRadius:10,
flexDirection:"row",
alignItems:"center"
},

subtitle:{fontSize:18,fontWeight:"bold",marginBottom:10},

card:{
backgroundColor:"white",
padding:15,
borderRadius:15,
marginBottom:10,
flexDirection:"row",
justifyContent:"space-between",
alignItems:"center",
shadowColor:"#000",
shadowOpacity:0.1,
shadowRadius:10,
elevation:4
},

name:{fontWeight:"bold"},

price:{color:"green"},

addBtn:{
backgroundColor:"#2c4da7",
padding:10,
borderRadius:10,
flexDirection:"row",
alignItems:"center"
}

})