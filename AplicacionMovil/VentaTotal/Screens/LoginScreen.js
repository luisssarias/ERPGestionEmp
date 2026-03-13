import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";

export default function LoginScreen({navigation}) {

const [show,setShow]=useState(false);

return(

<SafeAreaView style={styles.container}>

<View style={styles.header}>

<View style={styles.logo}>
<Ionicons name="document-text-outline" size={40} color="#2c4da7"/>
</View>

<Text style={styles.logoText}>VentaTotal</Text>

</View>

<View style={styles.card}>

<Text style={styles.title}>Iniciar sesión</Text>
<Text style={styles.subtitle}>Accede al sistema de gestión comercial</Text>

<Text style={styles.label}>Correo electrónico</Text>

<View style={styles.input}>
<Ionicons name="mail-outline" size={20} color="#888"/>
<TextInput placeholder="usuario@empresa.com" style={styles.inputText}/>
</View>

<Text style={styles.label}>Contraseña</Text>

<View style={styles.input}>
<Ionicons name="lock-closed-outline" size={20} color="#888"/>
<TextInput secureTextEntry={!show} style={styles.inputText} placeholder="********"/>

<TouchableOpacity onPress={()=>setShow(!show)}>
<Ionicons name="eye-outline" size={20} color="#888"/>
</TouchableOpacity>

</View>

<TouchableOpacity
style={styles.button}
onPress={()=>navigation.replace("Main")}
>

<Text style={styles.buttonText}>Ingresar al sistema</Text>

</TouchableOpacity>

<Text style={styles.link}>¿Olvidaste tu contraseña?</Text>

</View>

<Text style={styles.footer}>© 2026 Sistema Gestión Comercial</Text>

</SafeAreaView>

)

}

const styles=StyleSheet.create({

container:{flex:1,backgroundColor:"#2c4da7",alignItems:"center"},

header:{marginTop:40,alignItems:"center"},

logo:{
backgroundColor:"white",
padding:16,
borderRadius:16
},

logoText:{
color:"white",
fontSize:22,
marginTop:10,
fontWeight:"600"
},

card:{
width:"90%",
backgroundColor:"#f1f5f9",
padding:22,
borderRadius:22,
marginTop:25
},

title:{fontSize:22,fontWeight:"bold",textAlign:"center"},

subtitle:{textAlign:"center",color:"#666",marginBottom:20},

label:{marginTop:10,marginBottom:5},

input:{
flexDirection:"row",
alignItems:"center",
backgroundColor:"#e5e7eb",
padding:12,
borderRadius:10
},

inputText:{flex:1,marginLeft:10},

button:{
backgroundColor:"#2c4da7",
padding:15,
borderRadius:12,
alignItems:"center",
marginTop:20
},

buttonText:{color:"white",fontWeight:"bold"},

link:{textAlign:"center",marginTop:15,color:"#2c4da7"},

footer:{color:"white",marginTop:20}

})