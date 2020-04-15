//The models used for the project
export interface _Track {
    instruments: _Instrument[],
    tempo: number,
    division: number,
    spatial: number,
    gain: number,
    length: number
}

export interface _Node {
    id: number,
    key: string,
    instrument: _Instrument,
    envelopeMaxAmplitude: number,
    length: number,
    start: number
}

export interface _Instrument {
    id: number,
    name: string,
    frequencyMap: [],
    nodes: _Node[],
    spatial: number,
    gain: number,
    waveType: OscillatorType,
    envelope: number[],
    filterdata: _FilterData[]
}

export interface _AudioNodeData {
    modelId: number,
    audioNodeName: string,
    audioNodeData: AudioNode
}

export interface _FilterData {
    filterFreq: number,
    filterType: BiquadFilterType
}