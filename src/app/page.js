"use client";
import { useState, useRef, useEffect } from "react";
import { MdDeleteOutline } from "react-icons/md";
import Wavify from "react-wavify";

export default function Home() {
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [countdown, setCountdown] = useState(null);
    const [audioData, setAudioData] = useState(null);
    const [amplitude, setAmplitude] = useState(40);
    const [frequencyAmplitude, setFrequencyAmplitude] = useState(40);
    const [waveformType, setWaveformType] = useState("Amplitude");

    const audioChunks = useRef([]);
    const mediaRecorderRef = useRef(null);
    const analyserRef = useRef(null);
    const audioContextRef = useRef(null);
    const dataArray = useRef(new Uint8Array(2048));
    const frequencyData = useRef(new Uint8Array(2048));

    useEffect(() => {
        if (isRecording && !isPaused && analyserRef.current) {
            updateWaveform();
        }
    }, [isRecording, isPaused]);

    const startRecordingCountdown = () => {
        setCountdown(3);
        let count = 3;
        const countdownInterval = setInterval(() => {
            count -= 1;
            setCountdown(count);
            if (count === 0) {
                clearInterval(countdownInterval);
                setCountdown(null);
                setIsRecording(true);
                startRecorder();
            }
        }, 1000);
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
        }
        setIsRecording(false);
        setIsPaused(false);
    };

    const togglePauseResume = () => {
        if (mediaRecorderRef.current) {
            if (isPaused) {
                mediaRecorderRef.current.resume();
                setIsPaused(false);
            } else {
                mediaRecorderRef.current.pause();
                setIsPaused(true);
            }
        }
    };

    const startRecorder = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
            });
            const mediaRecorder = new MediaRecorder(stream);
            const audioContext = new (window.AudioContext ||
                window.webkitAudioContext)();
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 2048;
            audioContextRef.current = audioContext;
            analyserRef.current = analyser;

            const source = audioContext.createMediaStreamSource(stream);
            source.connect(analyser);

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    audioChunks.current.push(e.data);
                }
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunks.current, {
                    type: "audio/wav",
                });
                const audioUrl = URL.createObjectURL(audioBlob);
                setAudioData(audioUrl);
                audioChunks.current = [];
            };

            mediaRecorder.start();
            mediaRecorderRef.current = mediaRecorder;
            updateWaveform();
        } catch (error) {
            console.error("Error accessing microphone:", error);
        }
    };

    const updateWaveform = () => {
        const analyser = analyserRef.current;

        const update = () => {
            if (!isPaused && analyser) {
                analyser.getByteTimeDomainData(dataArray.current);
                const averageAmplitude =
                    dataArray.current.reduce((sum, value) => sum + value, 0) /
                    dataArray.current.length;
                setAmplitude(averageAmplitude);
                analyser.getByteFrequencyData(frequencyData.current);
                const averageFrequencyAmplitude =
                    frequencyData.current.reduce(
                        (sum, value) => sum + value,
                        0
                    ) / frequencyData.current.length;
                setFrequencyAmplitude(averageFrequencyAmplitude * 10);
            }
            requestAnimationFrame(update);
        };
        update();
    };

    const deleteRecordingAndReset = () => {
        setAudioData(null);
        setIsRecording(false);
    };

    const downloadRecording = () => {
        if (audioData) {
            const a = document.createElement("a");
            a.href = audioData;
            a.download = "audio.wav";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }
    };

    return (
        <>
            {!isPaused && isRecording && (
                <div className="absolute left-0 top-80 w-full z-0">
                    <Wavify
                        fill="#ffff99"
                        paused={false}
                        style={{ height: "600px" }}
                        options={{
                            height: 75,
                            amplitude:
                                waveformType === "Amplitude"
                                    ? amplitude
                                    : frequencyAmplitude,
                            speed: 0.25,
                            bones: 5,
                        }}
                    />
                </div>
            )}
            <p className="flex justify-center text-yellow-500 mt-5 text-3xl">
                Babble
            </p>
            <div className="flex justify-center items-center w-screen h-screen">
                {!isRecording && !countdown && (
                    <button
                        onClick={startRecordingCountdown}
                        className="button"
                        style={{ fontSize: "24px" }}
                    >
                        Start
                    </button>
                )}
                {countdown && (
                    <div className="recording" style={{ fontSize: "30px" }}>
                        {countdown}
                    </div>
                )}
                {isRecording && !countdown && (
                    <div className="flex flex-col items-center z-10 relative">
                        <div className="flex justify-center items-center gap-10">
                            <button
                                onClick={
                                    isPaused ? stopRecording : togglePauseResume
                                }
                                className="recording"
                                style={{
                                    fontSize: "24px",
                                    width: "150px",
                                    height: "150px",
                                    borderRadius: "50%",
                                    backgroundColor: "#fff",
                                }}
                            >
                                Done
                            </button>
                            {isPaused && (
                                <button
                                    onClick={togglePauseResume}
                                    className="resume"
                                    style={{
                                        fontSize: "24px",
                                        width: "120px",
                                        height: "120px",
                                        borderRadius: "50%",
                                        backgroundColor: "#f4a261",
                                        marginTop: "0vh",
                                        marginRight: "0vh",
                                    }}
                                >
                                    Resume
                                </button>
                            )}
                        </div>
                        <div
                            className="delete"
                            onClick={deleteRecordingAndReset}
                            style={{
                                backgroundColor: "#cf2828",
                                padding: "10px",
                                borderRadius: "50%",
                                marginTop: "100px",
                                width: "60px",
                                height: "60px",
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                backgroundColor: "#ff7f7f",
                            }}
                        >
                            <MdDeleteOutline size={25} />
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}