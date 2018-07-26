import ClientAPI from "./ClientAPI";

window.addEventListener("load", () => main());

const main = async () => {
    const localVideo = document.querySelector("#local-video") as HTMLVideoElement;
    const socketButton = document.querySelector("#socket-button") as HTMLButtonElement;

    const videoElements = [
        document.querySelector("#webrtc-remote-video-0") as HTMLVideoElement,
    ];

    const stream = await navigator.mediaDevices.getUserMedia({ video: { mediaSource: "window" } as any });
    const socket = new ClientAPI(
        stream,
        videoElements,
        (id: string) => {
            const result = confirm(`call from ${id}`);
            socketButton.innerText = "Hang up";
            return result;
        },
    );
    localVideo.src = URL.createObjectURL(stream);
    localVideo.play();
    localVideo.volume = 0;

    let isCalling = false;
    socketButton.addEventListener(
        "click",
        () => {
            if (isCalling) {
                socket.hangUp();
                socketButton.innerText = "Connect";
                isCalling = false;
            } else {
                socket.call();
                socketButton.innerText = "Hang up";
                isCalling = true;
            }
        },
    );
};
