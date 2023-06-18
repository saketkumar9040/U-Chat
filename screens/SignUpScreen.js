import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator ,
  Alert 
} from "react-native";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { ImageBackground } from "react-native";
import backgroundImage from "../assets/images/authBackground.jpg";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import {
  nameVaildator,
  emailValidator,
  passwordValidator,
  numberValidator,
} from "../utils/Validators";
import { app, auth } from "../firebase/FirebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { child, getDatabase, ref, set } from "firebase/database"
import { useDispatch, useSelector } from "react-redux";
import { authenticate } from "../store/Slice";
import AsyncStorage from "@react-native-async-storage/async-storage"

const SignUpScreen = ({ navigation }) => {

  const dispatch = useDispatch();
  // const stateData = useSelector(state=>state.auth)
  // console.log(stateData);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [number, setNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  const submitHandler = async () => {
    //   FORM  - VALIDATION  ===============================>
    if (nameVaildator(name) !== undefined) {
      return alert(nameVaildator(name).name);
    }
    if (emailValidator(email) !== undefined) {
      return alert(emailValidator(email).email);
    }
    if (numberValidator(number) !== undefined) {
      return alert(numberValidator(number).number);
    }
    if (passwordValidator(password) !== undefined) {
      return alert(passwordValidator(password).password);
    }
    //   CREATING USER CREDENTIALS IN FIREBASE  ==============>
    try {
      setIsLoading(true);

      const userSignUp = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      )
      .then(async(userCredentials) => {
           const {uid, stsTokenManager} = userCredentials.user;
           const {accessToken , expirationTime} = stsTokenManager;

          const userData = {
             name,
             email,
             number,
             password,
             uid:userCredentials.user.uid,
             signUpDate:new Date().toISOString(),
          }

          //  CREATE USER IN FIRESTOR REALTIME - DATABASE =====================>
          const dbRef = ref(getDatabase());
          const childRef = child(dbRef,`UserData/${uid}`)
          await set(childRef,userData);
          
          //  STORING THE USER STATE AND TOKEN IN STORE ========================>
          dispatch(authenticate({token:accessToken,userData}))

          //  STORING USER DATA TO LOCAL STORAGE ================================>
          AsyncStorage.setItem("userData",JSON.stringify({
            accessToken,
            uid,
            expiryDate:new Date(expirationTime).toISOString()
          }))

          Alert.alert("SignUp Successfully 😊");
          setName("");
          setEmail("");
          setNumber("");
          setPassword("");
        })
        .catch((error) => {
          setIsLoading(false);
          console.log(error.code);
          if (error.code === "auth/email-already-in-use") {
            return Alert.alert(
              "Error",
              "Email is already in use, please try with another Email"
            );
          }
          return Alert.alert("Error", error.code);
        });

    } catch (error) {
      setIsLoading(false);
      console.log(error);
      return alert("Firebase Server Error");
    }

    //  SETTING ALL FIELDS EMPTY ==============================>
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.signInTextContainer}>
        <Text style={styles.signInText}>Sign Up</Text>
      </View>
      <ImageBackground
        source={backgroundImage}
        style={styles.ImageBackgroundContainer}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.inputContainer}>
            <Feather name="user" size={25} color="#fff" />
            <TextInput
              placeholder="Enter Name"
              placeholderTextColor="#6f4e37"
              autoCapitalize="none"
              style={styles.textInput}
              selectionColor="#6f4e37"
              value={name}
              onChangeText={(e) => setName(e)}
            />
          </View>
          <View style={styles.inputContainer}>
            <MaterialCommunityIcons
              name="email-outline"
              size={25}
              color="#fff"
            />
            <TextInput
              placeholder="Enter E-mail"
              placeholderTextColor="#6f4e37"
              autoCapitalize="none"
              style={styles.textInput}
              selectionColor="#6f4e37"
              value={email}
              onChangeText={(e) => setEmail(e)}
              keyboardType="email-address"
            />
          </View>
          <View style={styles.inputContainer}>
            <Feather name="phone" size={24} color="#fff" />
            <TextInput
              placeholder="Enter Number"
              placeholderTextColor="#6f4e37"
              style={styles.textInput}
              selectionColor="#6f4e37"
              value={number}
              onChangeText={(e) =>
                e.length <= 10
                  ? setNumber(e)
                  : alert("Number must be 10 digits ")
              }
              keyboardType="numeric"
            />
          </View>
          {showPassword === false ? (
            <View style={styles.inputContainer}>
              <TouchableOpacity onPress={() => setShowPassword(true)}>
                <Feather name="lock" size={25} color="#fff" />
              </TouchableOpacity>
              <TextInput
                placeholder="Enter Password"
                placeholderTextColor="#6f4e37"
                autoCapitalize="none"
                style={styles.textInput}
                selectionColor="#6f4e37"
                value={password}
                secureTextEntry={true}
                onChangeText={(e) => setPassword(e)}
              />
            </View>
          ) : (
            <View style={styles.inputContainer}>
              <TouchableOpacity onPress={() => setShowPassword(false)}>
                <Feather name="unlock" size={25} color="#fff" />
              </TouchableOpacity>
              <TextInput
                placeholder="Enter Password"
                placeholderTextColor="#6f4e37"
                autoCapitalize="none"
                style={styles.textInput}
                selectionColor="#6f4e37"
                value={password}
                onChangeText={(e) => setPassword(e)}
              />
            </View>
          )}
          {isLoading ? (
            <View style={styles.buttonContainer}>
              <ActivityIndicator size={30} color="#fff" />
            </View>
          ) : (
            <TouchableOpacity
              style={styles.buttonContainer}
              onPress={submitHandler}
            >
              <Text style={styles.buttonText}>SUBMIT</Text>
            </TouchableOpacity>
          )}
          <Text
            style={{
              ...styles.signUpText,
              fontSize: 19,
              marginTop: 20,
              padding: 20,
              alignSelf: "center",
            }}
          >
            Already have an account ?
          </Text>
          <TouchableOpacity
            style={styles.signUpButton}
            onPress={() => navigation.navigate("SignInScreen")}
          >
            <Text
              style={{
                ...styles.signUpText,
                borderWidth: 3,
                borderRadius: 35,
                borderColor: "#6f4e37",
              }}
            >
              Sign In
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </ImageBackground>
    </SafeAreaView>
  );
};

export default SignUpScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor:"#6f4e37"
  },
  ImageBackgroundContainer: {
    flex: 1,
    alignItems: "center",
  },
  signInTextContainer: {
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#6f4e37",
  },
  signInText: {
    fontSize: 35,
    fontWeight: 700,
    color: "#fff",
    alignContent: "center",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#6f4e37",
    marginVertical: 10,
    marginHorizontal: 20,
    paddingHorizontal: 10,
    paddingLeft: 15,
    borderRadius: 50,
  },
  textInput: {
    width: "90%",
    color: "#6f4e37",
    borderRadius: 25,
    paddingHorizontal: 20,
    marginVertical: 10,
    fontSize: 18,
    backgroundColor: "#fff",
    height: 40,
    marginLeft: 10,
    //  fontFamily: "Medium",
  },
  buttonContainer: {
    width: "50%",
    height: 60,
    marginTop: 20,
    padding: 15,
    alignSelf: "center",
    backgroundColor: "#6f4e37",
    borderRadius: 40,
  },
  buttonText: {
    color: "#fff",
    fontSize: 20,
    alignSelf: "center",
    // fontWeight:500,
    letterSpacing: 1,
  },
  signUpText: {
    color: "#6f4e37",
    fontSize: 28,
    //  padding:5,
    paddingHorizontal: 27,
    backgroundColor: "#FEFF75",
  },
  signUpButton: {
    alignSelf: "center",
    backgroundColor: "#FEFF75",
  },
});