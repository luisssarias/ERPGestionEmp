import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from '../Screens/HomeScreen';
import ProductosScreen from '../Screens/ProductosScreen';
import VentasScreen from '../Screens/VentasScreen';
import FacturacionScreen from '../Screens/FacturacionScreen';
import ReportesScreen from '../Screens/ReportesScreen';
import PerfilScreen from '../Screens/PerfilScreen';

const Tab = createBottomTabNavigator();

export default function MainTabs(){

return(

<Tab.Navigator
screenOptions={({route})=>({

headerShown:false,
tabBarStyle:{
height:64,
paddingBottom:8,
paddingTop:6,
backgroundColor:'#ffffff',
borderTopColor:'#e2e8f0'
},
tabBarActiveTintColor:'#2563eb',
tabBarInactiveTintColor:'#64748b',

tabBarIcon:({color,size})=>{

let iconName;

if(route.name==="Inicio") iconName="home-outline";
else if(route.name==="Productos") iconName="cube-outline";
else if(route.name==="Ventas") iconName="cash-outline";
else if(route.name==="Facturacion") iconName="receipt-outline";
else if(route.name==="Reportes") iconName="bar-chart-outline";
else if(route.name==="Perfil") iconName="person-outline";

return <Ionicons name={iconName} size={size} color={color}/>

}

})}

>

<Tab.Screen name="Inicio" component={HomeScreen}/>
<Tab.Screen name="Productos" component={ProductosScreen}/>
<Tab.Screen name="Ventas" component={VentasScreen}/>
<Tab.Screen name="Facturacion" component={FacturacionScreen}/>
<Tab.Screen name="Reportes" component={ReportesScreen}/>
<Tab.Screen name="Perfil" component={PerfilScreen}/>

</Tab.Navigator>

)

}