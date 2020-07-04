import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  Button,
  Image,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { withAuthenticator } from "aws-amplify-react-native";
import * as ImagePicker from "expo-image-picker";

import Amplify, { Storage, Predictions } from "aws-amplify";
import awsconfig from "./aws-exports";
import { AmazonAIPredictionsProvider } from "@aws-amplify/predictions";

Amplify.configure(awsconfig);
Amplify.addPluggable(new AmazonAIPredictionsProvider());

function TextIdentification() {
  const [response, setResponse] = useState(
    "You can add a photo by uploading direcly from the app "
  );

  async function identifyFromFile() {
    setResponse("identifiying text...");

    let permissionResult = await ImagePicker.requestCameraRollPermissionsAsync();

    if (permissionResult.granted === false) {
      alert("Permission to access camera roll is required!");
      return;
    }

    let pickerResult = await ImagePicker.launchImageLibraryAsync();

    function dataURLtoFile(dataurl, filename) {
      var arr = dataurl.split(","),
        mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]),
        num = bstr.length,
        u8arr = new Uint8Array(num);

      while (num--) {
        u8arr[num] = bstr.charCodeAt(num);
      }

      return new File([u8arr], filename, { type: mime });
    }

    const file = dataURLtoFile(pickerResult.uri);
    console.log(file);

    Predictions.identify({
      text: {
        source: {
          file,
        },
        format: "ALL", // Available options "PLAIN", "FORM", "TABLE", "ALL"
      },
    })
      .then(({ text: { fullText } }) => {
        setResponse(fullText);
      })
      .catch((err) => setResponse(JSON.stringify(err, null, 2)));
  }

  return (
    <View style={styles.text}>
      <View>
        <Text style={styles.renderText}>Identify Text</Text>
        <Button
          onPress={identifyFromFile}
          title="Choose Image"
          style={styles.button}
        />
        <Text>{response}</Text>
      </View>
    </View>
  );
}

function EntityIdentification() {
  const [response, setResponse] = useState("Click upload for test ");
  const [image, setImage] = useState(null);

  async function identifyFromFile() {
    setResponse("searching...");
    let image = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
    });

    function dataURLtoFile(dataurl, filename) {
      var arr = dataurl.split(","),
        checkMatch = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]),
        num = bstr.length,
        u8arr = new Uint8Array(num);

      while (num--) {
        u8arr[num] = bstr.charCodeAt(num);
      }

      return new File([u8arr], filename, { type: checkMatch });
    }

    const file = dataURLtoFile(image.uri);

    Predictions.identify({
      entities: {
        source: {
          file,
        },
        /**For using the Identify Entities advanced features, enable collection:true and comment out celebrityDetection
         * Then after you upload a face with PredictionsUpload you'll be able to run this again
         * and it will tell you if the photo you're testing is in that Collection or not and display it*/
        //collection: true
        celebrityDetection: true,
      },
    })
      .then((result) => {
        const entities = result.entities;
        let imageId = "";
        let names = "";
        entities.forEach(
          ({ boundingBox, metadata: { name = "", externalImageId = "" } }) => {
            const {
              width, // ratio of overall image width
              height, // ratio of overall image height
              left, // left coordinate as a ratio of overall image width
              top, // top coordinate as a ratio of overall image heigth
            } = boundingBox;
            imageId = externalImageId;
            if (name) {
              names += name + " .";
            }
            console.log({ name });
          }
        );
        if (imageId) {
          Storage.get("", {
            customPrefix: {
              public: imageId,
            },
            level: "public",
          }).then(setImage); // this should be better but it works
        }
        console.log({ entities });
        setResponse(names);
      })
      .catch((err) => console.log(err));
  }
  return (
    <View>
      <View>
        <Text style={styles.renderText}>Identify Entities</Text>
        <Button
          onPress={identifyFromFile}
          title="Entity Identification"
          style={styles.button}
        />
        <Text>{response}</Text>
        {image && (
          <Image source={{ uri: image }} style={{ width: 200, height: 200 }} />
        )}
      </View>
    </View>
  );
}

function PredictionsUpload() {
  /* This is Identify Entities Advanced feature
   * This will upload user images to the appropriate bucket prefix
   * and a Lambda trigger will automatically perform indexing
   */
  async function upload() {
    let pix = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
    });

    function dataURLtoFile(dataurl, filename) {
      var arr = dataurl.split(","),
        checkMatch = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]),
        num = bstr.length,
        u8arr = new Uint8Array(num);

      while (num--) {
        u8arr[num] = bstr.charCodeAt(num);
      }

      return new File([u8arr], filename, { type: checkMatch });
    }

    let file = dataURLtoFile(pix.uri);

    Storage.put(file.name, file, {
      level: "protected",
      customPrefix: {
        protected: "protected/predictions/index-faces/",
      },
    });
  }

  return (
    <View style={styles.text}>
      <View>
        <Text>Upload to predictions s3</Text>
        <Button onPress={upload} title="Upload" style={styles.button} />
      </View>
    </View>
  );
}

function LabelsIdentification() {
  const [response, setResponse] = useState("Click upload for test ");

  async function identifyFromFile() {
    let image = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
    });

    function dataURLtoFile(dataurl, filename) {
      var arr = dataurl.split(","),
        checkMatch = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]),
        num = bstr.length,
        u8arr = new Uint8Array(num);

      while (num--) {
        u8arr[num] = bstr.charCodeAt(num);
      }

      return new File([u8arr], filename, { type: checkMatch });
    }

    const file = dataURLtoFile(image.uri);

    Predictions.identify({
      labels: {
        source: {
          file,
        },
        type: "ALL", // "LABELS" will detect objects , "UNSAFE" will detect if content is not safe, "ALL" will do both default on aws-exports.js
      },
    })
      .then((result) => setResponse(JSON.stringify(result, null, 2)))
      .catch((err) => setResponse(JSON.stringify(err, null, 2)));
  }

  return (
    <View style={styles.text}>
      <View>
        <Text style={styles.renderText}>Label Objects</Text>
        <Button
          onPress={identifyFromFile}
          title="Label Identification"
          style={styles.button}
        />
        <Text>{response}</Text>
      </View>
    </View>
  );
}

// function SpeechToText(props) {
//   const [response, setResponse] = useState(
//     "Press 'start recording' to begin your transcription. Press STOP recording once you finish speaking."
//   );

//   function AudioRecorder(props) {
//     const [recording, setRecording] = useState(false);
//     const [micStream, setMicStream] = useState();
//     const [audioBuffer] = useState(
//       (function () {
//         let buffer = [];
//         function add(raw) {
//           buffer = buffer.concat(...raw);
//           return buffer;
//         }
//         function newBuffer() {
//           console.log("reseting buffer");
//           buffer = [];
//         }

//         return {
//           reset: function () {
//             newBuffer();
//           },
//           addData: function (raw) {
//             return add(raw);
//           },
//           getData: function () {
//             return buffer;
//           },
//         };
//       })()
//     );

//     async function startRecording() {
//       console.log("start recording");
//       audioBuffer.reset();

//       window.navigator.mediaDevices
//         .getUserMedia({ video: false, audio: true })
//         .then((stream) => {
//           const startMic = new mic();

//           startMic.setStream(stream);
//           startMic.on("data", (chunk) => {
//             var raw = mic.toRaw(chunk);
//             if (raw == null) {
//               return;
//             }
//             audioBuffer.addData(raw);
//           });

//           setRecording(true);
//           setMicStream(startMic);
//         });
//     }

//     async function stopRecording() {
//       console.log("stop recording");
//       const { finishRecording } = props;

//       micStream.stop();
//       setMicStream(null);
//       setRecording(false);

//       const resultBuffer = audioBuffer.getData();

//       if (typeof finishRecording === "function") {
//         finishRecording(resultBuffer);
//       }
//     }

//     return (
//       <View style={styles.audioRecorder}>
//         <View>
//           {recording && <Button onClick={stopRecording}>Stop recording</Button>}
//           {!recording && (
//             <Button onClick={startRecording}>Start recording</Button>
//           )}
//         </View>
//       </View>
//     );
//   }

//   function convertFromBuffer(bytes) {
//     setResponse("Converting text...");

//     Predictions.convert({
//       transcription: {
//         source: {
//           bytes,
//         },
//         // language: "en-US", // other options are "en-GB", "fr-FR", "fr-CA", "es-US"
//       },
//     })
//       .then(({ transcription: { fullText } }) => setResponse(fullText))
//       .catch((err) => setResponse(JSON.stringify(err, null, 2)));
//   }

//   return (
//     <View style={styles.text}>
//       <View>
//         <Text>Speech to text</Text>
//         <AudioRecorder finishRecording={convertFromBuffer} />
//         <Text>{response}</Text>
//       </View>
//     </View>
//   );
// }

function TextToSpeech() {
  const [response, setResponse] = useState("...");
  const [textToGenerateSpeech, setTextToGenerateSpeech] = useState(
    "write to speech"
  );

  function generateTextToSpeech() {
    setResponse("Generating audio...");

    Predictions.convert({
      textToSpeech: {
        source: {
          text: textToGenerateSpeech,
        },
        voiceId: "Amy", // default configured on aws-exports.js
        // list of different options are here https://docs.aws.amazon.com/polly/latest/dg/voicelist.html
      },
    })
      .then((result) => {
        const audio = new Audio();
        audio.src = result.speech.url;
        audio.play();
        setResponse(`Generation completed`);
      })
      .catch((err) => setResponse(err));
  }

  const setText = (value) => {
    setTextToGenerateSpeech(value);
  };

  return (
    <View style={styles.text}>
      <View>
        <Text style={styles.renderText}>Speech Generation</Text>
        <TextInput
          placeholder={textToGenerateSpeech}
          onChangeText={setText}
          style={styles.input}
        ></TextInput>
        <Button
          onPress={generateTextToSpeech}
          title="Text to Speech"
          style={styles.button}
        />
        <Text>{response}</Text>
      </View>
    </View>
  );
}

function TextTranslation() {
  const [response, setResponse] = useState(
    "Input some text and click enter to test"
  );
  const [textToTranslate, setTextToTranslate] = useState("write to translate");

  function translate() {
    Predictions.convert({
      translateText: {
        source: {
          text: textToTranslate,
          // language : "es" // defaults configured on aws-exports.js
          // supported languages https://docs.aws.amazon.com/translate/latest/dg/how-it-works.html#how-it-works-language-codes
        },
        // targetLanguage: "en"
      },
    })
      .then((result) => setResponse(JSON.stringify(result, null, 2)))
      .catch((err) => setResponse(JSON.stringify(err, null, 2)));
  }

  function setText(event) {
    setTextToTranslate(event.target.value);
  }

  return (
    <View style={styles.text}>
      <View>
        <Text style={styles.renderText}>Translate Text</Text>

        <TextInput
          value={textToTranslate}
          onChange={setText}
          style={styles.input}
        />
        <Button onPress={translate} title="Translate" style={styles.button} />
        <Text>{response}</Text>
      </View>
    </View>
  );
}

function TextInterpretation() {
  const [response, setResponse] = useState(
    "Input some text and click enter to test"
  );
  const [textToInterpret, setTextToInterpret] = useState("");

  function interpretFromPredictions() {
    Predictions.interpret({
      text: {
        source: {
          text: textToInterpret,
        },
        type: "ALL",
      },
    })
      .then((result) => setResponse(JSON.stringify(result, null, 2)))
      .catch((err) => setResponse(JSON.stringify(err, null, 2)));
  }

  function setText(event) {
    setTextToInterpret(event.target.value);
  }

  return (
    <View style={styles.text}>
      <View>
        <Text style={styles.renderText}>Text Interpretation</Text>
        <TextInput
          value={textToInterpret}
          onChange={setText}
          placeholder="write some text here to interpret"
          style={styles.input}
        />
        <Button
          onPress={interpretFromPredictions}
          title="test"
          style={styles.button}
        />
        <Text>{response}</Text>
      </View>
    </View>
  );
}

function App() {
  return (
    <View style={styles.container}>
      <TextTranslation />
      <TextToSpeech />
      <TextIdentification />
      <EntityIdentification />
      <PredictionsUpload />
      <LabelsIdentification />
      <TextInterpretation />
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

  input: {
    width: "80%",
    borderColor: "black",
    borderWidth: 1,
    padding: 10,
    margin: 10,
  },

  button: {
    width: "80%",
    padding: 10,
    margin: 5,
    borderWidth: 1,
    backgroundColor: "#0000D0",
    borderRadius: 10,
  },

  renderText: {
    textAlign: "center",
    fontSize: 20,
    padding: 10,
  },
});

export default withAuthenticator(App);
