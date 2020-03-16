import React from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  Alert,
  ActivityIndicator
} from "react-native";
import Button from "react-native-button";
import { AppStyles } from "../AppStyles";
import { firebase } from "@react-native-firebase/auth"
import { GoogleSignin, GoogleSigninButton } from "@react-native-community/google-signin";
import { AsyncStorage } from "react-native";
const FBSDK = require("react-native-fbsdk");
const { LoginButton, LoginManager, AccessToken } = FBSDK;

class LoginScreen extends React.Component {
  static navigationOptions = {
    headerStyle: {
      backgroundColor: "white",
      borderBottomWidth: 0,
    }

  };
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      email: "",
      password: ""
    };
    GoogleSignin.configure({
      webClientId:
        "706061484183-l0l58dds4kg329fh1trbiha1ci5rqm5n.apps.googleusercontent.com"
    });
  }

  onPressLogin = () => {
    const { email, password } = this.state;
    if (email.length <= 0 || password.length <= 0) {
      // alert("Please fill out the required fields.");
      return;
    }
    firebase
      .auth()
      .signInWithEmailAndPassword(email, password)
      .then(response => {
        const { navigation } = this.props;
        user_uid = response.user._user.uid;
        firebase
          .firestore()
          .collection("users")
          .doc(user_uid)
          .get()
          .then(function(user) {
            if (user.exists) {
              AsyncStorage.setItem("@loggedInUserID:id", user_uid);
              AsyncStorage.setItem("@loggedInUserID:key", email);
              AsyncStorage.setItem("@loggedInUserID:password", password);
              navigation.dispatch({ type: "Login", user: user });
            } else {
              alert("User does not exist. Please try again.");
            }
          })
          .catch(function(error) {
            const { code, message } = error;
            alert(message);
          });
      })
      .catch(error => {
        const { code, message } = error;
        alert(message);
        // For details of error codes, see the docs
        // The message contains the default Firebase string
        // representation of the error
      });
  };

  onPressFacebook = () => {
    LoginManager.logInWithPermissions([
      "public_profile",
      "user_friends",
      "email"
    ]).then(
      result => {
        if (result.isCancelled) {
          alert("Whoops!", "You cancelled the sign in.");
        } else {
          AccessToken.getCurrentAccessToken().then(data => {
            const credential = firebase.auth.FacebookAuthProvider.credential(
              data.accessToken
            );
            const accessToken = data.accessToken;
            firebase
              .auth()
              .signInWithCredential(credential)
              .then(result => {
                var user = result.user;
                AsyncStorage.setItem(
                  "@loggedInUserID:facebookCredentialAccessToken",
                  accessToken
                );
                AsyncStorage.setItem("@loggedInUserID:id", user.uid);
                var userDict = {
                  id: user.uid,
                  fullname: user.displayName,
                  email: user.email,
                  profileURL: user.photoURL
                };
                var data = {
                  ...userDict,
                  appIdentifier: "rn-android-universal-listings"
                };
                firebase
                  .firestore()
                  .collection("users")
                  .doc(user.uid)
                  .set(data);
                this.props.navigation.dispatch({
                  type: "Login",
                  user: userDict
                });
              })
              .catch(error => {
                alert("Please try again! " + error);
              });
          });
        }
      },
      error => {
        Alert.alert("Sign in error", error);
      }
    );
  };

  onPressGoogle = () => {
    this.setState({ loading: true });
    GoogleSignin.signIn()
      .then(data => {
        console.log("data", data);
        // Create a new Firebase credential with the token
        const credential = firebase.auth.GoogleAuthProvider.credential(
          data.idToken
        );
        // Login with the credential
        const accessToken = data.idToken;
        AsyncStorage.setItem(
          "@loggedInUserID:googleCredentialAccessToken",
          accessToken
        );
        return firebase.auth().signInWithCredential(credential);
      })
      .then(result => {
        this.setState({ loading: false });
        var user = result.user;
        AsyncStorage.setItem("@loggedInUserID:id", user.uid);
        var userDict = {
          id: user.uid,
          fullname: user.displayName,
          email: user.email,
          photoURL: user.photoURL
        };
        var data = {
          ...userDict,
          appIdentifier: "rn-android-universal-listings"
        };
        console.log("data", data);
        firebase
          .firestore()
          .collection("users")
          .doc(user.uid)
          .set(data);
        this.props.navigation.dispatch({
          type: "Login",
          user: userDict
        });
      })
      .catch(error => {
        const { code, message } = error;
        this.setState({ loading: false }, () => {
          alert("Something went wrong");
        });
      });
  };

  render() {
    return (
      <View style={styles.container}>
        <Text style={[styles.title, styles.leftTitle]}>naughts</Text>
        <View style={styles.InputContainer}>
          <TextInput
            style={styles.body}
            placeholder="E-mail or phone number"
            onChangeText={text => this.setState({ email: text })}
            value={this.state.email}
            placeholderTextColor={AppStyles.color.blackish}
            underlineColorAndroid="transparent"
          />
        </View>
        <View style={styles.InputContainer}>
          <TextInput
            style={styles.body}
            secureTextEntry={true}
            placeholder="Password"
            onChangeText={text => this.setState({ password: text })}
            value={this.state.password}
            placeholderTextColor={AppStyles.color.blackish}
            underlineColorAndroid="transparent"
          />
        </View>
        <Button
          containerStyle={styles.loginContainer}
          style={styles.loginText}
          onPress={() => this.onPressLogin()}
        >
          Log in
        </Button>
        <Text style={styles.or}>or</Text>
        <Button
          containerStyle={styles.facebookContainer}
          style={styles.facebookText}
          onPress={() => this.onPressFacebook()}
        >
          Facebook
        </Button>
        {this.state.loading ? (
          <ActivityIndicator
            style={{ marginTop: 30 }}
            size="large"
            animating={this.state.loading}
            color={AppStyles.color.tint}
          />
        ) : (
          <GoogleSigninButton
            style={styles.googleContainer}
            size={GoogleSigninButton.Size.Wide}
            color={GoogleSigninButton.Color.Dark}
            onPress={this.onPressGoogle}
          />
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    backgroundColor: AppStyles.color.white
  },
  or: {
    fontFamily: AppStyles.fontName.main,
    fontSize: 20,
    color: AppStyles.color.white,
    marginTop: 40,
    marginBottom: 10
  },
  title: {
    fontFamily: AppStyles.fontName.main,
    fontSize: AppStyles.fontSize.title,
    fontWeight: "100",
    color: AppStyles.color.purplish,
    marginTop: 20,
    marginBottom: 20
  },
  leftTitle: {
    alignSelf: "stretch",
    textAlign: "center",
    marginLeft: 0
  },
  content: {
    paddingLeft: 50,
    paddingRight: 50,
    textAlign: "center",
    fontSize: AppStyles.fontSize.content,
    color: AppStyles.color.text
  },
  loginContainer: {
    width: AppStyles.buttonWidth.main,
    backgroundColor: AppStyles.color.purplish,
    borderRadius: AppStyles.borderRadius.main,
    padding: 10,
    marginTop: 30
  },
  loginText: {
    color: AppStyles.color.white
  },
  placeholder: {
    fontFamily: AppStyles.fontName.text,
    color: "red"
  },
  InputContainer: {
    width: AppStyles.textInputWidth.main,
    marginTop: 30,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: AppStyles.color.purplish,
    borderRadius: AppStyles.borderRadius.main
  },
  body: {
    height: 42,
    paddingLeft: 20,
    paddingRight: 20,
    color: AppStyles.color.text
  },
  facebookContainer: {
    width: AppStyles.buttonWidth.main,
    backgroundColor: AppStyles.color.facebook,
    borderRadius: AppStyles.borderRadius.main,
    padding: 10,
    marginTop: 30
  },
  facebookText: {
    color: AppStyles.color.white
  },
  googleContainer: {
    width: 50,
    height: 48,
    marginTop: 30
  },
  googleText: {
    color: AppStyles.color.white
  }
});

export default LoginScreen;
