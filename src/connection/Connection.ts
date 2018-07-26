export default class {
    public id: string;
    public established: boolean;
    public iceReady: boolean;
    public peerconnection: RTCPeerConnection;
    constructor(
        id: string,
        peerconnection: RTCPeerConnection,
    ) {
        this.id = id;
        this.peerconnection = peerconnection;
        this.established = false;
        this.iceReady = false;
    }
}
