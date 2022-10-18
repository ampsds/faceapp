const video = document.getElementById("video");

Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri("./weights"), //カメラの中の顔を探すmodule
  //faceapi.nets.faceLandmark68Net.loadFromUri("./weights"), //目、鼻、口を探すmodule
  faceapi.nets.faceRecognitionNet.loadFromUri("./weights"), //顔付きボックス
  faceapi.nets.faceExpressionNet.loadFromUri("./weights"), //表情を判断するmodule
  faceapi.nets.ageGenderNet.loadFromUri("./weights"), //年齢性別を判断するmodule
]).then(startVideo);

function startVideo() {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then(function (stream) {
        video.srcObject = stream;
      })
      .catch(function (err) {
        console.error(err);
      });
  }

  video.addEventListener("play", () => {
    const canvas = faceapi.createCanvasFromMedia(video);
    document.body.append(canvas);
    const displaySize = { width: video.width, height: video.height };
    faceapi.matchDimensions(canvas, displaySize);

    setInterval(async () => {
      const detections = await faceapi
        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()) //カメラの中にいる顔をすべて認識
        //.withFaceLandmarks() //目、鼻、口を探す
        .withFaceExpressions() ////表情を判断する
        .withAgeAndGender(); //年齢性別を判断する

      const resizedDetections = faceapi.resizeResults(detections, displaySize);
      
      canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height); //顔に付いて回るボックス
      faceapi.draw.drawDetections(canvas, resizedDetections); //顔に箱付きの表現
      //faceapi.draw.drawFaceLandmarks(canvas, resizedDetections); //目鼻口点線表現
      faceapi.draw.drawFaceExpressions(canvas, resizedDetections); //感情情報表現
      
      resizedDetections.forEach((detection) => {
        //年齢、性別表現ボックス
        const box = detection.detection.box;
        const drawBox = new faceapi.draw.DrawBox(box, {
          label: Math.round(detection.age) + " year old " + detection.gender,
        });

        drawBox.draw(canvas);
      });
    }, 100);
  });