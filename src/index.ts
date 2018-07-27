import ClientAPI from "./ClientAPI";

window.addEventListener("load", () => main());

const main = async () => {
    const localVideo = document.querySelector("#local-video") as HTMLVideoElement;
    const connectButton = document.querySelector("#connect-button") as HTMLButtonElement;
    const reconnectButton = document.querySelector("#reconnect-button") as HTMLButtonElement;
    const dialogWrapper = document.querySelector("#dialog-wrapper") as HTMLDivElement;

    const videoElements = [
        document.querySelector("#webrtc-remote-video-0") as HTMLVideoElement,
    ];

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { mediaSource: "screen" } as any });
        const socket = new ClientAPI(
            stream,
            videoElements,
            (id: string) => {
                const result = confirm(`Get a call from ${id}`);
                dialogWrapper.hidden = true;
                return result;
            },
        );
        localVideo.src = URL.createObjectURL(stream);
        localVideo.play();
        localVideo.volume = 0;

        connectButton.addEventListener(
            "click",
            () => {
                socket.call();
                dialogWrapper.hidden = true;
            },
        );
        reconnectButton.addEventListener(
            "click",
            () => socket.call(),
        );
    } catch (e) {
        console.error(e);
        alert(e);
        location.reload();
    }
};
