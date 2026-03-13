import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function PerfilScreen({ navigation }) {

return(

<SafeAreaView style={styles.container}>

<View style={styles.header}>
<Text style={styles.headerTitle}>Mi Perfil</Text>
</View>

<View style={styles.card}>

<Ionicons name="person-circle-outline" size={70} color="#2c4da7"/>

<Text style={styles.name}>Felipe Martínez</Text>
<Text style={styles.role}>Administrador</Text>

</View>

<View style={styles.info}>
<Ionicons name="mail-outline" size={20}/>
<Text style={styles.infoText}>felipe.martinez@empresa.com</Text>
</View>

<View style={styles.info}>
<Ionicons name="call-outline" size={20}/>
<Text style={styles.infoText}>+52 55 1234 5678</Text>
</View>

<View style={styles.info}>
<Ionicons name="location-outline" size={20}/>
<Text style={styles.infoText}>Ciudad de México, México</Text>
</View>

<TouchableOpacity
style={styles.logout}
onPress={() => navigation.replace("Login")}
>

<Ionicons name="log-out-outline" size={20} color="white"/>

<Text style={styles.logoutText}>Cerrar sesión</Text>

</TouchableOpacity>

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

card:{
backgroundColor:"white",
margin:20,
padding:20,
borderRadius:15,
alignItems:"center",
shadowColor:"#000",
shadowOpacity:0.1,
shadowRadius:10,
elevation:4
},

name:{
fontSize:18,
fontWeight:"bold",
marginTop:10
},

role:{
color:"#2563eb",
marginTop:3
},

info:{
backgroundColor:"white",
marginHorizontal:20,
padding:15,
borderRadius:12,
marginBottom:10,
flexDirection:"row",
alignItems:"center",
shadowColor:"#000",
shadowOpacity:0.05,
shadowRadius:6,
elevation:2
},

infoText:{
marginLeft:10,
fontSize:15
},

logout:{
backgroundColor:"#ef4444",
margin:20,
padding:15,
borderRadius:12,
alignItems:"center",
flexDirection:"row",
justifyContent:"center"
},

logoutText:{
color:"white",
fontWeight:"bold",
marginLeft:6
}

});