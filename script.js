let camSTREAM = null;
let timerId = null;

function finish(){
    camSTREAM.getTracks().forEach(track => track.stop())
    clearInterval(timerId);

    const videoWindow = document.getElementById("video");
    const canvasWindow = document.getElementById("canvas");

    videoWindow.remove();
    canvasWindow.remove();

}

function init(){ 
    const parent = document.getElementById("webcam-container");
    const child = document.createElement("video");
    
    const videoProp = parent.appendChild(child);
    videoProp.setAttribute("muted","")
    videoProp.setAttribute("autoplay","")
    videoProp.setAttribute("playsinline","")
    videoProp.setAttribute("id","video")
    videoProp.setAttribute("width","720")
    videoProp.setAttribute("height","560")

    Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri("./weights"), //カメラの中の顔を探すmodule
        //faceapi.nets.faceLandmark68Net.loadFromUri("./weights"), //目、鼻、口を探すmodule
        faceapi.nets.faceRecognitionNet.loadFromUri("./weights"), //顔付きボックス
        faceapi.nets.faceExpressionNet.loadFromUri("./weights"), //表情を判断するmodule
        faceapi.nets.ageGenderNet.loadFromUri("./weights"), //年齢性別を判断するmodule
    ]).then(startVideo);
}

function startVideo() {
    const video = document.getElementById("video");
    navigator.mediaDevices
        //.getUserMedia({ video: true })
        //.then(function (stream) {
        .getUserMedia({ video: true })
            .then((stream) => {
                camSTREAM = stream;
                video.srcObject = stream;
            })
            .catch((err) => {
                console.error(err);
            });
    
    video.addEventListener("play", () => {
        const canvas = faceapi.createCanvasFromMedia(video);
        //document.body.append(canvas);
        document.getElementById("webcam-container").appendChild(canvas);
        canvas.setAttribute("id","canvas")
        const displaySize = { width: video.width, height: video.height };
        faceapi.matchDimensions(canvas, displaySize);
        
        timerId = setInterval(async () => {

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
}
