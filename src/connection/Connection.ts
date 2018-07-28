export default class {
    public id: string;
    public iceReady: boolean;
    public peerconnection: RTCPeerConnection;
    constructor(
        id: string,
        peerconnection: RTCPeerConnection,
    ) {
        this.id = id;
        this.peerconnection = peerconnection;
        this.iceReady = false;
    }
}
