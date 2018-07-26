
export default () => {
    const url = document.location.href;
    const args = url.split("?");
    if (args.length > 1) {
        const room = args[1];
        if (room !== "") {
            return room;
        }
    }
    return "_defaultroom";
};
