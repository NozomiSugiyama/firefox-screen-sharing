import Socket from "./socket";

window.addEventListener("load", () => main());

const main = async () => {
    const localVideo = document.querySelector("#local-video") as HTMLVideoElement;

    const startVideoButton = document.querySelector("#start-video-button") as HTMLButtonElement;
    const stopVideoButton  = document.querySelector("#stop-video-button") as HTMLButtonElement;
    const connectButton    = document.querySelector("#connect-button") as HTMLButtonElement;
    const hangUpButton     = document.querySelector("#hang-up-button") as HTMLButtonElement;

    const videoElements = [
        document.querySelector("#webrtc-remote-video-0") as HTMLVideoElement,
        document.querySelector("#webrtc-remote-video-1") as HTMLVideoElement,
        document.querySelector("#webrtc-remote-video-2") as HTMLVideoElement,
    ];

    let stream: MediaStream | null = null;
    let socket: Socket | null      = null;

    startVideoButton.addEventListener(
        "click",
        async () => {
            stream = await navigator.mediaDevices.getUserMedia({ video: { mediaSource: "window" } as any });
            localVideo.src = URL.createObjectURL(stream);
            localVideo.play();
            localVideo.volume = 0;
            socket = new Socket(stream, videoElements);
        },
    );
    stopVideoButton.addEventListener(
        "click",
        () => {
            localVideo.src = "";
        },
    );
    connectButton.addEventListener(
        "click",
        () => {
            if (socket) socket.call();
        },
    );
    hangUpButton.addEventListener(
        "click",
        () => {
            if (socket) socket.hangUp();
        },
    );
};
