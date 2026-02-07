import 'dart:typed_data';

class AudioUtils {
  static Uint8List addWavHeader(
    Uint8List pcmData, {
    int sampleRate = 24000,
    int numChannels = 1,
  }) {
    var header = ByteData(44);
    var totalDataLen = pcmData.length + 36;
    var byteRate = sampleRate * numChannels * 2; // 16-bit audio

    // RIFF chunk descriptor
    header.setUint8(0, 0x52); // 'R'
    header.setUint8(1, 0x49); // 'I'
    header.setUint8(2, 0x46); // 'F'
    header.setUint8(3, 0x46); // 'F'
    header.setUint32(4, totalDataLen, Endian.little);
    header.setUint8(8, 0x57); // 'W'
    header.setUint8(9, 0x41); // 'A'
    header.setUint8(10, 0x56); // 'V'
    header.setUint8(11, 0x45); // 'E'

    // fmt sub-chunk
    header.setUint8(12, 0x66); // 'f'
    header.setUint8(13, 0x6D); // 'm'
    header.setUint8(14, 0x74); // 't'
    header.setUint8(15, 0x20); // ' '
    header.setUint32(16, 16, Endian.little); // Subchunk1Size
    header.setUint16(20, 1, Endian.little); // AudioFormat (1 = PCM)
    header.setUint16(22, numChannels, Endian.little);
    header.setUint32(24, sampleRate, Endian.little);
    header.setUint32(28, byteRate, Endian.little);
    header.setUint16(32, numChannels * 2, Endian.little); // BlockAlign
    header.setUint16(34, 16, Endian.little); // BitsPerSample

    // data sub-chunk
    header.setUint8(36, 0x64); // 'd'
    header.setUint8(37, 0x61); // 'a'
    header.setUint8(38, 0x74); // 't'
    header.setUint8(39, 0x61); // 'a'
    header.setUint32(40, pcmData.length, Endian.little);

    var wavFile = Uint8List(44 + pcmData.length);
    wavFile.setAll(0, header.buffer.asUint8List());
    wavFile.setAll(44, pcmData);

    return wavFile;
  }
}
