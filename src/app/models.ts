interface _Track {
    instruments: _Instrument[],
    tempo: number,
    division: number,
    spatial: number,
    gain: number,
    length: number
}

interface _Node {
    key: string,
    instrument: _Instrument,
    waveType: string,
    envelope: number[],
    envelopeMaxAmplitude: number,
    filterFreq: number,
    filterType: string,
    length: number,
    start: number
}

interface _Instrument {
    name: string,
    frequencyMap: [],
    nodes: _Node[],
    spatial: number,
    gain: number
}

//create predefined instruments