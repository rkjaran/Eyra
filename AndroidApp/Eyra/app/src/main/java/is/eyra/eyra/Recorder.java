/*
Copyright 2016 The Eyra Authors. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

/*
File author/s:
    Matthias Petursson <oldschool01123@gmail.com>
*/

package is.eyra.eyra;

import android.content.Context;
import android.media.AudioFormat;
import android.media.AudioRecord;
import android.media.MediaRecorder;
import android.os.Environment;
import android.util.Log;

import java.io.ByteArrayOutputStream;
import java.io.DataOutput;
import java.io.DataOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.util.ArrayList;

/**
 * Created by matthiasp on 2/18/16.
 *
 * Simple class designed for multiple short recordings using android.media.AudioRecord.
 */
public class Recorder {

    private AudioRecord mAudioRecord = null;

    private static final int AUDIOSOURCE = MediaRecorder.AudioSource.VOICE_RECOGNITION;
    private static final int SAMPLERATE = 44100;
    private static final int CHANNELCONFIG = AudioFormat.CHANNEL_IN_MONO;
    private static final int AUDIOFORMAT = AudioFormat.ENCODING_PCM_16BIT;
    // might have to change this buffer size if we get problems recording
    private static final int BUFFERSIZE = AudioRecord.getMinBufferSize(SAMPLERATE, CHANNELCONFIG, AUDIOFORMAT) * 2;

    private static final String LOG_TAG = "RecorderLog";

    private short[] audioBuffer = new short[BUFFERSIZE];
    private ArrayList audioData = new ArrayList();

    public void startRecording() {
        mAudioRecord = new AudioRecord(AUDIOSOURCE, SAMPLERATE, CHANNELCONFIG, AUDIOFORMAT, BUFFERSIZE * 2);
        mAudioRecord.startRecording();
        new Thread(new Runnable() {
            @Override
            public void run() {
                while (mAudioRecord.getRecordingState() ==
                        AudioRecord.RECORDSTATE_RECORDING) {
                    int result = mAudioRecord.read(audioBuffer, 0, BUFFERSIZE);

                    for (int i = 0; i < audioBuffer.length; i++) {
                        audioData.add(audioBuffer[i]);
                    }
                }
            }
        }, "AudioRecorder Thread").start();
    }

    public byte[] stopRecording() {
        mAudioRecord.stop();

        // create wav
        int numChannels = CHANNELCONFIG == AudioFormat.CHANNEL_IN_MONO ? 1 : 2;
        RawToWav rtw = new RawToWav(SAMPLERATE, numChannels);
        // grab data from our audioData, convert it to short[]
        // for our rtw.convert() function
        Short[] tempData = new Short[audioData.size()];
        tempData = (Short[]) audioData.toArray(tempData);
        short[] data = new short[tempData.length];
        for (int i = 0; i < data.length; i++) {
            data[i] = tempData[i].shortValue();
        }
        byte[] wav = rtw.convert(data);

        readyForNextRecording();

        return wav;
    }

    // handles resetting of variables that need resetting after each recording
    private void readyForNextRecording() {
        audioData = new ArrayList();
    }
}
