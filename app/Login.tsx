// app .js for this video follow along (https://www.youtube.com/watch?v=lA_73_-n-V4)
//Create a simple login screen
// implement user authentication logic tomorrow after laundry and packing 
import React, { useState } from "react";
import {SafeAreaView,View,Text,StyleSheet,Image,TextInput, TouchableOpacity} from 'react-native'

export default function example() 
{
const [form, setForm] = useState({ // i guess  Usestate is how we update things
      email:'',
      password:'',
}); // below is the ui for the sign in screen
return (
    <SafeAreaView style={{flex: 1,backgroundColor: 'white'}}>
        <View style={Styles.container}>
          <View style={Styles.header}>
            <Image
              source={{uri: 'https://em-content.zobj.net/thumbs/120/apple/354/high-voltage_26a1.png'}} // i tried to implement the lighting emoji icon  above the sign form
              style= {Styles.headerImg}
               alt= 'logo'
            />
            
            <Text style={Styles.title}>Sign into Powrfit</Text>
            <Text style ={Styles.subtitle}>This is where fitness journeys starts.</Text>
           </View>


           <View style= {Styles.form}>
            <View style={Styles.input}><text style={Styles.inputLabel}>Email address</text></View>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              style ={Styles.inputControl}
              placeholder="john@example.com"
              placeholderTextColor= "#6b7280"
              value = {form.email}
              onChangeText = {email => setForm({...form, email})}
            />
           </View>
             <View style={Styles.input}><text style={Styles.inputLabel}>Password</text></View>
            <TextInput
              style ={Styles.inputControl}
              placeholder="*************"
              placeholderTextColor= "#6b7280"
              value = {form.password}
              onChangeText = {password => setForm({...form, password})}
            />
           </View>
          <View style={Styles.formAction}>
            <TouchableOpacity
                onPress={() => {
                    // handle onPress
                    Alert.alert('Successfully logged in')
                }}>
                <View style={Styles.btn}>
                <Text style={Styles.btnText}> Sign In</Text>
                </View>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
          style={{marginTop: 'auto'}}
          onPress={() =>{
            // handle onPress
          }}>
           <text style={Styles.formFooter}>Don't have an account? {' '}
            <text style={{textDecorationLine: 'underline'}}>Sign Up</text>
            </text>
          </TouchableOpacity>
    </SafeAreaView>

);
}


const Styles = StyleSheet.create({
     container: {
        padding: 24,
        flex: 1,
     },
     header:
     {
        marginVertical: 36,

     },
     headerImg:
     {
        width: 80,
        height: 80,
        alignSelf: 'center',
        marginBottom: 36,

     },
     title: 
     {
        fontSize: 27,
        fontWeight: '700',
        color: 'black',
        marginBottom: 6,
        textAlign: 'center',
     },
     subtitle:
     {
        fontSize: 15,
        fontWeight:'500',
        color:'#929292',
        textAlign: 'center'
     },
     input: {
        marginBottom:16,
     },
     inputLabel: 
     {
       fontSize:17,
       fontWeight: '600',
       color: '#222',
       marginBottom: 8
     },
     inputControl: 
     {
       height: 44,
       backgroundColor: '#fff',
       paddingHorizontal: 16,
       borderRadius: 12,
       fontSize: 15,
       fontWeight:'500',
       color: '#222',
     },
     form: 
     {
      marginBottom: 24,
      flex: 1,
     },
     formAction: 
     {
       marginVertical: 24,
     },
     formFooter: 
     {
       fontSize: 17,
       fontWeight: '600',
       color:'#222',
       textAlign: 'center',
       letterSpacing: 0.15,

     },
     btn:
     {
        backgroundColor: '#075eec',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#075eec',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 20,

     },
     btnText:
     {
        fontSize:18,
        fontWeight: '600',
        color: '#fff'
     }
          













});