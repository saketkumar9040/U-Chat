import {
  StyleSheet,
  Text,
  View,
  ImageBackground,
  TouchableOpacity,
  Image,
  FlatList,
  TouchableWithoutFeedback,
  Alert,
  TextInput,
} from "react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import BackgroundImage from "../assets/images/chatScreenBackground.png";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, Feather, FontAwesome, AntDesign } from "@expo/vector-icons";
import userProfilePic from "../assets/images/userProfile.png";
import { useSelector } from "react-redux";
import ErrorBubble from "../components/ErrorBubble";
import { SaveNewChat } from "../components/SaveNewChat";
import { saveMessage } from "../utils/ChatHandler";
import MessageBubble from "../components/MessageBubble";


const ChatScreen = ({ navigation, route }) => {
  const [messageText, setMessageText] = useState("");
  const [chatId, setChatId] = useState(
    route.params.chatId ? route.params.chatId : ""
  );
  const [messageFailed, setMessageFailed] = useState("");
  const [replyingTo,setReplyingTo] = useState()
  // console.log(replyingTo)

  let loggedInUserData = useSelector((state) => state.auth.userData);
  // console.log(loggedInUserData.uid)

  let storedUsers = useSelector(state=>state.users.storedUser);
  // console.log(storedUsers)

  let allChatUsers = route?.params?.chatUsers;
  // console.log("all chat users"+JSON.stringify(allChatUsers));

  let selectedUserData = allChatUsers.find(
    (e) => e.uid !== loggedInUserData.uid
  );

  const messageData = useSelector((state) => {
    if (!chatId) {
      return [];
    }
    const allMessageData = state.messages.storedMessages[chatId];

    if (!allMessageData) {
      return [];
    }

    const messageList = [];
    for (let key in allMessageData) {
      const message = allMessageData[key];
      messageList.push({
        key,
        ...message,
      });
    }
    return messageList;
  });
  // console.log(messageData);

  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => {
        return (
          <View style={styles.headerContainer}>
            <TouchableOpacity onPress={() => navigation.navigate("ChatList")}>
              <AntDesign name="arrowleft" size={25} color="#fff" />
            </TouchableOpacity>
            <Image
              source={
                selectedUserData?.ProfilePicURL
                  ? { uri: selectedUserData?.ProfilePicURL }
                  : userProfilePic
              }
              style={styles.userImage}
              resizeMode="contain"
            />
            <Text style={styles.userName}>{selectedUserData?.name}</Text>
          </View>
        );
      },
      headerRight: () => {
        return (
          <View style={{ ...styles.headerContainer, paddingRight: 15 }}>
            <TouchableOpacity>
              <Feather name="phone-call" size={25} color="#fff" />
            </TouchableOpacity>
          </View>
        );
      },
    });
  }, [selectedUserData]);

  const SendMessageHandler = useCallback(async () => {
    try {
      let allChatUsersUid = await allChatUsers?.map((e) => e.uid);
      if (!chatId) {
        // console.log(allChatUsersUid);
        let newChatId = await SaveNewChat(
          loggedInUserData.uid,
          allChatUsersUid
        );
        await setChatId(newChatId);
        await saveMessage(newChatId, loggedInUserData.uid, messageText);
      } else {
        await saveMessage(chatId, loggedInUserData.uid, messageText);
      }
      setMessageText("");
    } catch (error) {
      if (error == "Error: PERMISSION_DENIED: Permission denied")
        [Alert.alert("permission Denied🙁", "please logout any login again")];
      console.log("Error" + error);
      setMessageFailed("message Sending failed");
      setTimeout(() => {
        setMessageFailed("");
      }, 5000);
    }
  }, [chatId, messageText]);

  const CameraHandler = () => {
    console.log("Camera opening ...📸");
  };


  return (
    <SafeAreaView style={styles.container} edges={["right", "left", "bottom"]}>
      <ImageBackground source={BackgroundImage} style={styles.image}>
        <View style={styles.innerContainer}>
          {!chatId && <ErrorBubble text="No messages yet😶. say HI👋" />}
          {messageFailed !== "" && (
            <View>
              <ErrorBubble
                text="Failed to Send Message🙁"
                style={{ color: "red" }}
              />
              <ErrorBubble
                text="Please Check your Internet connectivity 📶 and try again"
                style={{ color: "red", fontSize: 13 }}
              />
            </View>
          )}
          <FlatList
            data={messageData}
            renderItem={(e) => {
              return (
               <MessageBubble 
                  data={e.item} 
                  loggedInUserUid={loggedInUserData.uid} 
                  chatId={chatId} 
                  setReply={()=>setReplyingTo(e.item)}
               />
              );
            }}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </ImageBackground>

        {//  REPLYING CONTAINER ==============================>
          replyingTo &&
          <View style={styles.replyContainer}>
            <View style={{alignSelf:"flex-start",marginRight:20,alignItems:"center"}}>
               <Image
              source={
                   { uri: storedUsers[replyingTo.sentBy]?.ProfilePicURL ?? loggedInUserData?.ProfilePicURL} 
              }
              style={styles.userImage}
              resizeMode="contain"
            />
            <Text style={styles.replyName}>{storedUsers[replyingTo.sentBy]?.name??loggedInUserData.name}</Text>
            </View>
            <View style={{flex:1,backgroundColor:"#fff",padding:15,borderBottomLeftRadius:20,borderTopRightRadius:20,}}>

            <Text style={styles.replyText} numberOfLines={1}>{replyingTo.text}</Text>
            </View>
            <TouchableOpacity style={styles.replyCancelButton} onPress={()=>setReplyingTo()}>
            <AntDesign name="closecircleo" size={24} color="#fff"/>
            </TouchableOpacity>
          </View>
        }

      <View style={styles.inputContainer}>
        <TouchableOpacity>
          <Ionicons name="add-circle-outline" size={35} color="#FFF" />
        </TouchableOpacity>
        <TextInput
          placeholder="Type your message here"
          style={styles.textBox}
          selectionColor={"#6f4e37"}
          value={messageText}
          onChangeText={(text) => setMessageText(text)}
          onSubmitEditing={() => SendMessageHandler()}
          keyboardAppearance="light"
        />

        {
          //////////   CHANGING TO ICON WHEN SOMETHING IS TYPED IN INPUT BOX  ////////////////////////
          messageText ? (
            <TouchableOpacity onPress={() => SendMessageHandler()}>
              <Ionicons name="send-sharp" size={28} color="#fff" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => CameraHandler()}>
              <Feather name="camera" size={32} color="#FFF" />
            </TouchableOpacity>
          )
        }
      </View>
    </SafeAreaView>
  );
};

export default ChatScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "column",
  },
  image: {
    flex: 1,
  },
  innerContainer: {
    flexDirection: "column-reverse",
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 5,
  },
  userImage: {
    width: 40,
    height: 40,
    marginLeft: 5,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: "#fff",
    backgroundColor: "#6f4e37",
  },
  userName: {
    fontSize: 20,
    marginLeft: 10,
    color: "#fff",
    fontFamily: "Bold",
    letterSpacing: 1,
    alignSelf: "flex-start",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#6F4E37",
    paddingVertical: 10,
    paddingHorizontal: 10,
    height: 60,
  },
  textBox: {
    flex: 1,
    borderRadius: 10,
    marginHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: "#fff",
    paddingLeft: 15,
    paddingRight: 15,
    width: "70%",
    color: "#6f4e37",
    fontSize: 16,
    fontWeight: "bold",
  },
  replyContainer:{
     flexDirection:"row",
     alignItems:"center",
     paddingHorizontal:10,
     padding:5,
     backgroundColor:"#6f4e37",
     borderLeftWidth:4,
     borderColor:"#fff"
  },
  replyName:{
      fontFamily:"Bold",
      fontSize:16,
      color:"#fff"
  },
  replyText:{
    fontSize:15,
     fontFamily:"BoldItalic",
     color:"#6f4e37",
    //  backgroundColor:"#fff"
  },
  replyCancelButton:{
    alignSelf:"flex-start",
    marginLeft:5,
  },
});
