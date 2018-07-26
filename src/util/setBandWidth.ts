const audioBandwidth = 50;
const videoBandwidth = 128;

export default (sdp: string) => {
    let x = sdp;
    x = x.replace(/a=mid:audio\r\n/g, `a=mid:audio\r\nb=AS:${audioBandwidth}\r\n`);
    x = x.replace(/a=mid:video\r\n/g, `a=mid:video\r\nb=AS:${videoBandwidth}\r\n`);
    return x;
};
