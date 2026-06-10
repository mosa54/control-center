export const maskCasualtyName = (value: string) => {
    const name = value.trim();
    if (name.length === 4) {
        return `${name[0]}O${name.slice(2)}`;
    }
    if (name.length === 3) {
        return `${name[0]}O${name[2]}`;
    }
    if (name.length === 2) {
        return `${name[0]}O`;
    }
    return value;
};
