import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, StyleSheet, ScrollView, Image, TextInput, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function ProductosScreen(){

return(

<SafeAreaView style={styles.container}>

<View style={styles.header}>
<Text style={styles.headerTitle}>Productos</Text>

<View style={styles.search}>
<Ionicons name="search-outline" size={20} color="#777"/>
<TextInput placeholder="Buscar productos..." style={{flex:1,marginLeft:10}}/>
</View>

</View>

<ScrollView style={{padding:16}}>

<View style={styles.card}>

<Image
source={require('../assets/LAPTOP.png')}
style={styles.image}
/>

<View style={{flex:1}}>

<Text style={styles.title}>Laptop Dell Inspiron 15</Text>
<Text style={styles.category}>Tecnología</Text>

<View style={styles.row}>
<Text style={styles.price}>$12,500</Text>
<Text style={styles.stock}>15 unid.</Text>
</View>

<TouchableOpacity style={styles.edit}>
<Text style={{color:"#2563eb"}}>Editar</Text>
</TouchableOpacity>

</View>

</View>

<View style={styles.card}>

<Image
source={require('../assets/MOUSE.png')}
style={styles.image}
/>

<View style={{flex:1}}>

<Text style={styles.title}>Mouse Logitech MX Master</Text>
<Text style={styles.category}>Accesorios</Text>

<View style={styles.row}>
<Text style={styles.price}>$1,850</Text>
<Text style={styles.stock}>42 unid.</Text>
</View>

<TouchableOpacity style={styles.edit}>
<Text style={{color:"#2563eb"}}>Editar</Text>
</TouchableOpacity>

</View>

</View>

</ScrollView>

<TouchableOpacity style={styles.fab}>
<Ionicons name="add" size={30} color="white"/>
</TouchableOpacity>

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

headerTitle:{
color:"white",
fontSize:20,
fontWeight:"bold",
marginBottom:10
},

search:{
backgroundColor:"white",
padding:10,
borderRadius:10,
flexDirection:"row",
alignItems:"center"
},

card:{
backgroundColor:"white",
borderRadius:15,
padding:10,
flexDirection:"row",
marginBottom:15,
shadowColor:"#000",
shadowOpacity:0.1,
shadowRadius:8,
elevation:4
},

image:{
width:70,
height:70,
borderRadius:10,
marginRight:10
},

title:{fontWeight:"bold",fontSize:16},

category:{color:"#666",marginVertical:4},

row:{flexDirection:"row",justifyContent:"space-between"},

price:{color:"green"},

stock:{color:"#2563eb"},

edit:{
backgroundColor:"#e5e7eb",
padding:8,
borderRadius:10,
marginTop:8,
alignItems:"center"
},

fab:{
position:"absolute",
bottom:30,
right:20,
backgroundColor:"#2c4da7",
width:60,
height:60,
borderRadius:30,
justifyContent:"center",
alignItems:"center"
}

})