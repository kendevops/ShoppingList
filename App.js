import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Amplify from "aws-amplify";
import config from "./aws-exports";

Amplify.configure(config);
Amplify.addPluggable(new AmazonAIPredictionsProvider());

export default function App() {
  return (
    <View style={styles.container}>
      <Text>Let the Project begin</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
