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
    private socket: any;
    private socketReady: boolean;
    private onCall: (id: string) => boolean;

    constructor(localStream: MediaStream, videoElements: HTMLVideoElement[], onCall: (id: string) => boolean) {
        this.socket = io.connect(`${window.location.origin}/`);

        this.socketReady = false;
        this.connections = new ConnectionList();
        this.videoElementManager = new videoElementManager(videoElements);
        this.localStream = localStream;
        this.onCall = onCall;

        this.socket.on("connect", this.onOpened)
            .on("message", this.onMessage);
    }

    public call = () => this.socketReady && this.socket.json.send({ type: "call" });

    public hangUp = () => {
        this.socket.json.send({ type: "bye" });
        this.videoElementManager.detachAllVideo();
        this.connections.stopAllConnections();
    }

    private onOpened = () => {
        console.log("Socket opend");
        this.socketReady = true;
        const roomname = getRoomName();
        this.socket.emit("enter", roomname);
        console.log(`enter to ${roomname}`);
    }

    private onMessage = (event: ISocketEvent) => {
        const conn = this.connections.getConnection(event.from);
        console.log("============= catch message ===========");
        console.log(event.type);
        console.log(event);
        console.log("=======================================");
        if (event.type === "call") {
            if (conn) {
                return;
            }
            if (this.connections.isConnectPossible()) {
                if (this.onCall(event.from))
                    this.socket.json.send({ type: "response", sendTo: event.from });
            } else {
                console.warn("max connections. so ignore call");
            }
        } else if (event.type === "response") {
            const c = conn || this.prepareNewConnection(event.from);

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
            this.setOffer(event);
            this.sendAnswer(event);
        } else if (event.type === "answer" && this.connections.isPeerStarted()) {
            this.setAnswer(event);
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
        this.socket.json.send({ ...sdp, id: sendTo, type: sdp.type });
    }

    private sendCandidate = (candidate: RTCIceCandidate, sendTo: string) => {

        this.socket.json.send({
            ...candidate,
            sendTo,
            type: "candidate",
        });
    }

    private setOffer = (evt: ISocketEvent) => {
        const id = evt.from;
        let conn = this.connections.getConnection(id);
        if (!conn) {
            conn = this.prepareNewConnection(id);

            const x = evt as RTCSessionDescriptionInit;
            conn.peerconnection.setRemoteDescription(new RTCSessionDescription(x) as RTCSessionDescriptionInit);
        } else {
            console.error("peerConnection alreay exist!");
        }
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

    private setAnswer = (evt: ISocketEvent) => {
        const id = evt.from;
        const conn = this.connections.getConnection(id);
        if (!conn) {
            console.error("peerConnection not exist!");
            return;
        }
        const x = evt as RTCSessionDescriptionInit;
        conn.peerconnection.setRemoteDescription(new RTCSessionDescription(x) as RTCSessionDescriptionInit);
    }

    private prepareNewConnection = (id: string) => {
        let peer = null;
        try {
            peer = new RTCPeerConnection({ iceServers: [{urls: "stun:stun.l.google.com:19302"}] });
        } catch (e) {
            console.log("Failed to create PeerConnection, exception: " + e.message);
            throw e;
        }
        const conn = new Connection(id, peer);
        this.connections.addConnection(id, conn);
        peer.onicecandidate = (evt) => {
            if (evt.candidate) {
                this.sendCandidate(
                    {
                        candidate: evt.candidate.candidate,
                        sdpMLineIndex: evt.candidate.sdpMLineIndex,
                        sdpMid: evt.candidate.sdpMid,
                    } as RTCIceCandidate,
                    conn.id,
                );
            } else {
                conn.established = true;
            }
        };
        peer.addStream(this.localStream);
        peer.addEventListener(
            "addstream",
            (event) => {
                this.videoElementManager.attachVideo(conn.id, event.stream!);
            },
            false,
        );
        peer.addEventListener(
            "removestream",
            () => {
                this.videoElementManager.detachVideo(conn.id);
            },
            false,
        );

        return conn;
    }

}
