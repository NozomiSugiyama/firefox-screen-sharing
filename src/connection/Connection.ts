export default class {
    public id: string;
    public peerconnection: RTCPeerConnection;
    constructor(
        id: string,
        peerconnection: RTCPeerConnection,
    ) {
        this.id = id;
        this.peerconnection = peerconnection;
    }
}
