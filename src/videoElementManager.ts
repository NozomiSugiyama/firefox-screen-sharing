export default class {
    private videoElementsInUse: { [key: string]: HTMLVideoElement; } = {};
    private videoElementsStandBy: { [key: string]: HTMLVideoElement; } = {};

    constructor(videoElements: HTMLVideoElement[]) {
        for (const e of videoElements)
            this.videoElementsStandBy[e.id] = e;
    }

    public attachVideo = (id: string, stream: MediaStream) => {
        const videoElement = this.popVideoStandBy();
        if (videoElement) {
            videoElement.src = window.URL.createObjectURL(stream);
            this.videoElementsInUse[id] = videoElement;
            videoElement.style.display = "block";
        } else {
            console.error("--- no video element stand by.");
        }
    }

    public detachVideo = (id: string) => {
        const videoElement = this.popVideoInUse(id);
        if (videoElement) {
            videoElement.pause();
            videoElement.src = "";
            this.videoElementsStandBy[videoElement.id] = videoElement;
        } else {
            console.warn(`warning --- no video element using with id=${id}`);
        }
    }

    public detachAllVideo = () => {

        // tslint:disable-next-line:forin
        for (const id in this.videoElementsInUse) {
            this.detachVideo(id);
        }
    }

    private popVideoStandBy = () => {
        let element = null;

        // tslint:disable-next-line:forin
        for (const id in this.videoElementsStandBy) {
            element = this.videoElementsStandBy[id];
            delete this.videoElementsStandBy[id];
            return element;
        }
        return null;
    }

    private popVideoInUse = (id: string) => {
        const element = this.videoElementsInUse[id];
        delete this.videoElementsInUse[id];
        return element;
    }

}
