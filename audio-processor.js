class AudioProcessor extends AudioWorkletProcessor {
    process(inputs) {
        const input = inputs[0];

        if (input.length > 0) {
            const inputData = input[0];
            this.port.postMessage(inputData);
        }
        return true;
    }
}

registerProcessor('audio-processor', AudioProcessor);