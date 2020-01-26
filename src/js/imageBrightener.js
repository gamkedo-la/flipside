//Bright Image worker
//Accepts an imageData object, manipulates it and returns it
onmessage = function(message) {
    const messageData = message.data;
    const imageData = messageData.imageData;
    const imageKey = messageData.key;

    processData(imageData.data);
    postMessage({key:imageKey, data:imageData, size:message.data.size});
}

//Range of 0 (no change) to 255 (completely white) - applies to all images
const BRIGHT_FACTOR = 155;

function processData(imageData) {
    let i = 0;
    for(; i <  imageData.length; i+=4) {
        if(imageData[i + 3] > 0.01) {
            imageData[i + 0] = clamp(imageData[i + 0] + BRIGHT_FACTOR, 0, 255);
            imageData[i + 1] = clamp(imageData[i + 1] + BRIGHT_FACTOR, 0, 255);
            imageData[i + 2] = clamp(imageData[i + 2] + BRIGHT_FACTOR, 0, 255);
        }
    }
    
    return imageData;
}

function clamp(value, low, high) {
    result = value;
    if(result < low) {
        result = low;
    } else if(result > high) {
        result = high;
    }

    return result;
}