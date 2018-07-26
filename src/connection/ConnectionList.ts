import Connection from "./Connection";

const MAX_CONNECTION_COUNT = 3;

export default class {
    private connections: { [key: string]: Connection; } = {};

    // tslint:disable-next-line:no-empty
    constructor() {}

    public getConnection = (id: string) => this.connections[id] || null;

    public isConnectPossible = () => Object.keys(this.connections).length < MAX_CONNECTION_COUNT ? true : false;

    public isPeerStarted = () => Object.keys(this.connections).length > 0 ? true : false;

    public addConnection = (id: string, connection: Connection) => {
        this.connections[id] = connection;
    }

    public stopAllConnections = () => {

        // tslint:disable-next-line:forin
        for (const id in this.connections) {
            const conn = this.connections[id];
            conn.peerconnection.close();

            delete this.connections[id];
        }
    }

    public stopConnection = (id: string) => {
        const conn = this.connections[id];
        if (conn) {
            conn.peerconnection.close();

            delete this.connections[id];
        }
    }

}
