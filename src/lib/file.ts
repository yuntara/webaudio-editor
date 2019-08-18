interface HTMLInputEvent extends Event {
    target: HTMLInputElement & EventTarget;
}

export const showOpenFileDialog = (accept:string = ".txt, text/plain") :Promise<File | null> =>  {
    return new Promise(resolve => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = accept;
        input.onchange = (event:HTMLInputEvent) => { 
            
            if(!event || !event.target){
                resolve(null);
            }else{
                resolve(event.target.files ? event.target.files[0] : null); 
            }
            input.remove();
            
        };
        input.click();
    });
};

export const readAsText = (file:File):Promise<string> => {
    return new Promise(resolve => {
        const reader = new FileReader();
        reader.readAsText(file);
        reader.onload = () => { resolve(reader.result as string); };
    });
};
export const readAsBuffer = (file:File):Promise<ArrayBuffer> => {
    return new Promise(resolve => {
        const reader = new FileReader();
        reader.readAsArrayBuffer(file);
        reader.onload = () => { resolve(reader.result as ArrayBuffer); };
    });
};
