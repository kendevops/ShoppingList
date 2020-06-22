import React, { useState } from "react";
import { StyleSheet, Text, TextInput, View, Button, Image } from "react-native";
import { withAuthenticator } from "aws-amplify-react-native";
import DocumentPicker from "react-native-document-picker";
// import ImagePicker from "react-native-image-picker";
import * as ImagePicker from "expo-image-picker";
import Amplify, { Storage, Predictions } from "aws-amplify";
import awsconfig from "./aws-exports";
import { AmazonAIPredictionsProvider } from "@aws-amplify/predictions";

// import mic from "microphone-stream";

Amplify.configure(awsconfig);
Amplify.addPluggable(new AmazonAIPredictionsProvider());

function TextIdentification() {
  const [response, setResponse] = useState(
    "You can add a photo by uploading direcly from the app "
  );
  const [selectedImage, setSelectedImage] = useState(null);

  async function identifyFromFile() {
    setResponse("identifiying text...");

    let permissionResult = await ImagePicker.requestCameraRollPermissionsAsync();

    if (permissionResult.granted === false) {
      alert("Permission to access camera roll is required!");
      return;
    }

    let pickerResult = await ImagePicker.launchImageLibraryAsync();
    console.log(pickerResult);
    if (pickerResult.cancelled === true) {
      return;
    }
    setSelectedImage({ localUri: pickerResult.uri });

    Predictions.identify({
      text: {
        source: {
          selectedImage,
        },
        format: "PLAIN", // Available options "PLAIN", "FORM", "TABLE", "ALL"
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
        <Text>Text identification</Text>
        <Button onPress={identifyFromFile} title="Choose Image" />
        <Text>{response}</Text>
      </View>
    </View>
  );
}

function EntityIdentification() {
  const [response, setResponse] = useState("Click upload for test ");
  const [src, setSrc] = useState("");

  function identifyFromFile(event) {
    setResponse("searching...");

    const {
      target: { files },
    } = event;
    const [file] = files || [];

    if (!file) {
      return;
    }
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
        console.log(result);
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
          }).then(setSrc); // this should be better but it works
        }
        console.log({ entities });
        setResponse(names);
      })
      .catch((err) => console.log(err));
  }

  return (
    <View>
      <View>
        <Text>Entity identification</Text>
        <Button onPress={identifyFromFile} title="Entity f" />
        <Text>{response}</Text>
        <Image source="https://img.com"></Image>
      </View>
    </View>
  );
}

// function PredictionsUpload() {
//   /* This is Identify Entities Advanced feature
//    * This will upload user images to the appropriate bucket prefix
//    * and a Lambda trigger will automatically perform indexing
//    */
//   function upload(event) {
//     const {
//       target: { files },
//     } = event;
//     const [file] = files || [];
//     Storage.put(file.name, file, {
//       level: "protected",
//       customPrefix: {
//         protected: "protected/predictions/index-faces/",
//       },
//     });
//   }

//   return (
//     <View style={styles.text}>
//       <View>
//         <Text>Upload to predictions s3</Text>
//         <Button onChange={upload}></Button>
//       </View>
//     </View>
//   );
// }

function LabelsIdentification() {
  const [response, setResponse] = useState("Click upload for test ");

  function identifyFromFile() {
    const {
      target: { files },
    } = event;
    const [file] = files || [];

    if (!file) {
      return;
    }
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
        <Text>Labels identification</Text>
        <Button onPress={identifyFromFile} title="Label Identification" />
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

// function TextToSpeech() {
//   const [response, setResponse] = useState("...");
//   const [textToGenerateSpeech, setTextToGenerateSpeech] = useState(
//     "write to speech"
//   );

//   function generateTextToSpeech() {
//     setResponse("Generating audio...");
//     Predictions.convert({
//       textToSpeech: {
//         source: {
//           text: textToGenerateSpeech,
//         },
//         voiceId: "Amy", // default configured on aws-exports.js
//         // list of different options are here https://docs.aws.amazon.com/polly/latest/dg/voicelist.html
//       },
//     })
//       .then((result) => {
//         let AudioContext = window.AudioContext || window.webkitAudioContext;
//         console.log({ AudioContext });
//         const audioCtx = new AudioContext();
//         const source = audioCtx.createBufferSource();
//         audioCtx.decodeAudioData(
//           result.audioStream,
//           (buffer) => {
//             source.buffer = buffer;
//             source.connect(audioCtx.destination);
//             source.start(0);
//           },
//           (err) => console.log({ err })
//         );

//         setResponse(`Generation completed, press play`);
//       })
//       .catch((err) => setResponse(err));
//   }

//   function setText(event) {
//     setTextToGenerateSpeech(event.target.value);
//   }

//   return (
//     <View style={styles.text}>
//       <View>
//         <Text>Text To Speech</Text>
//         <TextInput value={textToGenerateSpeech} onChange={setText}></TextInput>
//         <Button onClick={generateTextToSpeech}>Text to Speech</Button>
//         <Text>{response}</Text>
//       </View>
//     </View>
//   );
// }

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
        <Text>Text Translation</Text>
        <TextInput value={textToTranslate} onChange={setText}></TextInput>
        <Button onPress={translate} title="Translate" />
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
        <Text>Text interpretation</Text>
        <TextInput
          value={textToInterpret}
          onChange={setText}
          placeholder="write some text here to interpret"
          style={{ borderColor: "black", borderWidth: 2 }}
        ></TextInput>
        <Button onPress={interpretFromPredictions} title="test" />
        <Text>{response}</Text>
      </View>
    </View>
  );
}

function App() {
  return (
    <View style={styles.container}>
      <Text>Translate Text</Text>
      <TextTranslation />

      <Text>Identify Text</Text>
      <TextIdentification />

      <Text>Identify Entities</Text>
      <EntityIdentification />

      <Text>Label Objects</Text>
      <LabelsIdentification />

      <Text>Text Interpretation</Text>
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

  // text: { padding: 20, fontWeight: "bold", fontSize: 20 },
  audioRecorder: {},
});

export default withAuthenticator(App);
