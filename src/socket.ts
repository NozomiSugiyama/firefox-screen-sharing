import * as io from "socket.io-client";
import Connection from "./connection/Connection";
import ConnectionList from "./connection/ConnectionList";
import getRoomName from "./util/getRoomName";
import setBandwidth from "./util/setBandWidth";
import videoElementManager from "./videoElementManager";

const mediaConstraints = { mandatory: { OfferToReceiveAudio: true, OfferToReceiveVideo: true } } as RTCOfferOptions;

export interface ISocketEvent {
    from: string;
    sendTo: string;
    type: "call" | "response" | "candidate" | "bye" | "offer" | "pranswer" | "answer";
    sdp?: string;
    candidate?: string;
    sdpMLineIndex?: number;
    sdpMid?: string;
}

export default class {
    private localStream: MediaStream;
    private videoElementManager: videoElementManager;
    private connections: ConnectionList;
    private socket: SocketIOClient.Socket;
    private onCall: (id: string) => boolean;

    constructor(localStream: MediaStream, videoElements: HTMLVideoElement[], onCall: (id: string) => boolean) {
        this.socket = io.connect(`${window.location.origin}/`);

        this.connections = new ConnectionList();
        this.videoElementManager = new videoElementManager(videoElements);
        this.localStream = localStream;
        this.onCall = onCall;

        this.socket.on("connect", this.onOpened)
            .on("message", this.onMessage);
    }

    public call = () => this.socket.send({ type: "call" });

    public hangUp = () => {
        this.socket.send({ type: "bye" });
        this.videoElementManager.detachAllVideo();
        this.connections.stopAllConnections();
    }

    private onOpened = () => {
        console.log("Socket opend");
        const roomname = getRoomName();
        this.socket.emit("enter", roomname);
        console.log(`enter to ${roomname}`);
    }

    private onMessage = (event: ISocketEvent) => {
        const conn = this.connections.getConnection(event.from);
        console.log("catch message");
        console.log(event.type, event);
        if (event.type === "call") {
            if (conn) return;
            // tslint:disable-next-line:no-unused-expression
            else if (this.connections.isConnectPossible()) this.onCall(event.from) && this.socket.send({ type: "response", sendTo: event.from });
            else console.warn("max connections. so ignore call");
        } else if (event.type === "response") {
            let c = conn;
            if (!c) {
                const peer = createRTCPeerConnection();
                c = createConnection(event.from, peer, this.localStream, this.socket, this.videoElementManager);
                this.connections.addConnection(event.from, c);
            }

            if (c.peerconnection) {
                c.peerconnection.createOffer(mediaConstraints)
                    .then((sessionDescription) => {
                        if (!sessionDescription.sdp) {
                            console.log("Create Offer failed");
                            return;
                        }
                        sessionDescription.sdp = setBandwidth(sessionDescription.sdp);
                        c.iceReady = true;
                        c.peerconnection.setLocalDescription(sessionDescription);
                        this.sendSDP(sessionDescription, event.from);
                    })
                    .catch(() => {
                        console.log("Create Offer failed");
                    });
            }
        } else if (event.type === "offer") {
            if (!conn) {
                const peer = createRTCPeerConnection();
                const c = createConnection(event.from, peer, this.localStream, this.socket, this.videoElementManager);
                this.connections.addConnection(event.from, c);
                c.peerconnection.setRemoteDescription(new RTCSessionDescription(event as RTCSessionDescriptionInit) as RTCSessionDescriptionInit);
                this.sendAnswer(event);
            }
        } else if (event.type === "answer" && this.connections.isPeerStarted()) {
            if (!conn) {
                console.error("peerConnection not exist!");
                return;
            }
            conn.peerconnection.setRemoteDescription(new RTCSessionDescription(event as RTCSessionDescriptionInit) as RTCSessionDescriptionInit);
        } else if (event.type === "candidate" && this.connections.isPeerStarted()) {
            if (!conn) {
                console.error("peerConnection not exist!");
                return;
            }

            if (!conn.iceReady) {
                console.warn("PeerConn is not ICE ready, so ignore");
                return;
            }
            const candidate = new RTCIceCandidate({ sdpMLineIndex: event.sdpMLineIndex, sdpMid: event.sdpMid, candidate: event.candidate });
            conn.peerconnection.addIceCandidate(candidate);
        } else if (event.type === "bye" && this.connections.isPeerStarted()) {
            this.videoElementManager.detachVideo(event.from);
            this.connections.stopConnection(event.from);
        }
    }

    private sendSDP = (sdp: RTCSessionDescriptionInit, sendTo: string) => {
        this.socket.send({ ...sdp, id: sendTo, type: sdp.type });
    }

    private sendAnswer = (evt: ISocketEvent) => {
        const id = evt.from;
        const conn = this.connections.getConnection(id);
        if (!conn) {
            console.error("peerConnection not exist!");
            return;
        }

        conn.peerconnection.createAnswer(mediaConstraints)
            .then((sessionDescription) => {
                if (!sessionDescription.sdp) {
                    console.log("Create Answer failed");
                    return;
                }

                sessionDescription.sdp = setBandwidth(sessionDescription.sdp);

                conn.iceReady = true;
                conn.peerconnection.setLocalDescription(sessionDescription);
                this.sendSDP(sessionDescription, id);
            }).catch(() => {
                console.log("Create Answer failed");
            });

        conn.iceReady = true;
    }

}

const createConnection = (
    id: string,
    peer: RTCPeerConnection,
    localStream: MediaStream,
    socket: SocketIOClient.Socket,
    videoManager: videoElementManager,
) => {

    const conn = new Connection(id, peer);
    peer.onicecandidate = (evt) => {
        if (evt.candidate) {
            socket.send({
                candidate: evt.candidate.candidate,
                sdpMLineIndex: evt.candidate.sdpMLineIndex,
                sdpMid: evt.candidate.sdpMid,
                sendTo: id,
                type: "candidate",
            });
        } else {
            conn.established = true;
        }
    };
    peer.addStream(localStream);
    peer.addEventListener(
        "addstream",
        (event) => videoManager.attachVideo(conn.id, event.stream!),
        false,
    );
    peer.addEventListener(
        "removestream",
        () => videoManager.detachVideo(conn.id),
        false,
    );

    return conn;
};

const createRTCPeerConnection = () => new RTCPeerConnection({ iceServers: [{urls: "stun:stun.l.google.com:19302"}] });
